import { useNavigate } from 'react-router-dom';
import React from 'react';

import styled from 'styled-components';
import { Nav, Avatar, Popover, Button, Toast, IconButton } from '@douyinfe/semi-ui';
import { IconApps, IconActivity, IconFolder, IconSidebar } from '@douyinfe/semi-icons';

import { theme } from '../../styles/theme';

interface SidebarProps {
  selectedKey?: string;
  onSelect?: (key: string) => void;
  collapsed?: boolean;
  onToggle?: () => void;
}

const SidebarContainer = styled.div<{ $collapsed: boolean }>`
  width: ${(props) => (props.$collapsed ? '80px' : '245px')};
  height: 100vh;
  background: ${theme.colors.bg.primary};
  border-right: 1px solid ${theme.colors.border.secondary};
  display: flex;
  flex-direction: column;
  transition: width ${theme.animation.duration.normal} ${theme.animation.easing.cubic};
  position: fixed;
  left: 0;
  top: 0;
  z-index: 1000;
  overflow-y: auto;
`;

const SidebarHeader = styled.div<{ $collapsed: boolean }>`
  padding: ${theme.spacing.lg};
  border-bottom: 1px solid ${theme.colors.border.secondary};
  display: flex;
  align-items: center;
  gap: ${theme.spacing.base};
  height: 70px;
`;

const Logo = styled.div`
  width: 40px;
  height: 40px;
  border-radius: ${theme.borderRadius.base};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    border-radius: inherit;
  }
`;

const BrandInfo = styled.div<{ $collapsed: boolean }>`
  display: ${(props) => (props.$collapsed ? 'none' : 'block')};

  h4 {
    margin: 0;
    color: ${theme.colors.text.primary};
    font-weight: ${theme.typography.fontWeight.semibold};
    font-size: ${theme.typography.fontSize.base};
  }

  p {
    margin: 0;
    color: ${theme.colors.text.tertiary};
    font-size: ${theme.typography.fontSize.sm};
  }
`;

const SidebarContent = styled.div`
  flex: 1;
  overflow-y: auto;
`;

const SidebarToggle = styled.div<{ $collapsed: boolean }>`
  position: absolute;
  top: 16px;
  right: 20px;
  z-index: 1101;
`;

const StyledNav = styled(Nav)<{ $collapsed: boolean }>`
  background: transparent;
  border: none;

  .semi-nav-item {
    margin: 4px 0;
    border-radius: ${theme.borderRadius.base};
    transition: all ${theme.animation.duration.normal} ${theme.animation.easing.cubic};

    &:hover {
      background: ${theme.colors.bg.tertiary};
    }

    &.semi-nav-item-selected {
      background: ${theme.colors.primary};
      color: white;

      .semi-icon {
        color: white;
      }

      .semi-nav-item-text {
        color: white;
      }
    }

    .semi-nav-item-text {
      display: ${(props) => (props.$collapsed ? 'none' : 'block')};
    }
  }

  .semi-nav-sub {
    .semi-nav-sub-title-text {
      display: ${(props) => (props.$collapsed ? 'none' : 'inline')};
    }
    .semi-nav-item {
      padding-left: ${(props) => (props.$collapsed ? theme.spacing.base : theme.spacing.xl)};
    }
  }
`;

const SidebarFooter = styled.div<{ $collapsed: boolean }>`
  padding: ${theme.spacing.lg};
  border-top: 1px solid ${theme.colors.border.secondary};
  display: flex;
  align-items: center;
  gap: ${theme.spacing.base};
`;

const UserInfo = styled.div<{ $collapsed: boolean }>`
  display: ${(props) => (props.$collapsed ? 'none' : 'flex')};
  flex-direction: column;
  flex: 1;

  .username {
    color: ${theme.colors.text.primary};
    font-weight: ${theme.typography.fontWeight.medium};
    font-size: ${theme.typography.fontSize.sm};
    margin: 0;
  }

  .role {
    color: ${theme.colors.text.tertiary};
    font-size: ${theme.typography.fontSize.xs};
    margin: 0;
  }
`;

