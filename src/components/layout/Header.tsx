import React from 'react';

export interface HeaderProps {
  onToggleSidebar?: () => void;
  onLogout?: () => void;
  collapsed?: boolean;
}

// 整体移除顶部区域：该组件现在不再渲染任何内容
export const Header: React.FC<HeaderProps> = () => null;
