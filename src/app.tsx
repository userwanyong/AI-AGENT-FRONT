import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import React from 'react';
import { Toast } from '@douyinfe/semi-ui';

import { createRoot } from 'react-dom/client';

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

// 全局拦截 fetch：返回码为 0004 时提示“权限不足”
const originalFetch = window.fetch.bind(window);
window.fetch = async (...args) => {
  const response = await originalFetch(...(args as Parameters<typeof fetch>));
  try {
    const cloned = response.clone();
    const contentType = cloned.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await cloned.json();
      if (data && typeof data === 'object' && data.code === '0004') {
        Toast.warning('权限不足');
      }
    }
  } catch (e) {
    // 忽略非JSON或解析失败的情况，保持原始响应
  }
  return response;
};

const App: React.FC = () => (
  <Router future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
    <Routes>
      <Route path="/login" element={<LoginRedirect />} />
      {/* 移除工作台（Dashboard）路由 */}
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

const app = createRoot(document.getElementById('root')!);

app.render(<App />);
