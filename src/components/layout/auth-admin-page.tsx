import React, { useState } from 'react';

import styled from 'styled-components';
import { Layout, Typography } from '@douyinfe/semi-ui';

import { theme } from '../../styles/theme';
import { Sidebar } from './Sidebar';

const { Content } = Layout;
const { Title } = Typography;

/**
 * 认证管理页面通用布局（侧边栏 + 头部 + 内容区）
 */
const AuthAdminLayout = styled(Layout)`
  height: 100vh;
  background: ${theme.colors.bg.secondary};
`;

const MainContent = styled(Content)<{ $collapsed: boolean }>`
  margin-left: ${(props) => (props.$collapsed ? '80px' : '245px')};
  transition: margin-left ${theme.animation.duration.normal} ${theme.animation.easing.cubic};
  overflow-y: auto;
`;

const ContentArea = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
`;

const PageContainer = styled.div`
  flex: 1;
  padding: 24px;
  overflow-y: auto;
`;

const PageCard = styled.div`
  background: ${theme.colors.bg.primary};
  border-radius: ${theme.borderRadius.lg};
  padding: 20px 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
`;

const PageHeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`;

export interface AuthAdminPageProps {
  selectedKey: string;
  title: string;
  extra?: React.ReactNode;
  children: React.ReactNode;
}

export const AuthAdminPage: React.FC<AuthAdminPageProps> = ({ selectedKey, title, extra, children }) => {
  const [collapsed, setCollapsed] = useState(false);

  const handleNavigation = (key: string) => {
    const routeMap: Record<string, string> = {
      'agent-list': '/agent-list',
      'agent-config': '/agent-config',
      'client-management': '/client-management',
      'advisor-management': '/advisor-management',
      'rag-order-management': '/rag-order-management',
      'client-model-management': '/client-model-management',
      'ai-client-api-management': '/ai-client-api-management',
      'client-system-prompt-management': '/client-system-prompt-management',
      'client-tool-mcp-management': '/client-tool-mcp-management',
      'auth-user-management': '/auth-user-management',
      'auth-role-management': '/auth-role-management',
      'auth-permission-management': '/auth-permission-management',
      'auth-login-method-management': '/auth-login-method-management',
    };
    if (routeMap[key]) {
      window.location.href = routeMap[key];
    }
  };

  return (
    <AuthAdminLayout>
      <Sidebar
        selectedKey={selectedKey}
        onSelect={handleNavigation}
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
      />
      <MainContent $collapsed={collapsed}>
        <ContentArea>
          <PageContainer>
            <PageCard>
              <PageHeaderRow>
                <Title heading={4} style={{ margin: 0 }}>
                  {title}
                </Title>
                {extra}
              </PageHeaderRow>
              {children}
            </PageCard>
          </PageContainer>
        </ContentArea>
      </MainContent>
    </AuthAdminLayout>
  );
};
