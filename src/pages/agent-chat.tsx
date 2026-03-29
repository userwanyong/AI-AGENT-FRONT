import { useNavigate, useParams } from 'react-router-dom';
import React, { useState, useEffect, useRef, useCallback } from 'react';

import { marked } from 'marked';
import hljs from 'highlight.js';
import {
  Layout,
  Button,
  Toast,
  Tooltip,
  Input,
  Popover,
  Avatar,
  Popconfirm,
} from '@douyinfe/semi-ui';
import {
  IconChevronDown,
  IconChevronUp,
  IconEdit,
  IconSidebar,
  IconTick,
  IconSearch,
  IconExit,
  IconSetting,
  IconDelete,
} from '@douyinfe/semi-icons';

import { DrawioViewer } from '../components/DrawioViewer';

import '../styles/agent-chat.css';
import { AiAgentService, UserService, AdminUserService, ConversationResponseDTO, MessagePageResponseDTO, MessageItemDTO } from '../services';
import { AgentResponseDTO } from '../services/admin-user-service';

// SVG 图标组件（遵循 frontend-design no-emoji 规则）
const RobotIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1.07A7.001 7.001 0 0 1 6.07 19H5a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73A2 2 0 0 1 12 2zm-1 9a5 5 0 0 0-5 5h10a5 5 0 0 0-5-5h-.01.01zm-2 3a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm4 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
  </svg>
);

const SunIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0-3a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0V5a1 1 0 0 1 1-1zm0 15a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0v-1a1 1 0 0 1 1-1zm9-8a1 1 0 0 1-1 1h-1a1 1 0 1 1 0-2h1a1 1 0 0 1 1 1zM4 12a1 1 0 0 1-1 1H2a1 1 0 1 1 0-2h1a1 1 0 0 1 1 1zm15.07-6.36a1 1 0 0 1 0 1.41l-.7.71a1 1 0 1 1-1.42-1.42l.71-.7a1 1 0 0 1 1.41 0zM6.34 17.66l-.71.7a1 1 0 1 1-1.41-1.41l.7-.71a1 1 0 0 1 1.42 1.42zm12.02 0a1 1 0 0 1-1.41 0l-.71-.7a1 1 0 1 1 1.42-1.42l.7.71a1 1 0 0 1 0 1.41zM6.34 6.34a1 1 0 0 1-1.42-1.42l.71-.7a1 1 0 1 1 1.41 1.41l-.7.71z"/>
  </svg>
);

const MoonIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z"/>
  </svg>
);

const SystemThemeIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
    <line x1="8" y1="21" x2="16" y2="21"/>
    <line x1="12" y1="17" x2="12" y2="21"/>
  </svg>
);

type ThemeMode = 'dark' | 'light' | 'system';

// 获取系统主题偏好
function getSystemTheme(): 'dark' | 'light' {
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

// 主题管理 hook（支持 dark / light / system 三态）
function useTheme() {
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'system' || saved === 'light' || saved === 'dark') return saved;
    return 'system'; // 默认跟随系统
  });

  // 解析实际生效的主题
  const resolvedTheme = themeMode === 'system' ? getSystemTheme() : themeMode;

  // 应用主题到 DOM
  const applyTheme = useCallback((effectiveTheme: 'dark' | 'light') => {
    document.documentElement.setAttribute('data-theme', effectiveTheme);
    if (effectiveTheme === 'dark') {
      document.body.setAttribute('body-semi-dark', '');
    } else {
      document.body.removeAttribute('body-semi-dark');
    }
  }, []);

  // 监听 themeMode 变化
  useEffect(() => {
    const effective = themeMode === 'system' ? getSystemTheme() : themeMode;
    applyTheme(effective);
    localStorage.setItem('theme', themeMode);
  }, [themeMode, applyTheme]);

  // 监听系统主题变化（仅在 system 模式下生效）
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (themeMode === 'system') {
        applyTheme(getSystemTheme());
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [themeMode, applyTheme]);

  // 三态切换：dark → light → system → dark
  const cycleTheme = useCallback(() => {
    setThemeMode((prev) => {
      if (prev === 'dark') return 'light';
      if (prev === 'light') return 'system';
      return 'dark';
    });
  }, []);

  return { themeMode, resolvedTheme, cycleTheme };
}

// 类型定义
interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
  timestamp: number;
  type?: string;
  subType?: string;
}

interface ChatHistory {
  id: string;
  title: string;
  messages: ChatMessage[];
  agentId: string;
  agentName?: string;
  maxStep: string;
  messageCount?: number;
  lastMessageAt?: string;
  createTime?: string;
  timestamp?: number;
}

interface StageMessage {
  type: string;
  subType: string;
  content: string;
}

