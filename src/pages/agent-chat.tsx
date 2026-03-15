import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect, useRef } from 'react';

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
import { AiAgentService, UserService, AdminUserService } from '../services';
import { AgentResponseDTO } from '../services/admin-user-service';

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
  maxStep: string;
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
    setIsNewChat(true);
    setShowIntroTip(true);
    setSessionId(generateSessionId());

    return () => {
      document.removeEventListener('click', clickHandler);
    };
  }, []);

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
      // 从后端API获取历史记录
      const historyList = await UserService.getUserHistory();

      if (historyList && historyList.length > 0) {
        const formattedHistories = historyList.map((item) => {
          // 去除包裹引号并反转义
          const line = decodeEscapedText(item);
          let sid = generateSessionId();
          let titleText = line.trim();
          let aid = selectedAgentId;
          if (line.includes(':')) {
            const colon = line.indexOf(':');
            sid = line.substring(0, colon).trim();
            const underscore = line.indexOf('_', colon + 1);
            const between =
              underscore >= 0 ? line.substring(colon + 1, underscore) : line.substring(colon + 1);
            titleText = between.trim();
            if (underscore >= 0) {
              aid = line.substring(underscore + 1).trim();
            }
          }
          const title = titleText
            ? titleText.substring(0, 30) + (titleText.length > 30 ? '...' : '')
            : '未命名对话';
          return {
            id: sid,
            title,
            messages: [], // 初始为空，点击时再加载
            agentId: aid || '',
            maxStep: selectedMaxStep,
            // timestamp: Date.now()
          };
        });

        setChatHistories(formattedHistories);
      } else {
        console.log('没有聊天历史或历史为空');
      }
    } catch (error) {
      console.error('加载聊天历史失败:', error);
      // 如果API调用失败，尝试从本地存储加载
      const history = localStorage.getItem('chatHistory');
      if (history) {
        setChatHistories(JSON.parse(history));
      }
    }
  };

  // 提取字符串中第一个冒号与其后第一个下划线之间的内容
  const extractBetweenColonAndUnderscore = (s: string) => {
    if (typeof s !== 'string') return '';
    const colon = s.indexOf(':');
    if (colon < 0) return s.trim();
    const underscore = s.indexOf('_', colon + 1);
    if (underscore < 0) return s.substring(colon + 1).trim();
    return s.substring(colon + 1, underscore).trim();
  };

  // 反转义并去除包裹引号，返回安全文本
  const decodeEscapedText = (raw: unknown) => {
    if (typeof raw !== 'string') return String(raw ?? '');
    let t = raw;
    try {
      if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
        t = JSON.parse(t);
      }
    } catch {}
    t = t.replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\r/g, '\r');
    return t;
  };

  // 加载特定会话的聊天记录
  const loadSessionChat = async (sessionId: string) => {
    try {
      // 从后端API获取特定会话的聊天记录
      const sessionMessages = await UserService.getUserSession(sessionId);

      if (sessionMessages && sessionMessages.length > 0) {
        const formattedMessages: ChatMessage[] = [];

        // 统一反转义工具
        const decode = (t: any) => {
          let s = typeof t === 'string' ? t : String(t ?? '');
          try {
            if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
              s = JSON.parse(s);
            }
          } catch {}
          return s.replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\r/g, '\r');
        };

        // 适配 Spring Message 对象
        const normalizeSpringMessage = (obj: any): ChatMessage => {
          const rawType = (obj?.messageType || obj?.role || obj?.type || '')
            .toString()
            .toUpperCase();
          const role: 'user' | 'ai' = rawType === 'USER' ? 'user' : 'ai';
          let content: any = obj?.content;
          // 优先读取顶层 text 字段（Spring AI 常见结构）
          if (content == null && typeof obj?.text !== 'undefined') {
            content = obj.text;
          }
          // 常见 Content 结构兼容
          if (content && typeof content !== 'string') {
            if (typeof content.content === 'string') content = content.content;
            else if (typeof content.text === 'string') content = content.text;
            else if (Array.isArray(content))
              content = content
                .map((c: any) => (typeof c === 'string' ? c : c?.text || c?.content || ''))
                .join('\n');
          }
          const text = decode(content ?? JSON.stringify(obj));
          const type = obj?.metadata?.type ?? obj?.type;
          const subType = obj?.metadata?.subType ?? obj?.subType;
          return { role, content: text, timestamp: Date.now(), type, subType };
        };

        // 解析消息格式（兼容字符串与对象）
        sessionMessages.forEach((msg) => {
          if (typeof msg === 'string') {
            if (msg.startsWith('USER:')) {
              const rawUser = extractBetweenColonAndUnderscore(msg);
              formattedMessages.push({
                role: 'user',
                content: decodeEscapedText(rawUser),
                timestamp: Date.now(),
              });
            } else if (msg.startsWith('AI:')) {
              // 解析AI消息，优先处理JSON；兼容部分前缀字符（如"/")
              try {
                let content = msg.substring(3).trim();
                if (content.startsWith('/')) content = content.substring(1).trim();
                const jsonStart = content.indexOf('{');
                if (jsonStart >= 0) {
                  try {
                    const jsonObj = JSON.parse(content.substring(jsonStart));
                    const hasContentField =
                      Object.prototype.hasOwnProperty.call(jsonObj, 'content') &&
                      jsonObj.content !== undefined;
                    const raw = hasContentField
                      ? jsonObj.content
                      : typeof jsonObj.text !== 'undefined'
                      ? jsonObj.text
                      : '';
                    const decoded = decode(raw);
                    const metaType = jsonObj?.metadata?.type ?? jsonObj?.type;
                    const metaSubType = jsonObj?.metadata?.subType ?? jsonObj?.subType;
                    if (hasContentField || typeof jsonObj.text !== 'undefined') {
                      formattedMessages.push({
                        role: 'ai',
                        content: decoded,
                        type: metaType,
                        subType: metaSubType,
                        timestamp: Date.now(),
                      });
                    } else {
                      formattedMessages.push({
                        role: 'ai',
                        type: metaType,
                        subType: metaSubType,
                        content: JSON.stringify(jsonObj, null, 2),
                        timestamp: Date.now(),
                      });
                    }
                  } catch (jsonError) {
                    console.error('JSON解析失败:', jsonError);
                    const t = decode(content);
                    formattedMessages.push({ role: 'ai', content: t, timestamp: Date.now() });
                  }
                } else {
                  const t = decode(content);
                  formattedMessages.push({ role: 'ai', content: t, timestamp: Date.now() });
                }
              } catch (e) {
                console.error('解析AI消息失败:', e);
                let t = msg.substring(3).trim();
                if (t.startsWith('/')) t = t.substring(1).trim();
                formattedMessages.push({ role: 'ai', content: decode(t), timestamp: Date.now() });
              }
            } else {
              // 没有前缀：按用户消息处理
              formattedMessages.push({ role: 'user', content: msg, timestamp: Date.now() });
            }
          } else if (msg && typeof msg === 'object') {
            // Spring Message 对象
            try {
              formattedMessages.push(normalizeSpringMessage(msg));
            } catch (e) {
              console.error('解析 Spring Message 失败:', e, msg);
            }
          } else {
            console.warn('未知消息类型，丢弃:', msg);
          }
        });

        // 更新当前会话ID和消息
        setSessionId(sessionId);
        setMessages(formattedMessages);
        // 将加载的历史消息分别添加到两个面板，按策略区分
        // 优先使用会话对应的 agentId，避免刚切换时 selectedAgentId 还未更新
        const strategyAgentId =
          chatHistories.find((h) => h.id === sessionId)?.agentId || selectedAgentId;
        const currentStrategy = agentList.find((a) => a.id === strategyAgentId)?.strategy;
        formattedMessages.forEach((msg) => {
          if (currentStrategy === 'commonExecuteStrategy') {
            // commonExecuteStrategy：所有用户/AI历史只写入左侧思考面板
            if (msg.role === 'user') {
              addMessage(msg.content);
            } else {
              addAIMessage(
                { type: msg.type || '', subType: msg.subType || '', content: msg.content },
                'thinking'
              );
            }
          } else {
            // 非 commonExecuteStrategy：保持原有逻辑（用户写入两面板，AI summary 写右侧，其余写左侧）
            if (msg.role === 'user') {
              // 强制写入两面板，避免 setSessionId 的异步导致策略误判
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
        // 更新历史记录中的消息
        const updatedHistories = chatHistories.map((h) => {
          if (h.id === sessionId) {
            return { ...h, messages: formattedMessages };
          }
          return h;
        });

        setChatHistories(updatedHistories);
        // 历史消息更新完成，标记渲染完成
        setHistoryRendered(true);
      }
      // 历史记录为空：也标记渲染完成以取消“加载中”提示
      if (!sessionMessages || sessionMessages.length === 0) {
        setHistoryRendered(true);
      }
    } catch (error) {
      console.error('加载会话聊天记录失败:', error);
      Toast.error('加载会话聊天记录失败');
      // 即使失败也标记为完成以允许占位提示显示
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
    // 生成新的会话ID
    const newSessionId = generateSessionId();
    setSessionId(newSessionId);

    // 清空消息和面板
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
    // 切换会话，历史尚未渲染
    setHistoryRendered(false);
    setIsNewChat(true);

    if (chat.id !== currentSession) {
      // 不是新聊天
      setIsNewChat(false);
    }

    // 清空思考和结果面板
    setThinkingMessages([]);
    setResultMessages([]);
    // 根据智能体策略决定是否启用双面板
    const strategy = agentList.find((a) => a.id === chat.agentId)?.strategy;
    setSideBySideMode(strategy !== 'commonExecuteStrategy');
    if (strategy === 'commonExecuteStrategy') {
      // 强制关闭右侧结果面板
      setShowResultPanel(false);
    }
    setActiveTab('thinking'); // 切换到思考Tab

    // 先设置当前智能体为历史项解析出的 agentId，再加载会话详情
    setSelectedAgentId(chat.agentId);
    // 直接设置当前会话ID为历史会话ID，而不是创建新会话
    setSessionId(chat.id);
    loadSessionChat(chat.id);
    setSelectedMaxStep(chat.maxStep);
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
    // 首次发送后切换到正常界面
    if (isNewChat) {
      setIsNewChat(false);
      // 首次会话不需要等待历史渲染，避免一直显示“加载中”
      if (!historyRendered) {
        setHistoryRendered(true);
      }
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
          <div className="avatar ai">🤖</div>
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
        <div className="avatar ai">🤖</div>
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
    return (
      <div
        className={`chat-history-item ${isActive ? 'active' : ''}`}
        key={chat.id}
        onClick={() => {
          if (loading) {
            Toast.info('任务执行中，无法切换会话');
            return;
          }
          // 若点击的是当前会话，则不进行加载
          if (chat.id === sessionId) {
            return;
          }
          loadChat(chat);
        }}
        style={loading ? { cursor: 'not-allowed', opacity: 0.6 } : undefined}
      >
        <div className="chat-history-title">{chat.title || '未命名对话'}</div>
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
                      .map((h, idx) => ({ h, idx }))
                      .sort((a, b) => {
                        const aHasTs = a.h.timestamp !== undefined ? 1 : 0;
                        const bHasTs = b.h.timestamp !== undefined ? 1 : 0;
                        if (aHasTs !== bHasTs) return bHasTs - aHasTs; // 有 timestamp 的在前
                        if (a.h.timestamp !== undefined && b.h.timestamp !== undefined) {
                          return (b.h.timestamp as number) - (a.h.timestamp as number); // 按时间倒序
                        }
                        return b.idx - a.idx; // 保持无 timestamp 的倒序顺序
                      })
                      .map(({ h }) => h)
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
            {!(isNewChat && messages.length === 0) && (
              <div className="tab-container">
                <div
                  className={`tab ${activeTab === 'thinking' ? 'active' : ''}`}
                  onClick={() => handleTabClick('thinking')}
                >
                  回答panel
                </div>
                {(showResultPanel || sideBySideMode) && (
                  <div
                    className={`tab ${activeTab === 'result' ? 'active' : ''}`}
                    onClick={() => handleTabClick('result')}
                  >
                    总结panel
                  </div>
                )}
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
            )}

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
