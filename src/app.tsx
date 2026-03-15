import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import React, { useEffect } from 'react';

import { createRoot } from 'react-dom/client';
import { Toast } from '@douyinfe/semi-ui';

import {
  LoginPage,
  AgentConfigPage,
  AgentListPage,
  ClientManagement,
  ApiManagement,
  AdvisorManagement,
  RagManagement,
  ModelManagement,
  PromptManagement,
  McpManagement,
  AgentChatPage,
} from './pages';

// 统一的认证检查函数
const isAuthenticated = (): boolean => {
  const token = localStorage.getItem('token');
  const userInfo = localStorage.getItem('userInfo');
  const isLoggedIn = localStorage.getItem('isLoggedIn');

  // 检查所有必要的认证信息是否存在
  return !!(token && userInfo && isLoggedIn);
};

// 路由保护组件
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) =>
  isAuthenticated() ? <>{children}</> : <Navigate to="/login" replace />;

// 登录重定向组件：登录后进入智能体列表
const LoginRedirect: React.FC = () =>
  isAuthenticated() ? <Navigate to="/agent-chat" replace /> : <LoginPage />;

// 临时禁用 findDOMNode、ReactDOM.render is no longer supported 警告
const originalConsoleError = console.error;
console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('findDOMNode')) {
    return;
  }
  if (
    args[0] &&
    typeof args[0] === 'string' &&
    args[0].includes('ReactDOM.render is no longer supported')
  ) {
    return;
  }
  originalConsoleError(...args);
};

// Token 刷新状态管理
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

// 清除登录状态并跳转登录页
const clearAuthAndRedirect = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('userInfo');
  localStorage.removeItem('isLoggedIn');
  Toast.warning('登录已过期，请重新登录');
  window.location.href = '/login';
};

// 刷新 Token
const refreshAccessToken = async (): Promise<boolean> => {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) {
    clearAuthAndRedirect();
    return false;
  }

  try {
    const response = await fetch('/api/v1/user/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      clearAuthAndRedirect();
      return false;
    }

    const data = await response.json();
    if (data && data.data && data.data.token) {
      localStorage.setItem('token', data.data.token);
      // 如果返回了新的 refreshToken，也更新它
      if (data.data.refreshToken) {
        localStorage.setItem('refreshToken', data.data.refreshToken);
      }
      return true;
    }

    clearAuthAndRedirect();
    return false;
  } catch {
    clearAuthAndRedirect();
    return false;
  }
};

// 全局拦截 fetch：处理 401 和权限不足
const originalFetch = window.fetch.bind(window);
window.fetch = async (...args) => {
  const response = await originalFetch(...(args as Parameters<typeof fetch>));

  // 处理 401 Token 过期
  if (response.status === 401) {
    // 排除刷新接口本身，避免循环调用
    const requestUrl = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url;
    if (requestUrl.includes('/user/refresh')) {
      clearAuthAndRedirect();
      return response;
    }

    // 防止多个请求同时刷新 token
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = refreshAccessToken().finally(() => {
        isRefreshing = false;
      });
    }

    const refreshed = await refreshPromise;
    if (refreshed) {
      // 使用新 token 重试原请求
      const newToken = localStorage.getItem('token');
      const [input, init] = args;

      const newHeaders = new Headers((init as RequestInit)?.headers || {});
      if (newToken) {
        newHeaders.set('Authorization', newToken);
      }

      const newInit: RequestInit = {
        ...(init as RequestInit),
        headers: newHeaders,
      };

      return originalFetch(input, newInit);
    }

    return response;
  }

  // 处理业务错误码 0004 权限不足
  try {
    const cloned = response.clone();
    const contentType = cloned.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await cloned.json();
      if (data && typeof data === 'object' && data.code === '0004') {
        Toast.warning('权限不足');
      }
    }
  } catch {
    // 忽略非JSON或解析失败的情况，保持原始响应
  }
  return response;
};

const App: React.FC = () => {
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `.semi-table-pagination-info{display:none !important;}`;
    document.head.appendChild(style);
    return () => {
      style.remove();
    };
  }, []);

  return (
    <Router future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <Routes>
        <Route path="/login" element={<LoginRedirect />} />
        <Route
          path="/agent-config"
          element={
            <ProtectedRoute>
              <AgentConfigPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/agent-list"
          element={
            <ProtectedRoute>
              <AgentListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/client-management"
          element={
            <ProtectedRoute>
              <ClientManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ai-client-api-management"
          element={
            <ProtectedRoute>
              <ApiManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/advisor-management"
          element={
            <ProtectedRoute>
              <AdvisorManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rag-order-management"
          element={
            <ProtectedRoute>
              <RagManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/client-model-management"
          element={
            <ProtectedRoute>
              <ModelManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/client-system-prompt-management"
          element={
            <ProtectedRoute>
              <PromptManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/client-tool-mcp-management"
          element={
            <ProtectedRoute>
              <McpManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/agent-chat"
          element={
            <ProtectedRoute>
              <AgentChatPage />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/agent-chat" replace />} />
        <Route path="*" element={<Navigate to="/agent-chat" replace />} />
      </Routes>
    </Router>
  );
};

const app = createRoot(document.getElementById('root')!);

app.render(<App />);
