// 主题配置 - 参考美团、京东等管理后台设计规范
// 管理后台保持白色/蓝色原版样式
// Agent Chat 页面使用 dark/light 子对象和 CSS 变量

export const theme = {
  // 主色调（原版蓝色系，管理后台使用）
  colors: {
    primary: '#1890ff',
    primaryHover: '#40a9ff',
    primaryActive: '#096dd9',

    // 功能色
    success: '#52c41a',
    warning: '#faad14',
    error: '#ff4d4f',
    info: '#1890ff',

    // 中性色（管理后台使用）
    text: {
      primary: '#262626',
      secondary: '#595959',
      tertiary: '#8c8c8c',
      disabled: '#bfbfbf',
    },

    // 背景色（管理后台使用，白色系）
    bg: {
      primary: '#ffffff',
      secondary: '#fafafa',
      tertiary: '#f5f5f5',
      disabled: '#f5f5f5',
    },

    // 边框色（管理后台使用）
    border: {
      primary: '#d9d9d9',
      secondary: '#f0f0f0',
      tertiary: '#e8e8e8',
    },

    // 品牌渐变色（管理后台 Dashboard 使用）
    gradient: {
      primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      secondary: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      tertiary: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    },

    // Agent Chat 专用：暗色模式
    dark: {
      bgSidebar: '#0F0F23',
      bgContent: '#0F172A',
      bgPanel: '#111827',
      bgCard: 'rgba(30, 30, 50, 0.7)',
      bgCardSolid: '#1E1E32',
      bgInput: 'rgba(15, 15, 35, 0.8)',
      bgCode: '#1A1A2E',
      bgHover: 'rgba(217, 119, 6, 0.08)',
      bgActive: 'rgba(217, 119, 6, 0.15)',
      textPrimary: '#F8FAFC',
      textSecondary: '#94A3B8',
      textMuted: '#64748B',
      border: 'rgba(217, 119, 6, 0.15)',
      borderActive: 'rgba(217, 119, 6, 0.4)',
      codeBg: '#1A1810',
      userBubble: 'linear-gradient(135deg, #D97706, #B45309)',
    },

    // Agent Chat 专用：亮色模式
    light: {
      bgSidebar: '#F1F5F9',
      bgContent: '#F8FAFC',
      bgPanel: '#FFFFFF',
      bgCard: 'rgba(255, 255, 255, 0.9)',
      bgCardSolid: '#FFFFFF',
      bgInput: 'rgba(255, 255, 255, 0.9)',
      bgCode: '#F5F3FF',
      bgHover: 'rgba(217, 119, 6, 0.06)',
      bgActive: 'rgba(217, 119, 6, 0.1)',
      textPrimary: '#0F172A',
      textSecondary: '#475569',
      textMuted: '#94A3B8',
      border: '#E2E8F0',
      borderActive: 'rgba(217, 119, 6, 0.4)',
      shadow: '0 4px 12px rgba(217, 119, 6, 0.12)',
    },
  },

  // 字体系统
  typography: {
    fontFamily: {
      heading: "'Space Grotesk', sans-serif",
      body: "'DM Sans', sans-serif",
      code: "'Fira Code', monospace",
      system:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    },
    fontSize: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '24px',
      '3xl': '30px',
      '4xl': '36px',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },

  // 间距
  spacing: {
    xs: '4px',
    sm: '8px',
    base: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
    '3xl': '64px',
  },

  // 圆角
  borderRadius: {
    sm: '4px',
    base: '8px',
    lg: '12px',
    xl: '16px',
    '2xl': '24px',
    pill: '999px',
    full: '50%',
  },

  // 阴影
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    card: '0 2px 8px rgba(0, 0, 0, 0.06)',
    modal: '0 8px 24px rgba(0, 0, 0, 0.12)',
  },

  // 动画
  animation: {
    duration: {
      fast: '0.15s',
      normal: '0.3s',
      slow: '0.5s',
      theme: '0.4s',
    },
    easing: {
      ease: 'ease',
      easeIn: 'ease-in',
      easeOut: 'ease-out',
      easeInOut: 'ease-in-out',
      spring: 'cubic-bezier(0.16, 1, 0.3, 1)',
      cubic: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },

  // 断点
  breakpoints: {
    sm: '375px',
    md: '768px',
    lg: '910px',
    xl: '1280px',
    '2xl': '1536px',
  },

  // Z-index
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modal: 1040,
    popover: 1050,
    tooltip: 1060,
  },
};

export type Theme = typeof theme;
