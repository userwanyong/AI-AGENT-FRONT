/**
 * 会话状态管理器 - 支持多会话独立状态，互不影响
 *
 * 核心思路：维护一个 Map<sessionId, SessionState>，
 * 每个会话拥有独立的消息、面板状态、流式读取器等。
 * 切换会话时保存当前状态到 Map，从 Map 恢复目标会话状态。
 * 后台会话的 SSE 流继续运行，数据写入 Map。
 */

/** 聊天消息 */
export interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
  timestamp: number;
  type?: string;
  subType?: string;
}

/** 阶段消息（思考/结果面板） */
export interface StageMessage {
  type: string;
  subType: string;
  content: string;
}

/** 每个会话的独立状态快照 */
export interface SessionState {
  sessionId: string;
  // 消息数据
  messages: ChatMessage[];
  thinkingMessages: StageMessage[];
  resultMessages: StageMessage[];
  // 流式状态
  loading: boolean;
  reader: ReadableStreamDefaultReader | null;
  abortController: AbortController | null;
  // 会话配置
  agentId: string;
  maxStep: string;
  sideBySideMode: boolean;
  showResultPanel: boolean;
  activeTab: string;
  // 分页
  messageCursor: number | null;
  hasMoreMessages: boolean;
  // 标记
  historyRendered: boolean;
  isNewChat: boolean;
  // 最后活跃时间（用于 LRU 清理）
  lastActiveTime: number;
}

/** 创建空的 SessionState */
export function createEmptySessionState(sessionId: string): SessionState {
  return {
    sessionId,
    messages: [],
    thinkingMessages: [],
    resultMessages: [],
    loading: false,
    reader: null,
    abortController: null,
    agentId: '',
    maxStep: '3',
    sideBySideMode: false,
    showResultPanel: false,
    activeTab: 'thinking',
    messageCursor: null,
    hasMoreMessages: false,
    historyRendered: true,
    isNewChat: true,
    lastActiveTime: Date.now(),
  };
}

/** 最大缓存非活跃会话数（正在流式输出的不计数） */
const MAX_CACHED_SESSIONS = 10;

export class SessionStateManager {
  private map = new Map<string, SessionState>();

  get(sessionId: string): SessionState | undefined {
    return this.map.get(sessionId);
  }

  set(sessionId: string, state: SessionState): void {
    this.map.set(sessionId, state);
  }

  /** 更新部分状态（浅合并） */
  update(sessionId: string, partial: Partial<SessionState>): void {
    const existing = this.map.get(sessionId);
    if (existing) {
      this.map.set(sessionId, { ...existing, ...partial });
    }
  }

  remove(sessionId: string): void {
    const state = this.map.get(sessionId);
    if (state?.reader) {
      // 不主动取消 reader，让流自然结束
      state.reader = null;
    }
    if (state?.abortController) {
      state.abortController = null;
    }
    this.map.delete(sessionId);
  }

  /** 获取所有正在流式输出的会话 ID */
  getStreamingSessionIds(): string[] {
    const result: string[] = [];
    this.map.forEach((state, id) => {
      if (state.loading) result.push(id);
    });
    return result;
  }

  /** 判断某个会话是否正在流式输出 */
  isStreaming(sessionId: string): boolean {
    return this.map.get(sessionId)?.loading ?? false;
  }

  /** 清理已完成且非活跃的会话状态，保留最近 N 个 */
  cleanup(activeSessionId: string): void {
    const entries = Array.from(this.map.entries());
    // 保留正在流式输出的
    const streaming = entries.filter(([_, s]) => s.loading);
    // 已完成的按最后活跃时间排序
    const completed = entries
      .filter(([_, s]) => !s.loading)
      .sort((a, b) => b[1].lastActiveTime - a[1].lastActiveTime);
    // 保留活跃会话 + 最近 N 个已完成的
    const toKeep = new Map<string, SessionState>();
    streaming.forEach(([id, s]) => toKeep.set(id, s));
    // 活跃会话必须保留
    const active = this.map.get(activeSessionId);
    if (active) toKeep.set(activeSessionId, active);
    // 保留最近完成的
    completed.slice(0, MAX_CACHED_SESSIONS).forEach(([id, s]) => toKeep.set(id, s));
    this.map = toKeep;
  }
}
