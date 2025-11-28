import { useNavigate } from 'react-router-dom';
import React, { useEffect, useState } from 'react';

import styled from 'styled-components';
import { Layout, Toast } from '@douyinfe/semi-ui';

import { theme } from '../styles/theme';
import { Editor } from '../editor';
import { Sidebar, Header } from '../components/layout';
import { Card } from '../components/common';

const { Content } = Layout;

// 样式组件
const AgentConfigLayout = styled(Layout)`
  min-height: 100vh;
  background: ${theme.colors.bg.secondary};
  position: relative;
`;

const MainContent = styled.div`
  display: flex;
  flex: 1;
  height: 100vh;
  overflow: hidden;
`;

const ContentWrapper = styled.div<{ $sidebarWidth: number }>`
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-left: ${(props) => props.$sidebarWidth}px;
  height: 100vh;
  overflow: hidden;
  transition: margin-left ${theme.animation.duration.normal} ${theme.animation.easing.cubic};
`;

const ContentArea = styled(Content)`
  padding: 0 0 ${theme.spacing.lg} 0;
  background: ${theme.colors.bg.secondary};
  overflow-y: auto;
  flex: 1;
`;

const EditorSection = styled(Card)`
  flex: 1;
  min-height: 600px;
  padding: 0;
  overflow: hidden;
  border: 1px solid ${theme.colors.border.primary};
  margin-bottom: ${theme.spacing.lg};
`;

const EditorContainer = styled.div`
  height: 100%;
  width: 100%;

  .doc-free-feature-overview {
    height: 100%;
    width: 100%;
  }

  .demo-container {
    height: 100%;
    width: 100%;
  }

  .demo-editor {
    height: 100% !important;
    width: 100% !important;
  }
`;

interface UserInfo {
  username: string;
  loginTime: string;
  token: string;
  isTestAccount?: boolean;
}

export const AgentConfigPage: React.FC = () => {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUserInfo = localStorage.getItem('userInfo');

    if (!token || !storedUserInfo) {
      Toast.error('请先登录');
      navigate('/login');
      return;
    }

    try {
      const parsedUserInfo = JSON.parse(storedUserInfo);
      setUserInfo(parsedUserInfo);
    } catch (error) {
      Toast.error('用户信息解析失败');
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    localStorage.removeItem('isLoggedIn');
    Toast.success('已退出登录');
    navigate('/login');
  };

  const handleNavigation = (path: string) => {
    // 处理侧边栏菜单项的导航
    switch (path) {
      case 'dashboard':
        navigate('/dashboard');
        break;
      case 'agent-list':
        navigate('/agent-list');
        break;
      case 'agent-config':
        navigate('/agent-config');
        break;
      case 'client-management':
        navigate('/client-management');
        break;
      case 'ai-client-api-management':
        navigate('/ai-client-api-management');
        break;
      case 'advisor-management':
        navigate('/advisor-management');
        break;
      case 'rag-order-management':
        navigate('/rag-order-management');
        break;
      case 'client-model-management':
        navigate('/client-model-management');
        break;
      case 'client-system-prompt-management':
        navigate('/client-system-prompt-management');
        break;
      case 'client-tool-mcp-management':
        navigate('/client-tool-mcp-management');
        break;
      default:
        navigate(path);
        break;
    }
  };

  if (!userInfo) {
    return null;
  }

  const sidebarWidth = collapsed ? 80 : 280;

  return (
    <AgentConfigLayout>
      <Sidebar selectedKey="agent-config" onSelect={handleNavigation} collapsed={collapsed} />
      <MainContent>
        <ContentWrapper $sidebarWidth={sidebarWidth}>
          <Header
            onToggleSidebar={() => setCollapsed(!collapsed)}
            onLogout={handleLogout}
            collapsed={collapsed}
          />
          <ContentArea>
            <EditorSection>
              <EditorContainer>
                <Editor />
              </EditorContainer>
            </EditorSection>
          </ContentArea>
        </ContentWrapper>
      </MainContent>
    </AgentConfigLayout>
  );
};