const menuItems = [
  {
    itemKey: 'agents',
    text: '智能体管理',
    icon: <IconApps />,
    items: [
      {
        itemKey: 'agent-list',
        text: '智能体列表',
      },
      {
        itemKey: 'agent-config',
        text: '智能体配置',
      },
    ],
  },
  {
    itemKey: 'resources',
    text: '资源管理',
    icon: <IconFolder />,
    items: [
      {
        itemKey: 'client-management',
        text: '客户端管理',
      },
      {
        itemKey: 'advisor-management',
        text: '顾问管理',
      },
      {
        itemKey: 'rag-order-management',
        text: '知识库管理',
      },
      {
        itemKey: 'client-model-management',
        text: '模型管理',
      },
      {
        itemKey: 'ai-client-api-management',
        text: 'API管理',
      },
      {
        itemKey: 'client-system-prompt-management',
        text: '系统提示词管理',
      },
      {
        itemKey: 'client-tool-mcp-management',
        text: 'MCP工具管理',
      },
    ],
  },
  {
    itemKey: 'experience',
    text: '体验链接',
    icon: <IconActivity />,
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  selectedKey = 'agent-list',
  onSelect,
  collapsed = false,
  onToggle,
}) => {
  const navigate = useNavigate();
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const rawRole = (userInfo as any)?.role;
  const roleCode = typeof rawRole === 'string' ? parseInt(rawRole, 10) : rawRole;
  const roleText =
    roleCode === 0 ? '管理员' : roleCode === 1 ? '用户' : roleCode === 2 ? '游客' : '用户';

  // 添加处理导航的函数
  const handleNavigation = (key: string) => {
    if (key === 'experience') {
      window.open('/agent-chat', '_blank');
    } else {
      onSelect?.(key);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    localStorage.removeItem('isLoggedIn');
    Toast.success('已退出登录');
    navigate('/login');
  };

  return (
    <SidebarContainer $collapsed={collapsed}>
      <SidebarHeader $collapsed={collapsed}>
        <Logo>
          <img src="/logo.png" alt="logo" />
        </Logo>
        <BrandInfo $collapsed={collapsed}>
          <h3>灵犀助手后台</h3>
        </BrandInfo>
        {!collapsed && (
          <IconButton
            theme="borderless"
            type="tertiary"
            icon={<IconSidebar />}
            style={{ marginLeft: 'auto', marginRight: 0 }}
            onClick={() => onToggle?.()}
          />
        )}
      </SidebarHeader>

      <SidebarContent>
        <StyledNav
          $collapsed={collapsed}
          isCollapsed={collapsed}
          selectedKeys={[selectedKey]}
          subNavProps={{ trigger: 'click', dropdownProps: { trigger: 'click' } }}
          onSelect={({ selectedKeys }: { selectedKeys: string[] }) => {
            const key = selectedKeys[0] as string;
            handleNavigation(key); // 使用新的处理函数
          }}
          items={menuItems}
        />
      </SidebarContent>
      {collapsed && (
        <SidebarToggle $collapsed={collapsed}>
          <IconButton
            size="small"
            type="secondary"
            icon={<IconSidebar />}
            onClick={() => onToggle?.()}
          />
        </SidebarToggle>
      )}
      <SidebarFooter $collapsed={collapsed}>
        <Popover
          trigger="hover"
          position="rightTop"
          spacing={8}
          content={
            <div style={{ padding: '8px 12px', minWidth: 160 }}>
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontWeight: 600 }}>{userInfo.username || '用户'}</div>
                <div style={{ fontSize: 12, color: '#999' }}>{roleText}</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button size="small" type="secondary" onClick={handleLogout}>
                  退出登录
                </Button>
              </div>
            </div>
          }
        >
          <Avatar size="small" color="blue">
            {userInfo.username?.[0]?.toUpperCase() || 'U'}
          </Avatar>
        </Popover>
        <UserInfo $collapsed={collapsed}>
          <p className="username">{userInfo.username || '用户'}</p>
          <p className="role">{roleText}</p>
        </UserInfo>
      </SidebarFooter>
    </SidebarContainer>
  );
};
