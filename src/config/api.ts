/**
 * API 配置文件
 * 统一管理所有 API 的基础 URL 和相关配置
 */

// 环境变量配置
import JSONbig from 'json-bigint';
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// 基础配置
export const API_CONFIG = {
  // 基础域名配置
  BASE_DOMAIN: isDevelopment ? 'http://120.48.70.239:8071' : 'http://120.48.70.239:8071',
  
  // API 版本
  API_VERSION: 'v1',
  
  // 超时配置
  TIMEOUT: 30000, // 30秒
  
  // 重试配置
  RETRY_TIMES: 3,
} as const;

// API 端点配置
export const API_ENDPOINTS = {
  // AI 客户端相关接口
  AI_CLIENT: {
    BASE: `${API_CONFIG.BASE_DOMAIN}/api/${API_CONFIG.API_VERSION}/admin/client`,
    QUERY_ALL: '/query-all',
    QUERY_ENABLED: '/query-enabled',
  },
  
  // AI 客户端顾问相关接口
  AI_CLIENT_ADVISOR: {
    BASE: `${API_CONFIG.BASE_DOMAIN}/api/${API_CONFIG.API_VERSION}/admin/advisor`,
    QUERY_ALL: '/query-all',
    QUERY_ENABLE: '/query-enabled',
  },
  
  // AI 客户端系统提示相关接口
  AI_CLIENT_SYSTEM_PROMPT: {
    BASE: `${API_CONFIG.BASE_DOMAIN}/api/${API_CONFIG.API_VERSION}/admin/prompt`,
    CREATE: '/create',
    UPDATE_BY_ID: '/update-by-id',
    UPDATE_BY_PROMPT_ID: '/update-by-prompt-id',
    DELETE_BY_ID: '/delete-by-id',
    DELETE_BY_PROMPT_ID: '/delete-by-prompt-id',
    QUERY_BY_ID: '/query-by-id',
    QUERY_BY_PROMPT_ID: '/query-by-prompt-id',
    QUERY_ALL: '/query-all',
    QUERY_ENABLED: '/query-enabled',
    QUERY_BY_PROMPT_NAME: '/query-by-prompt-name',
    QUERY_LIST: '/query-list',
  },
  
  // AI 客户端工具MCP相关接口
  AI_CLIENT_TOOL_MCP: {
    BASE: `${API_CONFIG.BASE_DOMAIN}/api/${API_CONFIG.API_VERSION}/admin/tool`,
    CREATE: '/create',
    UPDATE_BY_ID: '/update-by-id',
    UPDATE_BY_MCP_ID: '/update-by-mcp-id',
    DELETE_BY_ID: '/delete-by-id',
    DELETE_BY_MCP_ID: '/delete-by-mcp-id',
    QUERY_BY_ID: '/query-by-id',
    QUERY_BY_MCP_ID: '/query-by-mcp-id',
    QUERY_ALL: '/query-all',
    QUERY_BY_STATUS: '/query-by-status',
    QUERY_BY_TRANSPORT_TYPE: '/query-by-transport-type',
    QUERY_ENABLED: '/query-enabled',
    QUERY_LIST: '/query-list',
  },
  
  // AI 客户端模型相关接口
  AI_CLIENT_MODEL: {
    BASE: `${API_CONFIG.BASE_DOMAIN}/api/${API_CONFIG.API_VERSION}/admin/model`,
    CREATE: '/create',
    UPDATE: '/update',
    DELETE: '/delete',
    QUERY_ENABLED: '/query-enabled',
    QUERY_ALL: '/query-all',
  },
  
  // AI 智能体绘图相关接口
  AI_AGENT_DRAW: {
    BASE: `${API_CONFIG.BASE_DOMAIN}/api/${API_CONFIG.API_VERSION}/admin/agent-draw`,
    SAVE_CONFIG: '/save',
    QUERY_LIST: '/query',
    GET_CONFIG: '/get',
    DELETE_CONFIG: '/delete',
  },
  
  // AI 智能体相关接口
  AI_AGENT: {
    BASE: `${API_CONFIG.BASE_DOMAIN}/api/${API_CONFIG.API_VERSION}/agent`,
    ARMORY_AGENT: '/armory_agent',
    AUTO_AGENT: '/auto_agent',
  },
  
  // 管理员用户相关接口
  ADMIN_USER: {
    BASE: `${API_CONFIG.BASE_DOMAIN}/api/${API_CONFIG.API_VERSION}/admin`,
    VALIDATE_LOGIN: '/login',
    QUERY_AGENT_ENABLED: '/agent/query-enabled',
    UPDATE_AGENT: '/agent/update',
  },

  USER: {
    BASE: `${API_CONFIG.BASE_DOMAIN}/api/${API_CONFIG.API_VERSION}/user`,
    UPDATE_PWD: '/pwd',
    RESET_PWD: '/resetPwd',
    INFO: '/info',
    
  },
  FILE: {
    BASE: `${API_CONFIG.BASE_DOMAIN}/api/${API_CONFIG.API_VERSION}/file`,
    UPLOAD: '/upload',
  },
  

} as const;

// 请求头配置
export const getDefaultHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token ? { 'Authorization': token } : {})
  };
};

export const getUploadHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    ...(token ? { 'Authorization': token } : {})
  };
};

// 导出便捷方法
export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_DOMAIN}${endpoint}`;
};

// 环境检查工具
export const ENV_UTILS = {
  isDevelopment,
  isProduction,
  isTest: process.env.NODE_ENV === 'test',
} as const;

/**
 * 解析响应文本，保留超过 JS 安全整数范围的大整数为字符串
 */
export const parseResponseJsonSafely = async (response: Response): Promise<any> => {
  const text = await response.text();
  const JSONSafe = JSONbig({ storeAsString: true });
  return JSONSafe.parse(text);
};

/**
 * JSON 序列化时保留大整数为字符串，避免请求体中精度丢失
 */
export const stringifySafely = (payload: any): string => {
  return JSON.stringify(payload, (_key, value) => {
    if (typeof value === 'bigint') {
      return value.toString();
    }
    if (typeof value === 'number' && Number.isInteger(value) && Math.abs(value) > Number.MAX_SAFE_INTEGER) {
      return value.toString();
    }
    return value;
  });
};