// 主组件
export const AgentChatPage: React.FC = () => {
  const navigate = useNavigate();
  const { sessionId: urlSessionId } = useParams<{ sessionId?: string }>();
  const { themeMode: currentTheme, resolvedTheme, cycleTheme } = useTheme();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [selectedMaxStep, setSelectedMaxStep] = useState('3');
  const [chatHistories, setChatHistories] = useState<ChatHistory[]>([]);
  const [showCaseDropdown, setShowCaseDropdown] = useState(false);
  const [thinkingMessages, setThinkingMessages] = useState<StageMessage[]>([]);
  const [resultMessages, setResultMessages] = useState<StageMessage[]>([]);
  // 在组件内添加状态变量
  const [activeTab, setActiveTab] = useState('thinking'); // 当前激活的Tab
  const [showResultPanel, setShowResultPanel] = useState(false); // 是否显示结果面板
  const [sideBySideMode, setSideBySideMode] = useState(false); // 是否为左右并列模式
  const [showChatHistory, setShowChatHistory] = useState(true); // 是否显示对话历史栏
  const [showAgentDropdown, setShowAgentDropdown] = useState(false); // 顶部智能体下拉
  const [historyRendered, setHistoryRendered] = useState(false); // 历史记录是否已渲染完毕
  const [isNewChat, setIsNewChat] = useState(false); // 是否为新聊天
  const [currentSession, setCurrentSession] = useState(''); // 当前会话ID
  const [agentList, setAgentList] = useState<AgentResponseDTO[]>([]);
  // 首次加载/新建对话时顶部提示文案
  const [showIntroTip, setShowIntroTip] = useState(false);
  // 消息分页状态
  const [messageCursor, setMessageCursor] = useState<number | null>(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  // 会话标题编辑状态
  const [editingHistoryId, setEditingHistoryId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const thinkingPanelRef = useRef<HTMLDivElement>(null);
  const resultPanelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  // 游客模式：role=2 仅允许查看历史会话；允许新建与选智能体，但不能发送
  const isGuest = String((userInfo as any)?.role) === '2' || Number((userInfo as any)?.role) === 2;
  const isAdmin = String((userInfo as any)?.role) === '0' || Number((userInfo as any)?.role) === 0;
  // 记录是否因窗口过窄而自动折叠，避免覆盖用户手动选择
  const autoCollapsedRef = useRef(false);
  // 记录侧边栏显示状态的最新值，避免监听闭包拿到旧值
  const showChatHistoryRef = useRef(showChatHistory);
  useEffect(() => {
    showChatHistoryRef.current = showChatHistory;
  }, [showChatHistory]);

  const handleLogout = () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('userInfo');
      localStorage.removeItem('isLoggedIn');
      Toast.success('已退出登录');
      window.location.href = '/login';
    } catch (e) {
      console.error(e);
    }
  };

  const toLoginWithClear = () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('userInfo');
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('chatHistory');
    } catch (e) {}
    window.location.href = '/login';
  };

  const GuestLoginToastContent: React.FC = () => (
    <span>
      访客模式仅展示,不可操作
      <br />
      请选择其他登录方式
      <span
        style={{
          color: 'var(--semi-color-primary)',
          cursor: 'pointer',
          textDecoration: 'underline',
          margin: '0 2px',
        }}
        onClick={toLoginWithClear}
      >
        登录
      </span>
    </span>
  );

  const UseLoginToastContent: React.FC = () => (
    <span>
      当前账号权限不足，可使用访客身份
      <span
        style={{
          color: 'var(--semi-color-primary)',
          cursor: 'pointer',
          textDecoration: 'underline',
          margin: '0 2px',
        }}
        onClick={toLoginWithClear}
      >
        登录
      </span>
      查看效果
    </span>
  );

  const showGuestLoginToast = (level: 'info' | 'error' | 'warning' | 'success' = 'info') => {
    const opt = { content: <GuestLoginToastContent /> } as const;
    if (level === 'error') Toast.error(opt);
    else if (level === 'warning') Toast.warning(opt);
    else if (level === 'success') Toast.success(opt);
    else Toast.info(opt);
  };

  const showUseLoginToast = (level: 'info' | 'error' | 'warning' | 'success' = 'info') => {
    const opt = { content: <UseLoginToastContent /> } as const;
    if (level === 'error') Toast.error(opt);
    else if (level === 'warning') Toast.warning(opt);
    else if (level === 'success') Toast.success(opt);
    else Toast.info(opt);
  };

  // 获取智能体列表
  useEffect(() => {
    const fetchAgentList = async () => {
      try {
        const response = await AdminUserService.queryEnableAgent();
        if (response.data) {
          // 规范化 id，避免前后空格或转义导致匹配失败
          const normalized = response.data.map((a) => ({
            ...a,
            id: String(a.id).trim(),
            name: typeof a.name === 'string' ? a.name.trim() : String(a.name ?? ''),
          }));
          setAgentList(normalized);
          // 首次加载时，若未选择智能体，默认选择普通问答（id=28）
          // 并根据其策略设置面板模式
          setSelectedAgentId((prev) => {
            const next = prev && prev.trim() ? prev : '28';
            const strategy = normalized.find((a) => String(a.id).trim() === next)?.strategy;
            setSideBySideMode(strategy !== 'commonExecuteStrategy');
            if (strategy === 'commonExecuteStrategy') {
              setShowResultPanel(false);
            }
            return next;
          });
        }
      } catch (error) {
        console.error('获取智能体列表失败:', error);
      }
    };
    fetchAgentList();
  }, []);

  // 根据窗口宽度自动折叠/恢复侧边栏（阈值 910px）
  // 仅在组件挂载时注册监听，避免因为 showChatHistory 变化而重新触发导致手动展开被立刻收起
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 910) {
        // 小屏强制折叠，避免因闭包导致状态不同步
        setShowChatHistory(false);
        autoCollapsedRef.current = true;
      } else {
        // 仅在此前因自动折叠而收起时自动恢复，尊重用户手动折叠
        if (autoCollapsedRef.current && !showChatHistoryRef.current) {
          setShowChatHistory(true);
          autoCollapsedRef.current = false;
        }
      }
    };
    // 首次进入时也根据当前宽度处理
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 点击页面其他区域时关闭智能体下拉
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.agent-dropdown')) {
        setShowAgentDropdown(false);
      }
      // 点击其他区域时关闭“提问案例”下拉
      if (!target.closest('.case-dropdown')) {
        setShowCaseDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 主类型映射
  const stageTypeMap: Record<string, { name: string; color: string }> = {
    analysis: { name: '分析', color: '#1890ff' },
    complete: { name: '结果', color: '#52c41a' },
    summary: { name: '总结', color: '#52c41a' },
    execution: { name: '执行', color: '#5b72e7ff' },
    supervision: { name: '监督', color: '#dcd137ff' },
  };

  // 子类型映射
  const subTypeMap: Record<string, { name: string; color: string }> = {
    analysis_tools: { name: '工具选取', color: '#52c41a' },
    planning: { name: '制定计划', color: '#52c41a' },
    success: { name: '成功', color: '#52c41a' },
    fail: { name: '失败', color: '#b90707ff' },
    analysis_status: { name: '任务执行状态', color: '#52c41a' },
    analysis_history: { name: '执行历史评估', color: '#52c41a' },
    analysis_strategy: { name: '下一步策略', color: '#52c41a' },
    execution_target: { name: '执行目标', color: '#45c0d3ff' },
    execution_process: { name: '执行过程', color: '#45c0d3ff' },
    execution_result: { name: '执行结果', color: '#45c0d3ff' },
    supervision_completeness: { name: '内容完整性', color: '#c376d0ff' },
    supervision_match: { name: '需求匹配度', color: '#c376d0ff' },
    supervision_issues: { name: '问题识别', color: '#c376d0ff' },
    supervision_suggestions: { name: '改进建议', color: '#c376d0ff' },
    supervision_score: { name: '质量评分', color: '#c376d0ff' },
    supervision_pass: { name: '质量检查情况', color: '#c376d0ff' },
  };

  // 生成会话ID
  const generateSessionId = () => {
    const currentSession = Date.now().toString(36) + Math.random().toString(36).substring(2);
    setCurrentSession(currentSession);
    return currentSession;
  };

  // 初始化
  useEffect(() => {
    const renderer = new marked.Renderer();
    renderer.code = (code: string, infostring: string) => {
      const lang = (infostring || '').trim();
      const language = hljs.getLanguage(lang) ? lang : 'plaintext';
      const highlighted = hljs.highlight(code, { language }).value;
      const escaped = encodeURIComponent(code);
      return (
        `<div class="code-block">` +
        `<button class="copy-code-btn" data-code="${escaped}" title="复制">复制</button>` +
        `<pre><code class="hljs language-${language}">${highlighted}</code></pre>` +
        `</div>`
      );
    };

    marked.setOptions({
      renderer,
      highlight: function (code: string, lang: string) {
        const language = hljs.getLanguage(lang) ? lang : 'plaintext';
        return hljs.highlight(code, { language }).value;
      },
      langPrefix: 'hljs language-',
      pedantic: false,
      gfm: true,
      breaks: true,
      sanitize: false,
      smartypants: false,
      xhtml: false,
    });

    const clickHandler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;
      const btn = target.closest('.copy-code-btn') as HTMLElement | null;
      if (btn) {
        const raw = btn.getAttribute('data-code') || '';
        const text = decodeURIComponent(raw);
        navigator.clipboard.writeText(text).then(() => {
          Toast.success('已复制');
        });
      }
    };
    document.addEventListener('click', clickHandler);

    // 加载聊天历史
    loadChatHistory();

    // 根据 URL 判断：有 sessionId 则标记为加载中（由 urlSessionId useEffect 统一加载），否则新建
    if (urlSessionId) {
      // 不在此处调用 loadSessionChat，避免与 urlSessionId useEffect 重复加载
      setSessionId(urlSessionId);
      setHistoryRendered(false);
    } else {
      setIsNewChat(true);
      setShowIntroTip(true);
      setSessionId(generateSessionId());
    }

    return () => {
      document.removeEventListener('click', clickHandler);
    };
  }, []);

  // 响应 URL 中的 sessionId 变化（用户点击侧边栏历史项或浏览器前进/后退）
  useEffect(() => {
    if (!urlSessionId) return;
    // 跳过初始化阶段（已由 init useEffect 处理）
    if (urlSessionId === sessionId) return;

    // 切换会话，历史尚未渲染
    setHistoryRendered(false);
    setIsNewChat(false);

    // 清空思考和结果面板
    setInput('');
    setThinkingMessages([]);
    setResultMessages([]);
    setActiveTab('thinking');

    // 从历史列表中查找对应会话信息
    const chat = chatHistories.find((h) => h.id === urlSessionId);
    if (chat) {
      const strategy = agentList.find((a) => a.id === chat.agentId)?.strategy;
      setSideBySideMode(strategy !== 'commonExecuteStrategy');
      if (strategy === 'commonExecuteStrategy') {
        setShowResultPanel(false);
      }
      setSelectedAgentId(chat.agentId);
      setSelectedMaxStep(chat.maxStep);
    }

    setSessionId(urlSessionId);
    loadSessionChat(urlSessionId);
  }, [urlSessionId]);

  // 当智能体列表或历史记录/会话变化时，确保选中当前会话对应的智能体
  useEffect(() => {
    const currentHistory = chatHistories.find((h) => h.id === sessionId);
    if (currentHistory && currentHistory.agentId && selectedAgentId !== currentHistory.agentId) {
      setSelectedAgentId(currentHistory.agentId);
    }
  }, [agentList, chatHistories, sessionId]);

  // 控制简洁 高效”在首次加载/新建对话时浮现
  useEffect(() => {
    // 仅在首次/新建对话且尚未产生消息时显示
    setShowIntroTip(isNewChat && messages.length === 0);
  }, [isNewChat, messages.length]);

  // 加载聊天历史
  const loadChatHistory = async () => {
    try {
      // 从后端API获取历史记录（后端返回结构化 ConversationResponseDTO[]）
      const historyList: ConversationResponseDTO[] = await UserService.getUserHistory();

      if (historyList && historyList.length > 0) {
        const formattedHistories: ChatHistory[] = historyList.map((conv) => ({
          id: conv.sessionId,
          title: conv.title || '未命名对话',
          messages: [],
          agentId: String(conv.agentId),
          agentName: conv.agentName,
          maxStep: selectedMaxStep,
          messageCount: conv.messageCount,
          lastMessageAt: conv.lastMessageAt,
          createTime: conv.createTime,
          timestamp: conv.updateTime ? new Date(conv.updateTime).getTime() : undefined,
        }));

        setChatHistories(formattedHistories);
      } else {
        console.log('没有聊天历史或历史为空');
      }
    } catch (error) {
      console.error('加载聊天历史失败:', error);
    }
  };

  // 加载特定会话的聊天记录（使用分页消息接口）
  const loadSessionChat = async (sid: string) => {
    try {
      // 使用分页消息接口获取会话消息
      const pageData = await UserService.getPaginatedMessages(sid, undefined, 50);

      if (pageData && pageData.messages && pageData.messages.length > 0) {
        const formattedMessages: ChatMessage[] = [];

        // 将 MessageItemDTO 转换为 ChatMessage
        // 后端返回的消息已按时间正序排列
        pageData.messages.forEach((msg: MessageItemDTO) => {
          const role: 'user' | 'ai' = msg.role === 'user' ? 'user' : 'ai';
          const content = msg.content || '';
          formattedMessages.push({
            role,
            content,
            timestamp: msg.createTime ? new Date(msg.createTime).getTime() : Date.now(),
          });
        });

        // 更新分页状态
        setMessageCursor(pageData.nextCursor);
        setHasMoreMessages(pageData.hasMore);

        // 更新当前会话ID和消息
        setSessionId(sid);
        setMessages(formattedMessages);

        // 将加载的历史消息分别添加到两个面板，按策略区分
        const strategyAgentId =
          chatHistories.find((h) => h.id === sid)?.agentId || selectedAgentId;
        const currentStrategy = agentList.find((a) => a.id === strategyAgentId)?.strategy;
        formattedMessages.forEach((msg) => {
          if (currentStrategy === 'commonExecuteStrategy') {
            if (msg.role === 'user') {
              addMessage(msg.content);
            } else {
              addAIMessage(
                { type: msg.type || '', subType: msg.subType || '', content: msg.content },
                'thinking'
              );
            }
          } else {
            if (msg.role === 'user') {
              addMessage(msg.content, true);
            } else if (msg.type === 'summary') {
              addAIMessage(
                { type: msg.type || '', subType: msg.subType || '', content: msg.content },
                'result'
              );
            } else {
              addAIMessage(
                { type: msg.type || '', subType: msg.subType || '', content: msg.content },
                'thinking'
              );
            }
          }
        });

        // 更新历史记录中的消息（使用函数式更新，避免闭包捕获旧 chatHistories 覆盖 loadChatHistory 的结果）
        setChatHistories((prev) =>
          prev.map((h) => (h.id === sid ? { ...h, messages: formattedMessages } : h))
        );
        setHistoryRendered(true);
      }
      // 消息为空也标记渲染完成
      if (!pageData || !pageData.messages || pageData.messages.length === 0) {
        setHistoryRendered(true);
      }
    } catch (error) {
      console.error('加载会话聊天记录失败:', error);
      Toast.error('加载会话聊天记录失败');
      setHistoryRendered(true);
    }
  };

  // Tab点击处理函数
  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
  };
  const saveChatToHistory = (newMessages: ChatMessage[]) => {
    if (newMessages.length === 0) return;

    // 若当前所选智能体的 channel 为 temporary，则不进行本地历史新增/更新
    const currentAgentChannel = agentList.find((a) => a.id === selectedAgentId)?.channel;
    if (currentAgentChannel === 'temporary') {
      return;
    }

    const title =
      newMessages[0].content.substring(0, 30) + (newMessages[0].content.length > 30 ? '...' : '');

    const newHistory: ChatHistory = {
      id: sessionId,
      title,
      messages: newMessages,
      agentId: selectedAgentId,
      maxStep: selectedMaxStep,
      timestamp: Date.now(),
    };

    const updatedHistories = [newHistory, ...chatHistories.filter((h) => h.id !== sessionId)];

    // 限制历史记录数量
    const limitedHistories = updatedHistories.slice(0, 50);

    setChatHistories(limitedHistories);
    localStorage.setItem('chatHistory', JSON.stringify(limitedHistories));
  };

  // 删除聊天历史（调用后端接口并同步本地状态）
  const deleteChatHistory = async (id: string) => {
    try {
      const ok = await UserService.deleteUserHistory(id);
      if (ok) {
        const updatedHistories = chatHistories.filter((h) => h.id !== id);
        setChatHistories(updatedHistories);
        localStorage.setItem('chatHistory', JSON.stringify(updatedHistories));
        Toast.success('历史会话已删除');
        // 如果删除的是当前会话，跳转到首页（新建对话）
        if (id === sessionId) {
          createNewChat();
        }
      } else {
        Toast.error('删除失败，请稍后重试');
      }
    } catch (e) {
      console.error('删除聊天历史失败:', e);
      Toast.error('删除失败，请稍后重试');
    }
  };

  // 创建新聊天
  const createNewChat = () => {
    if (loading) {
      Toast.info('任务执行中，无法新建会话');
      return;
    }
    // 导航到根路径（新建对话）
    navigate('/');

    // 清空消息和面板
    setInput('');
    setMessages([]);
    setThinkingMessages([]);
    setResultMessages([]);
    setShowResultPanel(false); // 重置结果面板状态
    setActiveTab('thinking'); // 切换到思考Tab
    setSideBySideMode(false); // 重置为单面板模式
    // 首次进入模式：不向左侧历史栏插入未命名会话
    // 仅在真实发送消息后，通过 saveChatToHistory 生成历史
    setHistoryRendered(true);
    setIsNewChat(true);
    // 新建对话也显示并保留顶部提示
    setShowIntroTip(true);
    // 新建会话默认选择普通问答（id=28），并根据其策略设置面板模式
    setSelectedAgentId('28');
    const strategy = agentList.find((a) => String(a.id).trim() === '28')?.strategy;
    setSideBySideMode(strategy !== 'commonExecuteStrategy');
    if (strategy === 'commonExecuteStrategy') {
      setShowResultPanel(false);
    }
  };

  // 加载特定聊天历史
  const loadChat = (chat: ChatHistory) => {
    if (loading) {
      Toast.info('任务执行中，无法切换会话');
      return;
    }
    // 通过 URL 导航切换会话
    navigate(`/c/${chat.id}`);
  };

  // 发送消息
  const sendMessage = async () => {
    if (isGuest) {
      showGuestLoginToast('info');
      return;
    }
    if (!input.trim() || loading) return;
    // 未选择有效智能体时禁止发送并提示
    const hasValidAgent = selectedAgentId && agentList.some((a) => a.id === selectedAgentId);
    if (!hasValidAgent) {
      Toast.warning('请选择智能体');
      setShowAgentDropdown(true);
      return;
    }
    // 首次发送后切换到正常界面，并更新 URL
    if (isNewChat) {
      setIsNewChat(false);
      if (!historyRendered) {
        setHistoryRendered(true);
      }
      // 首次发送时导航到 /c/:sessionId，replace 避免回退到空白页
      navigate(`/c/${sessionId}`, { replace: true });
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content: input,
      timestamp: Date.now(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    // 添加用户消息
    addMessage(userMessage.content);

    // 保存到历史记录
    saveChatToHistory(updatedMessages);

    try {
      // 发送POST请求
      const response = await AiAgentService.chat(
        selectedAgentId,
        userMessage.content,
        sessionId,
        selectedMaxStep as unknown as number,
        input
      );

      if (!response.body) {
        throw new Error('响应流不存在');
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let buffer = ''; // 用于存储不完整的行

      const processStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              // 流结束
              setLoading(false);
              return;
            }

            // 解码数据块
            const chunk = decoder.decode(value, { stream: true });

            // 将新数据添加到缓冲区
            buffer += chunk;

            // 处理完整的行
            const lines = buffer.split('\n');
            // 保留最后一个可能不完整的行
            buffer = lines.pop() || '';

            for (let line of lines) {
              if (line.startsWith('data:')) {
                const data = line.substring(5).trim();

                if (data && data !== '[DONE]') {
                  try {
                    // 解析JSON或字符串
                    const parsed: unknown = JSON.parse(data);
                    const currentStrategy = agentList.find(
                      (a) => a.id === selectedAgentId
                    )?.strategy;

                    // 统一提取内容
                    let msg: StageMessage;
                    if (typeof parsed === 'string') {
                      msg = { type: '', subType: '', content: parsed };
                    } else if (parsed && typeof parsed === 'object') {
                      const obj = parsed as any;
                      const contentCandidate =
                        obj.content ??
                        obj.answer ??
                        obj.message ??
                        obj.text ??
                        obj.data ??
                        obj.result;
                      msg = {
                        type: obj.type ?? '',
                        subType: obj.subType ?? '',
                        content:
                          typeof contentCandidate === 'string'
                            ? contentCandidate
                            : String(contentCandidate ?? ''),
                      };
                    } else {
                      msg = { type: '', subType: '', content: String(parsed ?? '') };
                    }

                    // 根据策略分发到面板
                    if (currentStrategy === 'commonExecuteStrategy') {
                      addAIMessage(msg, 'thinking');
                    } else {
                      if (msg.type === 'summary') {
                        addAIMessage(msg, 'result');
                      } else {
                        addAIMessage(msg, 'thinking');
                      }
                    }
                  } catch (e) {
                    // 非JSON：作为纯文本事件处理
                    const currentStrategy = agentList.find(
                      (a) => a.id === selectedAgentId
                    )?.strategy;
                    const msg: StageMessage = { type: '', subType: '', content: data };
                    if (currentStrategy === 'commonExecuteStrategy') {
                      addAIMessage(msg, 'thinking');
                    } else {
                      addAIMessage(msg, 'thinking');
                    }
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error('读取流数据错误:', error);
          setLoading(false);
          Toast.error('连接中断，请重试');
        }
      };

      processStream();
    } catch (error) {
      console.error('发送消息失败:', error);
      Toast.error('发送消息失败，请重试');
      setLoading(false);
    }
  };

  // 添加AI消息
  const addAIMessage = (data: StageMessage, panel: 'thinking' | 'result') => {
    // 规范化内容，避免 marked 接收到 undefined/null
    const safeContent =
      typeof data.content === 'string'
        ? data.content
        : data.content != null
        ? String(data.content)
        : '';
    const normalized: StageMessage = {
      type: data.type || '',
      subType: data.subType || '',
      content: safeContent,
    };

    if (panel === 'thinking') {
      setThinkingMessages((prev) => [...prev, normalized]);
      setTimeout(() => scrollToBottom(thinkingPanelRef), 100);
    } else {
      setResultMessages((prev) => [...prev, normalized]);
      setTimeout(() => scrollToBottom(resultPanelRef), 100);

      // 当收到结果时，显示结果面板并切换到左右并列模式
      if (!showResultPanel) {
        setShowResultPanel(true);
        setSideBySideMode(true); // 切换到左右并列模式
      }

      // // 添加到消息列表
      // const aiMessage: ChatMessage = {
      //   role: 'ai',
      //   content,
      //   timestamp: Date.now()
      // };

      // setMessages(prev => {
      //   const updated = [...prev, aiMessage];
      //   saveChatToHistory(updated);
      //   return updated;
      // });
    }
  };

  // 添加用户消息
  const addMessage = (content: string, forceWriteBoth?: boolean) => {
    const userMessage = {
      type: 'user',
      subType: 'query',
      content,
    };
    // 优先根据当前会话ID在历史中找到 agentId，避免刚切换时使用旧的 selectedAgentId
    const strategyAgentId =
      chatHistories.find((h) => h.id === sessionId)?.agentId || selectedAgentId;
    const currentStrategy = agentList.find((a) => a.id === strategyAgentId)?.strategy;
    // 当策略为 commonExecuteStrategy 时，不向第二面板写入用户消息（除非显式要求写入两面板）
    if (currentStrategy === 'commonExecuteStrategy' && !forceWriteBoth) {
      setThinkingMessages((prev) => [...prev, userMessage]);
      setTimeout(() => {
        scrollToBottom(thinkingPanelRef);
      }, 100);
    } else {
      setThinkingMessages((prev) => [...prev, userMessage]);
      setResultMessages((prev) => [...prev, userMessage]);
      setTimeout(() => {
        scrollToBottom(thinkingPanelRef);
        scrollToBottom(resultPanelRef);
      }, 100);
    }
  };

  // 滚动到底部
  const scrollToBottom = (ref: React.RefObject<HTMLDivElement>) => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  };

  // 渲染包含 Drawio 的内容
  const renderContentWithDrawio = (content: string) => {
    // 尝试去除包裹 XML 的 Markdown 代码块标记，避免残留的代码块标记被渲染成空框
    // 匹配 ```xml (或无语言) ...XML... ```，并将代码块标记移除，保留 XML
    const cleanedContent = content.replace(
      /```\w*\s*(<mxGraphModel[\s\S]*?<\/mxGraphModel>)\s*```/g,
      '$1'
    );

    const regex = /(<mxGraphModel[\s\S]*?<\/mxGraphModel>)/g;
    const parts = cleanedContent.split(regex);
    return parts.map((part, index) => {
      if (part.trim().startsWith('<mxGraphModel')) {
        return <DrawioViewer key={index} xml={part} />;
      }
      if (!part || !part.trim()) return null;
      return (
        <div
          key={index}
          className="markdown-content"
          dangerouslySetInnerHTML={{ __html: marked(part) }}
        />
      );
    });
  };

  // 渲染消息
  const renderMessage = (message: StageMessage) => {
    const selectedStrategy = agentList.find((a) => a.id === selectedAgentId)?.strategy;
    const isCommonExecuteStrategy = selectedStrategy === 'commonExecuteStrategy';
    if (message.type === 'user') {
      return (
        <div className="message-bubble user">
          {userInfo?.avatar ? (
            <img
              className="avatar user"
              src={userInfo.avatar}
              alt="avatar"
              style={{ objectFit: 'cover' }}
            />
          ) : (
            <div className="avatar user">我</div>
          )}
          <div className="message-content user">
            <div className="user-message">{message.content}</div>
          </div>
        </div>
      );
    }
    if (isCommonExecuteStrategy) {
      const safe =
        typeof message.content === 'string' ? message.content : String(message.content ?? '');
      return (
        <div className="message-bubble">
          <div className="avatar ai"><RobotIcon size={20} /></div>
          <div className="message-content ai">
            <div className="ai-message">{renderContentWithDrawio(safe)}</div>
          </div>
        </div>
      );
    }

    const stageInfo = stageTypeMap[message.type] || {
      name: message.type ? message.type : '/',
      color: '#666',
    };
    // 根据子类型映射显示友好名称，未匹配时回退原值或"/"
    const subTypeInfo = message.subType ? subTypeMap[message.subType] : undefined;
    const subTypeName = subTypeInfo?.name || (message.subType ? message.subType : '/');

    const safe =
      typeof message.content === 'string' ? message.content : String(message.content ?? '');
    return (
      <div className="message-bubble">
        <div className="avatar ai"><RobotIcon size={20} /></div>
        <div className="message-content ai">
          <div className="ai-message">
            <span
              className={`stage-indicator stage-${message.type}`}
              style={{ backgroundColor: stageInfo.color, color: '#fff' }}
            >
              {stageInfo.name}
            </span>{' '}
            <span
              className={`stage-indicator subtype-${message.subType}`}
              style={{ backgroundColor: subTypeInfo?.color || '#44b9e0ff', color: '#fff' }}
            >
              {subTypeName}
            </span>
            {renderContentWithDrawio(safe)}
          </div>
        </div>
      </div>
    );
  };

  // 渲染结果消息
  const renderResultMessage = (message: StageMessage) => {
    const safe =
      typeof message.content === 'string' ? message.content : String(message.content ?? '');
    return <div className="result-message-block">{renderContentWithDrawio(safe)}</div>;
  };

  // 渲染聊天历史项
  const renderChatHistoryItem = (chat: ChatHistory) => {
    const isActive = chat.id === sessionId;
    const isEditing = editingHistoryId === chat.id;
    return (
      <div
        className={`chat-history-item ${isActive ? 'active' : ''}`}
        key={chat.id}
        onClick={() => {
          if (loading) {
            Toast.info('任务执行中，无法切换会话');
            return;
          }
          if (chat.id === sessionId) {
            return;
          }
          loadChat(chat);
        }}
        style={loading ? { cursor: 'not-allowed', opacity: 0.6 } : undefined}
      >
        <div className="chat-history-info">
          {isEditing ? (
            <input
              className="chat-history-title-input"
              value={editingTitle}
              onChange={(e) => setEditingTitle(e.target.value)}
              onKeyDown={async (e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const newTitle = editingTitle.trim();
                  if (newTitle && newTitle !== chat.title) {
                    const ok = await UserService.updateConversationTitle(chat.id, newTitle);
                    if (ok) {
                      setChatHistories((prev) =>
                        prev.map((h) => (h.id === chat.id ? { ...h, title: newTitle } : h))
                      );
                      Toast.success('标题已更新');
                    }
                  }
                  setEditingHistoryId(null);
                } else if (e.key === 'Escape') {
                  setEditingHistoryId(null);
                }
              }}
              onBlur={async () => {
                const newTitle = editingTitle.trim();
                if (newTitle && newTitle !== chat.title) {
                  const ok = await UserService.updateConversationTitle(chat.id, newTitle);
                  if (ok) {
                    setChatHistories((prev) =>
                      prev.map((h) => (h.id === chat.id ? { ...h, title: newTitle } : h))
                    );
                  }
                }
                setEditingHistoryId(null);
              }}
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
          ) : (
            <div
              className="chat-history-title"
              onDoubleClick={(e) => {
                e.stopPropagation();
                if (isGuest) return;
                setEditingHistoryId(chat.id);
                setEditingTitle(chat.title || '');
              }}
            >
              {chat.title || '未命名对话'}
            </div>
          )}
          <div className="chat-history-subtitle">
            {chat.agentName && <span className="chat-history-agent-name">{chat.agentName}</span>}
            <span className="chat-history-msg-count">
              {chat.messageCount != null && chat.messageCount > 0
                ? `${chat.messageCount} 条消息`
                : '新对话'}
            </span>
          </div>
        </div>
        {!loading && (
          <Popconfirm
            title="确定要删除这个会话吗？"
            content="删除后无法恢复，请谨慎操作"
            okText="删除"
            cancelText="取消"
            onConfirm={async () => {
              if (loading) {
                Toast.info('任务执行中，无法删除会话');
                return;
              }
              if (isGuest) {
                showGuestLoginToast('info');
                return;
              }
              await deleteChatHistory(chat.id);
            }}
          >
            <div
              className="history-delete-icon"
              onClick={(e) => {
                e.stopPropagation();
              }}
              style={isGuest ? { cursor: 'not-allowed', opacity: 0.5 } : undefined}
              aria-label="删除会话"
              title="删除会话"
            >
              <IconDelete />
            </div>
          </Popconfirm>
        )}
      </div>
    );
  };

  // 案例数据
  const agentCases = {
    '36': [
      {
        title: '示例文档-人工智能(AI)',
        content: `
Artificial Intelligence (AI) has become an essential component of modern workflows across many industries. By automating repetitive tasks and analyzing large volumes of data, AI helps organizations improve efficiency, accuracy, and decision-making. Technologies such as machine learning and natural language processing enable systems to learn from historical data and adapt to changing conditions with minimal human intervention.

In software development, AI is widely used for code analysis, testing, and performance optimization. In business operations, it supports customer service through chatbots, enhances marketing through user behavior analysis, and improves risk management by identifying abnormal patterns. These applications allow employees to focus on higher-value tasks that require creativity and strategic thinking.

However, the adoption of AI also brings challenges. Data quality, model transparency, and ethical considerations must be carefully managed to ensure responsible use. Organizations should establish clear governance policies and continuously monitor AI systems to avoid bias and misuse.

Overall, when implemented thoughtfully, AI serves as a powerful tool that enhances productivity and innovation, helping organizations remain competitive in an increasingly digital world.
`,
      },
    ],
    '35': [
      {
        title: '示例提示词',
        content: `
你是一名专业的文档翻译助手，精通中英文（可根据需要替换语言对）。
请在充分理解原文语义、上下文和专业背景的基础上进行翻译，遵循以下规则：

1.忠实原文：准确传达原意，不随意增删、不主观发挥。

2.术语一致：专业术语、缩写、专有名词保持前后一致，必要时首次出现可在括号中保留原文。

3.语言自然：译文符合目标语言的表达习惯，通顺、专业、易读。

4.格式保持：保留原文的段落结构、标题层级、列表、代码块、表格与标点风格。

5.代码与命令：代码、配置、命令行内容不翻译，仅翻译注释或说明文字。

6.歧义处理：如遇到多义或上下文不足的内容，优先选择最合理的技术语义。

请直接输出翻译结果，不附加解释说明。
`,
      },
    ],
    '34': [
      {
        title: '请生成一个用户登录的流程图，包含：输入账号密码、验证、登录成功/失败等步骤',
        content: '请生成一个用户登录的流程图，包含：输入账号密码、验证、登录成功/失败等步骤',
      },
    ],
    '33': [
      {
        title: '接口和实现类的命名的两套规则是什么',
        content: '接口和实现类的命名的两套规则是什么',
      },
      { title: '解释一下POJO的含义', content: '解释一下POJO的含义' },
      { title: '表示"一切ok"的错误码是多少', content: '表示"一切ok"的错误码是多少' },
      { title: '列出所有错误码列表', content: '列出所有错误码列表' },
    ],
    '31': [
      { title: '列出所有仪表盘', content: '列出所有仪表盘' },
      {
        title: '根据MySQL监控（主）面板数据，分析现在mysql状态',
        content: '根据MySQL监控（主）面板数据，分析现在mysql状态',
      },
      {
        title: '根据服务器资源监控面板数据，分析现在哪台服务器内存使用率最高',
        content: '根据服务器资源监控面板数据，分析现在哪台服务器内存使用率最高',
      },
    ],
    '30': [{ title: '查询es中已有的索引', content: '查询es中已有的索引' }],
    '29': [{ title: '当前时间', content: '当前时间' }],
    '28': [{ title: '当前时间', content: '当前时间' }],
    '27': [
      {
        title: '对象问她的闺蜜谁好看我说都好看，她生气了',
        content: '对象问她的闺蜜谁好看我说都好看，她生气了',
      },
    ],
    '26': [
      {
        title:
          '搜索并生成一篇SpringBoot的学习路线的文章，将文章发送至掘金平台，之后进行微信公众号通知（平台：掘金、主题：为文章标题、描述：为文章简述、跳转地址：为发布文章到掘金获取 http url 文章地址"）',
        content:
          '搜索并生成一篇SpringBoot的学习路线的文章，将文章发送至掘金平台，之后进行微信公众号通知（平台：掘金、主题：为文章标题、描述：为文章简述、跳转地址：为发布文章到掘金获取 http url 文章地址"）',
      },
    ],
  };

  // 侧边栏搜索状态
  const [showSidebarSearch, setShowSidebarSearch] = useState(false);
  const [sidebarSearchText, setSidebarSearchText] = useState('');

  const handleToggleSidebarSearch = () => {
    setShowSidebarSearch((prev) => {
      const next = !prev;
      if (!prev && next) {
        setTimeout(() => {
          // 聚焦到输入框
          const el = document.querySelector<HTMLInputElement>('.sidebar-search input');
          el?.focus();
        }, 50);
      }
      return next;
    });
  };

  return (
    <Layout className="agent-chat-layout">
      <div className="agent-main-container">
        <div className="agent-content-container">
          <div className={`agent-sidebar ${showChatHistory ? 'visible' : 'collapsed'}`}>
            {showChatHistory ? (
              <>
                <div className="sidebar-title">
                  <div className="sidebar-brand">
                    <img className="sidebar-logo" src="/logo.png" alt="logo" />
                    <span className="sidebar-title-text">灵犀助手</span>
                  </div>
                  <div className="sidebar-actions">
                    <Tooltip content="搜索" position="bottom">
                      <div
                        className="icon-button"
                        title="搜索"
                        aria-label="搜索"
                        onClick={handleToggleSidebarSearch}
                      >
                        <IconSearch />
                      </div>
                    </Tooltip>
                    <Tooltip content="收起侧边栏" position="bottom">
                      <div
                        className="toggle-button"
                        onClick={() => setShowChatHistory(false)}
                        title="收起侧边栏"
                        aria-label="收起侧边栏"
                      >
                        <IconSidebar />
                      </div>
                    </Tooltip>
                  </div>
                </div>
                {showSidebarSearch && (
                  <div className="sidebar-search">
                    <Input
                      prefix={<IconSearch />}
                      placeholder="搜索历史..."
                      value={sidebarSearchText}
                      onChange={(v) => setSidebarSearchText(v)}
                      showClear
                    />
                  </div>
                )}
                <div className="section-divider" />
                <div className="section-content">
                  <Button
                    className="new-chat-button"
                    icon={<IconEdit />}
                    onClick={createNewChat}
                    style={loading ? { cursor: 'not-allowed', opacity: 0.6 } : undefined}
                  >
                    新建对话
                  </Button>
                </div>
                <div className="section-divider" />
                <div className="section-title">对话历史</div>
                <div className="chat-history-list">
                  {chatHistories && chatHistories.length > 0 ? (
                    [...chatHistories]
                      .filter((h) =>
                        sidebarSearchText.trim() === ''
                          ? true
                          : h.title.toLowerCase().includes(sidebarSearchText.trim().toLowerCase())
                      )
                      .map(renderChatHistoryItem)
                  ) : (
                    <div className="chat-history-empty">暂无对话历史</div>
                  )}
                </div>
              </>
            ) : (
              <div className="collapsed-bar">
                <Tooltip content="展开侧边栏" position="bottom">
                  <div
                    className="toggle-button"
                    onClick={() => setShowChatHistory(true)}
                    title="展开侧边栏"
                    aria-label="展开侧边栏"
                  >
                    <IconSidebar />
                  </div>
                </Tooltip>
              </div>
            )}

            {/* 主题切换按钮（底部居中，GitHub 与用户头像之间） */}
            <Tooltip
              content={
                currentTheme === 'dark' ? '当前：暗色（点击→亮色）' :
                currentTheme === 'light' ? '当前：亮色（点击→跟随系统）' :
                '当前：跟随系统（点击→暗色）'
              }
              position="top"
            >
              <div
                className="theme-toggle-btn"
                style={{
                  position: 'absolute',
                  left: '50%',
                  bottom: '12px',
                  zIndex: 5,
                  transform: 'translateX(-50%)',
                }}
                onClick={cycleTheme}
                aria-label="切换主题"
              >
                {currentTheme === 'dark' ? <SunIcon /> : currentTheme === 'light' ? <MoonIcon /> : <SystemThemeIcon />}
              </div>
            </Tooltip>

            {/* 侧边栏左下角 GitHub 链接 */}
            <a
              className="sidebar-github-link"
              href="https://github.com/userwanyong/AI-AGENT-FRONT"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              <span>GitHub</span>
            </a>

            {/* 侧边栏右下角用户头像与信息弹层 */}
            <div className="sidebar-user-avatar">
              <Popover
                trigger="hover"
                position="rightTop"
                spacing={10}
                content={
                  <div className="sidebar-user-popover">
                    <div className="sidebar-user-header">
                      <Avatar size="small" color="blue" src={userInfo?.avatar || undefined}>
                        {userInfo?.username?.[0]?.toUpperCase() || 'U'}
                      </Avatar>
                      <div className="sidebar-user-basic">
                        <Tooltip content={userInfo?.username || '用户'} position="top">
                          <div className="sidebar-user-name">{userInfo?.username || '用户'}</div>
                        </Tooltip>
                        <Tooltip content={`UID：${userInfo?.id ?? userInfo?.userId ?? userInfo?.uid ?? '-'}`} position="top">
                          <div className="sidebar-user-uid">
                            UID：{userInfo?.id ?? userInfo?.userId ?? userInfo?.uid ?? '-'}
                          </div>
                        </Tooltip>
                      </div>
                    </div>
                    <div className="sidebar-user-actions">
                      <div
                        className="user-action-item"
                        onClick={() => {
                          if (!isAdmin) {
                            Toast.warning('权限不足');
                            return;
                          }
                          navigate('/agent-list');
                        }}
                        style={!isAdmin ? { cursor: 'not-allowed', opacity: 0.5 } : undefined}
                      >
                        <IconSetting />
                        <span>后台管理</span>
                      </div>
                      <div className="user-action-item" onClick={handleLogout}>
                        <IconExit />
                        <span>退出登录</span>
                      </div>
                    </div>
                  </div>
                }
              >
                <Avatar size="small" color="blue" src={userInfo?.avatar || undefined}>
                  {userInfo?.username?.[0]?.toUpperCase() || 'U'}
                </Avatar>
              </Popover>
            </div>
          </div>

          {/* 首次进入仅展示居中的胶囊输入框 */}
          <div
            className={`main-content ${isNewChat && messages.length === 0 ? 'intro-center' : ''}`}
          >
            {!(isNewChat && messages.length === 0) && (() => {
              const showResultTab = showResultPanel || sideBySideMode;
              const showTabs = showResultTab; // 只有两个 tab 同时存在时才显示 tab 栏
              return showTabs ? (
                <div className="tab-container">
                  <div
                    className={`tab ${activeTab === 'thinking' ? 'active' : ''}`}
                    onClick={() => handleTabClick('thinking')}
                  >
                    回答
                  </div>
                  <div
                    className={`tab ${activeTab === 'result' ? 'active' : ''}`}
                    onClick={() => handleTabClick('result')}
                  >
                    总结
                  </div>
                  {agentList.find((a) => a.id === selectedAgentId)?.strategy !==
                    'commonExecuteStrategy' && (
                    <Button
                      type="tertiary"
                      theme="borderless"
                      size="small"
                      onClick={() => {
                        setSideBySideMode(!sideBySideMode);
                      }}
                      className="tab-mode-toggle"
                    >
                      {sideBySideMode ? '单面板模式' : '双面板模式'}
                    </Button>
                  )}
                </div>
              ) : null;
            })()}

            {!(isNewChat && messages.length === 0) && (
              <div className={`panels-container ${sideBySideMode ? 'side-by-side' : 'stacked'}`}>
                <div
                  ref={thinkingPanelRef}
                  className={`panel thinking ${sideBySideMode ? 'side-by-side' : 'stacked'} ${
                    sideBySideMode || activeTab === 'thinking' ? 'visible' : 'hidden'
                  } ${!sideBySideMode ? 'slide-in' : ''}`}
                >
                  {!historyRendered && !isNewChat && (
                    <div className="loading-container">
                      加载中
                      <div className="loading-dots loading-margin-left">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  )}
                  {thinkingMessages.map((msg, index) => (
                    <div className="message-container" key={index}>
                      {renderMessage(msg)}
                      {/* 当没有任何 AI 思考消息时才显示占位（忽略用户消息），位置在最后一条消息之后 */}
                      {index === thinkingMessages.length - 1 &&
                        !loading &&
                        historyRendered &&
                        thinkingMessages.filter((m) => m.type !== 'user').length === 0 &&
                        !isNewChat && (
                          <div className="chat-history-empty">任务未完成/任务已中断</div>
                        )}
                    </div>
                  ))}
                  {/* 如果思考面板没有任何消息，仍需在列表末尾显示占位提示 */}
                  {!loading && historyRendered && thinkingMessages.length === 0 && !isNewChat && (
                    <div className="chat-history-empty">暂无对话历史</div>
                  )}
                  {loading && (
                    <div className="loading-container">
                      任务执行中
                      <div className="loading-dots loading-margin-left">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  )}
                </div>
                <div
                  ref={resultPanelRef}
                  className={`panel result ${sideBySideMode ? 'side-by-side' : 'stacked'} ${
                    sideBySideMode || activeTab === 'result' ? 'visible' : 'hidden'
                  } ${!sideBySideMode ? 'slide-in' : ''}`}
                >
                  {/* 占位提示移到用户提问气泡下方，避免显示在列表顶部 */}
                  {!historyRendered && !isNewChat && (
                    <div className="loading-container">
                      加载中
                      <div className="loading-dots loading-margin-left">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  )}
                  {/* 顺序显示所有结果消息：用户消息使用气泡，AI结果使用白色引用块 */}
                  {resultMessages.map((msg, index) => (
                    <div className="message-container" key={index}>
                      {msg.type === 'user' ? renderMessage(msg) : renderResultMessage(msg)}
                      {/* 将“任务执行中”显示在用户气泡下方，仅在加载中时显示 */}
                      {loading && msg.type === 'user' && index === resultMessages.length - 1 && (
                        <div className="loading-container">
                          任务执行中
                          <div className="loading-dots loading-margin-left">
                            <span></span>
                            <span></span>
                            <span></span>
                          </div>
                        </div>
                      )}
                      {/* 当没有任何 AI 结果消息时才显示占位（忽略用户消息），位置在最后一条消息之后 */}
                      {index === resultMessages.length - 1 &&
                        !loading &&
                        historyRendered &&
                        resultMessages.filter((m) => m.type !== 'user').length === 0 &&
                        !isNewChat && (
                          <div className="chat-history-empty">任务未完成/任务已中断</div>
                        )}
                    </div>
                  ))}
                  {/* 如果结果面板没有任何消息，仍需在列表末尾显示占位提示 */}
                  {!loading && historyRendered && resultMessages.length === 0 && !isNewChat && (
                    <div className="chat-history-empty">任务未完成/任务已中断</div>
                  )}
                </div>
              </div>
            )}

            <div className="bottom-input-area">
              <div className="input-container">
                <div className="input-wrapper">
                  {/* 顶部简短提示：首次加载/新建对话时浮现 */}
                  {showIntroTip && (
                    <div className="intro-banner">
                      <div className="intro-title">
                        简洁{' '}
                        <span className="intro-efficient">
                          高效
                          <span className="intro-badge">
                            <span className="intro-num">10+</span>智能体
                          </span>
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Query Composer：胶囊形输入框 + 标签 + 右侧图标/发送 */}
                  <div className="query-composer">
                    <div className="composer-main">
                      <textarea
                        className="composer-input"
                        value={input}
                        placeholder={'请输入'}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage();
                          }
                        }}
                        ref={inputRef}
                      />
                      <div className="composer-right"></div>
                    </div>
                    <div className="composer-actions">
                      {/* 提问案例移动到智能体选择前 */}
                      <div className="case-dropdown">
                        <Button
                          icon={showCaseDropdown ? <IconChevronUp /> : <IconChevronDown />}
                          onClick={() => {
                            setShowCaseDropdown(!showCaseDropdown);
                          }}
                        >
                          提问案例
                        </Button>
                        <div
                          className={`case-dropdown-content ${showCaseDropdown ? 'visible' : ''}`}
                        >
                          {selectedAgentId in agentCases && (
                            <>
                              <div className="case-dropdown-category">
                                {selectedAgentId === '1' && '自动自主规划案例'}
                                {selectedAgentId === '2' && '智能对话分析案例'}
                                {selectedAgentId === '4' && 'ELK日志检索分析案例'}
                                {selectedAgentId === '5' && '智能监控分析服务案例'}
                                {selectedAgentId === '6' && '智能体案例'}
                              </div>
                              {agentCases[selectedAgentId as keyof typeof agentCases].map(
                                (item, index) => (
                                  <div
                                    className="case-dropdown-item"
                                    key={index}
                                    onClick={() => {
                                      setInput(item.content);
                                      setShowCaseDropdown(false);
                                      setTimeout(() => {
                                        const el = inputRef.current;
                                        if (el) {
                                          el.focus();
                                          const len = el.value.length;
                                          el.setSelectionRange(len, len);
                                        }
                                      }, 0);
                                    }}
                                  >
                                    {item.title}
                                  </div>
                                )
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      {/* 智能体选择下拉，迁移到胶囊容器内 */}
                      <div className="agent-dropdown-wrapper agent-dropdown">
                        <div
                          className={`agent-dropdown-button ${showAgentDropdown ? 'open' : ''} ${
                            !isNewChat ? 'disabled' : ''
                          }`}
                          onClick={() => {
                            if (!isNewChat) {
                              Toast.info('本次会话已选择智能体，如需切换请新建对话');
                              return; // 历史会话禁用智能体选择
                            }
                            setShowAgentDropdown(!showAgentDropdown);
                          }}
                          style={!isNewChat ? { cursor: 'not-allowed', opacity: 0.6 } : undefined}
                        >
                          <span className="agent-button-text">
                            {agentList.find((agent) => agent.id === selectedAgentId)?.name ||
                              '选择智能体'}
                          </span>
                          <IconChevronDown
                            className={`agent-dropdown-arrow ${showAgentDropdown ? 'open' : ''}`}
                          />
                        </div>
                        <div
                          className={`agent-dropdown-content ${showAgentDropdown ? 'visible' : ''}`}
                        >
                          {agentList.map((agent) => (
                            <div
                              key={agent.id}
                              onClick={() => {
                                if (!isNewChat) {
                                  return; // 历史会话禁用智能体选择
                                }
                                if (!isAdmin && agent.strategy !== 'commonExecuteStrategy') {
                                  showUseLoginToast('info');
                                  return;
                                }
                                setSelectedAgentId(agent.id);
                                setShowAgentDropdown(false);
                              }}
                              className={`agent-dropdown-item ${
                                selectedAgentId === agent.id ? 'selected' : ''
                              }`}
                              style={
                                !isNewChat
                                  ? { pointerEvents: 'none', opacity: 0.6 }
                                  : !isAdmin && agent.strategy !== 'commonExecuteStrategy'
                                  ? { cursor: 'not-allowed', opacity: 0.6 }
                                  : undefined
                              }
                            >
                              <div className="agent-item-info">
                                <span className="agent-item-name">
                                  {agent.name}
                                  {agent.strategy !== 'commonExecuteStrategy' && (
                                    <span
                                      style={{
                                        marginLeft: 3,
                                        fontSize: 10,
                                        padding: '0px 4px',
                                        borderRadius: 4,
                                        background: 'var(--semi-color-primary)',
                                        color: '#fff',
                                        transform: 'translateY(-3px)',
                                        display: 'inline-block',
                                        blockSize: '15px',
                                      }}
                                    >
                                      高级
                                    </span>
                                  )}
                                </span>
                                <span className="agent-item-desc">{agent.description || ''}</span>
                              </div>
                              <div className="agent-item-right">
                                {selectedAgentId === agent.id && (
                                  <IconTick className="icon-selected" />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 最大步数限制，迁移到胶囊容器内 */}
                      {agentList.find((a) => a.id === selectedAgentId)?.strategy ===
                        'autoExecuteStrategy' && (
                        <div className="agent-step-selector">
                          <span className="agent-step-label">最大执行轮数:</span>
                          <div
                            className={`agent-step-button ${
                              selectedMaxStep === '3' ? 'selected' : ''
                            }`}
                            onClick={() => {
                              if (isGuest) {
                                showGuestLoginToast('info');
                                return;
                              }
                              setSelectedMaxStep('3');
                            }}
                            style={isGuest ? { cursor: 'not-allowed' } : undefined}
                          >
                            3
                          </div>
                          <div
                            className={`agent-step-button ${
                              selectedMaxStep === '5' ? 'selected' : ''
                            }`}
                            onClick={() => {
                              if (isGuest) {
                                showGuestLoginToast('info');
                                return;
                              }
                              setSelectedMaxStep('5');
                            }}
                            style={isGuest ? { cursor: 'not-allowed' } : undefined}
                          >
                            5
                          </div>
                          <div
                            className={`agent-step-button ${
                              selectedMaxStep === '10' ? 'selected' : ''
                            }`}
                            onClick={() => {
                              if (isGuest) {
                                showGuestLoginToast('info');
                                return;
                              }
                              setSelectedMaxStep('10');
                            }}
                            style={isGuest ? { cursor: 'not-allowed' } : undefined}
                          >
                            10
                          </div>
                        </div>
                      )}

                      {/* 将发送按钮与标签行右侧对齐 */}
                      <Button
                        type="primary"
                        theme="solid"
                        className={`send-round action ${
                          loading || !input.trim() ? 'disabled' : ''
                        }`}
                        onClick={sendMessage}
                        loading={loading}
                        disabled={!input.trim() || loading}
                        style={isGuest ? { cursor: 'not-allowed' } : undefined}
                      >
                        ↑
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AgentChatPage;
