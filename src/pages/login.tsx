import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect, useCallback, useRef } from 'react';

import styled from 'styled-components';
import { Button, Form, Toast, Typography, Modal, Spin } from '@douyinfe/semi-ui';
import { IconMail, IconLock, IconQrCode } from '@douyinfe/semi-icons';

import { theme } from '../styles/theme';
import { UserService } from '../services';
import type { WechatMiniProgramQrCodeResponseDTO, UserLoginResponseDTO } from '../services/user-service';
import { Card } from '../components/common';

const { Title } = Typography;

// 背景容器，使用绿色渐变与大形状贴近截图
const LoginContainer = styled.div`
  height: 100vh; /* 固定为一屏高度 */
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  isolation: isolate; /* 建立独立 stacking context，确保内容位于背景之上 */
  padding: 0; /* 去掉外围内边距，避免出现滚动条 */
  overflow: hidden; /* 隐藏任何可能的溢出 */
  background: linear-gradient(135deg, #e8efe9 0%, #dfe7e1 40%, #dbe6df 100%);

  &::before {
    content: '';
    position: absolute;
    top: -12vh;
    right: -18vw;
    width: 60vw;
    height: 60vh;
    background: radial-gradient(
      circle at 30% 30%,
      #b7d0bd 0%,
      #93b79c 60%,
      rgba(147, 183, 156, 0.4) 100%
    );
    border-radius: 50%;
    filter: blur(2px);
    z-index: 0; /* 背景层级最低 */
  }

  &::after {
    content: '';
    position: absolute;
    bottom: -18vh;
    left: -18vw;
    width: 55vw;
    height: 55vh;
    background: radial-gradient(
      circle at 70% 70%,
      #b7d0bd 0%,
      #93b79c 60%,
      rgba(147, 183, 156, 0.35) 100%
    );
    border-radius: 50%;
    filter: blur(2px);
    z-index: 0; /* 背景层级最低 */
  }

  @media (max-width: ${theme.breakpoints.sm}) {
    /* 移动端同样保持无外边距，确保不产生滚动 */
    padding: 0;
  }
`;

// 单卡片居中布局
const LoginCard = styled(Card)`
  width: 100%;
  max-width: 420px;
  border-radius: ${theme.borderRadius['2xl']};
  box-shadow: ${theme.shadows.xl} !important;
  border: none !important;
  padding: ${theme.spacing.xl} !important; /* 缩减卡片内边距，减少整体高度 */
  backdrop-filter: saturate(110%);
  position: relative;
  z-index: 1; /* 保证卡片层级在背景之上 */
  max-height: calc(100vh - 40px); /* 预留少量空间，保证一屏内不滚动 */
  overflow: hidden; /* 卡片内部不出现滚动条 */

  @media (max-width: ${theme.breakpoints.sm}) {
    max-width: 360px;
    padding: ${theme.spacing.lg} !important; /* 移动端进一步压缩 */
    border-radius: ${theme.borderRadius.xl};
    max-height: calc(100vh - 24px);
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${theme.spacing.base}; /* 压缩头部与表单的间距 */
`;

const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.base};
`;

const BrandIcon = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: ${theme.colors.bg.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: ${theme.shadows.lg};
  img {
    width: 24px;
    height: 24px;
  }
`;

const BrandTitle = styled(Title)`
  margin: 0 !important;
  font-size: ${theme.typography.fontSize.lg} !important;
  @media (max-width: ${theme.breakpoints.sm}) {
    font-size: ${theme.typography.fontSize.base} !important;
  }
`;

const BroadcastWrapper = styled.div`
  flex: 1;
  margin-left: ${theme.spacing.base};
  height: 24px;
  border-radius: 6px;
  background: transparent;
  border: none;
  overflow: hidden;
  position: relative;
  padding: 0;
  display: flex;
  align-items: center;

  @keyframes tickerScroll {
    0% {
      transform: translateX(0);
    }
    100% {
      transform: translateX(-50%);
    }
  }

  .track-wrap {
    display: inline-flex;
    gap: 24px;
    white-space: nowrap;
    will-change: transform;
    animation: tickerScroll 50s linear infinite;
  }

  .track {
    color: #5f738c;
    font-size: ${theme.typography.fontSize.sm};
  }

  &:hover .track-wrap {
    animation-play-state: paused;
  }
  -webkit-mask-image: linear-gradient(
    to right,
    rgba(0, 0, 0, 0) 0,
    rgba(0, 0, 0, 1) 3px,
    rgba(0, 0, 0, 1) 100%
  );
  mask-image: linear-gradient(
    to right,
    rgba(0, 0, 0, 0) 0,
    rgba(0, 0, 0, 1) 3px,
    rgba(0, 0, 0, 1) 100%
  );
`;

const StyledForm = styled(Form)`
  .semi-form-field {
    margin-bottom: 2px;
  }
  .semi-input-wrapper {
    height: 38px;
    background-color: #ffffff;
    border: 1px solid var(--semi-color-border);
    border-radius: 6px;
    transition: all 0.3s ease;
  }
  .semi-input-wrapper:focus-within {
    border-color: var(--semi-color-primary);
  }

  /* 去掉输入框自动填充的阴影,保留边框 */
  input:-webkit-autofill,
  input:-webkit-autofill:hover,
  input:-webkit-autofill:focus,
  input:-webkit-autofill:active {
    -webkit-box-shadow: none !important;
    -webkit-text-fill-color: inherit !important;
    transition: background-color 5000s ease-in-out 0s;
  }

  @media (max-width: ${theme.breakpoints.sm}) {
    .semi-input-wrapper {
      height: 34px;
    }
  }
`;

// 错误状态的输入框包装器
const EmailFieldWrapper = styled.div<{ $hasError: boolean }>`
  .semi-input-wrapper {
    ${props => props.$hasError && `
      border-color: #ff4d4f !important;
      background-color: #fff2f0 !important;
    `}
    ${props => props.$hasError && `
      &:focus-within {
        border-color: #ff4d4f !important;
        box-shadow: 0 0 0 2px rgba(255, 77, 79, 0.1) !important;
      }
    `}
  }
`;

const CodeFieldWrapper = styled.div<{ $hasError: boolean }>`
  .semi-input-wrapper {
    ${props => props.$hasError && `
      border-color: #ff4d4f !important;
      background-color: #fff2f0 !important;
    `}
    ${props => props.$hasError && `
      &:focus-within {
        border-color: #ff4d4f !important;
        box-shadow: 0 0 0 2px rgba(255, 77, 79, 0.1) !important;
      }
    `}
  }
`;

const PasswordFieldWrapper = styled.div<{ $hasError: boolean }>`
  .semi-input-wrapper {
    ${props => props.$hasError && `
      border-color: #ff4d4f !important;
      background-color: #fff2f0 !important;
    `}
    ${props => props.$hasError && `
      &:focus-within {
        border-color: #ff4d4f !important;
        box-shadow: 0 0 0 2px rgba(255, 77, 79, 0.1) !important;
      }
    `}
  }
`;

const ConfirmPasswordFieldWrapper = styled.div<{ $hasError: boolean }>`
  margin-top: 4px;
  .semi-input-wrapper {
    ${props => props.$hasError && `
      border-color: #ff4d4f !important;
      background-color: #fff2f0 !important;
    `}
    ${props => props.$hasError && `
      &:focus-within {
        border-color: #ff4d4f !important;
        box-shadow: 0 0 0 2px rgba(255, 77, 79, 0.1) !important;
      }
    `}
  }
`;

const LoginButton = styled(Button)`
  width: 100%;
  height: 38px;
  border-radius: ${theme.borderRadius.base};
  background: linear-gradient(135deg, #9ac6a2 0%, #75ad80 100%) !important;
  border: none !important;
  color: white !important;
  font-weight: ${theme.typography.fontWeight.medium};
  @media (max-width: ${theme.breakpoints.sm}) {
    height: 40px;
  }
`;

const GuestLoginWrapper = styled.div`
  margin-top: ${theme.spacing.base};
  display: flex;
  justify-content: flex-end;
  align-items: center;
`;

const SwitchLoginButton = styled.button`
  background: transparent !important;
  border: none !important;
  color: #75ad80 !important;
  font-size: 13px;
  cursor: pointer;
  padding: 4px 8px;
  transition: all 0.3s ease;
  font-weight: 500;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 4px;

  &:hover:not(:disabled) {
    color: #5a9a66 !important;
    text-decoration: underline;
  }

  &:active:not(:disabled) {
    color: #4a8656 !important;
  }

  &:disabled {
    color: #d9d9d9 !important;
    cursor: not-allowed;
  }

  @media (max-width: ${theme.breakpoints.sm}) {
    font-size: 12px;
  }
`;

const CodeInputWrapper = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  margin-top: 2px;

  .semi-form-field {
    flex: 3; /* 验证码输入框占3份 */
    margin-bottom: 0;
  }

  .code-button {
    height: 38px;
    padding: 0 20px;
    flex: 1; /* 按钮占1份 */
    min-width: 100px;
    border-radius: ${theme.borderRadius.base};
    background: transparent !important;
    border: 1.5px solid #9ac6a2 !important;
    color: #75ad80 !important;
    font-weight: 500;
    font-size: 14px;
    white-space: nowrap;
    margin-top: 22px;
    transition: all 0.3s ease;

    &:hover:not(:disabled) {
      border-color: #75ad80 !important;
      background: rgba(117, 173, 128, 0.08) !important;
    }

    &:active:not(:disabled) {
      background: rgba(117, 173, 128, 0.15) !important;
    }

    &:disabled {
      border-color: #d9d9d9 !important;
      color: #bfbfbf !important;
      background: transparent !important;
      cursor: not-allowed;
    }
  }

  @media (max-width: ${theme.breakpoints.sm}) {
    gap: 8px;

    .code-button {
      height: 34px;
      padding: 0 16px;
      font-size: 13px;
    }
  }
`;

// 登录方式切换标签
const LoginTabs = styled.div`
  display: flex;
  margin-bottom: 16px;
  border-bottom: 1px solid #e8e8e8;
`;

const LoginTab = styled.button<{ $active: boolean }>`
  flex: 1;
  padding: 12px 0;
  background: transparent;
  border: none;
  border-bottom: 2px solid ${props => props.$active ? '#75ad80' : 'transparent'};
  color: ${props => props.$active ? '#75ad80' : '#5f738c'};
  font-size: 14px;
  font-weight: ${props => props.$active ? '600' : '400'};
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;

  &:hover {
    color: #75ad80;
  }
`;

// 推荐标识
const RecommendTag = styled.span`
  background: #FF6B00;
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
  margin-left: 4px;
`;

// 微信二维码容器
const WechatQrCodeWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 0;
`;

const QrCodeContainer = styled.div`
  width: 200px;
  height: 200px;
  border: 1px solid #e8e8e8;
  border-radius: ${theme.borderRadius.lg};
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fafafa;
  position: relative;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
  }
`;

const QrCodeStatusOverlay = styled.div<{ $expired?: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: ${props => props.$expired ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.9)'};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
`;

const QrCodeStatusText = styled.div`
  font-size: 14px;
  color: #5f738c;
  margin-top: 12px;
  text-align: center;
`;

const GithubLink = styled.a`
  position: absolute;
  top: 24px;
  right: 24px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
  background: rgba(0, 0, 0, 0.3);
  padding: 8px 14px;
  border-radius: 20px;
  text-decoration: none;
  transition: all 0.3s ease;
  backdrop-filter: blur(4px);

  &:hover {
    color: #fff;
    background: rgba(0, 0, 0, 0.5);
  }

  svg {
    width: 16px;
    height: 16px;
  }

  @media (max-width: ${theme.breakpoints.sm}) {
    top: 16px;
    right: 16px;
    font-size: 12px;
    padding: 6px 12px;
  }
`;

const ScannedUserInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin-top: 12px;

  .avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid #75ad80;
  }

  .nickname {
    font-size: 14px;
    color: #333;
    font-weight: 500;
  }
`;

const RefreshButton = styled(Button)`
  margin-top: 8px;
  font-size: 12px;
`;

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formApi, setFormApi] = useState<any>(null);
  const [codeSending, setCodeSending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [emailError, setEmailError] = useState('');
  const [codeError, setCodeError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loginMode, setLoginMode] = useState<'code' | 'password'>('code'); // 登录方式: 验证码或密码
  const [showInitPassword, setShowInitPassword] = useState(false); // 是否显示密码创建界面
  const [initPasswordEmail, setInitPasswordEmail] = useState(''); // 首次登录的邮箱
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  // 微信二维码登录相关状态
  const [authType, setAuthType] = useState<'email' | 'wechat'>('wechat'); // 登录类型
  const [qrCodeData, setQrCodeData] = useState<WechatMiniProgramQrCodeResponseDTO | null>(null);
  const [qrCodeLoading, setQrCodeLoading] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // 二维码状态枚举（与后端保持一致）
  const QrCodeStatus = {
    PENDING: 'PENDING',       // 等待扫码
    SCANNED: 'SCANNED',       // 已扫码待确认
    AUTHORIZED: 'AUTHORIZED', // 已授权（可以登录）
    CONFIRMED: 'CONFIRMED',   // 已确认
    EXPIRED: 'EXPIRED',       // 已过期
    CANCELLED: 'CANCELLED',   // 已取消
  } as const;

  // 登录页始终使用亮色模式
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    document.body.removeAttribute('body-semi-dark');
    return () => {
      // 离开登录页时恢复用户保存的主题
      const saved = localStorage.getItem('theme');
      const isDark = saved !== 'light';
      document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
      if (isDark) {
        document.body.setAttribute('body-semi-dark', '');
      }
    };
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [countdown]);

  // 清理轮询
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  // 切换登录类型时的处理
  useEffect(() => {
    if (authType === 'wechat') {
      generateQrCode();
    } else {
      // 切换到邮箱登录时停止轮询
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      setQrCodeData(null);
    }
  }, [authType]);

  // 生成微信登录二维码
  const generateQrCode = async () => {
    setQrCodeLoading(true);
    try {
      const result = await UserService.generateWechatMiniProgramQrCode();
      if (result.success && result.data) {
        console.log('✅ 二维码生成成功:', result.data);
        setQrCodeData(result.data);
        // 开始轮询二维码状态
        startPolling(result.data.qrcodeId);
      } else {
        console.error('❌ 生成二维码失败:', result);
        Toast.error(result.message || '生成二维码失败');
      }
    } catch (error) {
      console.error('❌ 生成二维码失败:', error);
      Toast.error('生成二维码失败，请检查网络连接');
    } finally {
      setQrCodeLoading(false);
    }
  };

  // 开始轮询二维码状态
  const startPolling = (qrcodeId: string) => {
    // 先清除之前的轮询
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    // 每2秒轮询一次
    pollingRef.current = setInterval(async () => {
      try {
        const result = await UserService.queryWechatMiniProgramQrCodeStatus(qrcodeId);
        console.log('🔄 轮询二维码状态:', result);
        if (result.success && result.data) {
          console.log('📱 二维码当前状态:', result.data.status);

          // 只更新状态，保留原始的 qrCodeUrl（后端轮询接口可能不返回 qrCodeUrl）
          setQrCodeData(prev => ({
            ...prev,
            ...result.data,
            qrCodeUrl: prev?.qrCodeUrl || result.data.qrCodeUrl, // 优先使用之前的 qrCodeUrl
          } as WechatMiniProgramQrCodeResponseDTO));

          // 根据状态处理
          if (result.data.status === 'CONFIRMED' && result.data.ticket) {
            // 用户已确认，执行登录
            await handleWechatLogin(result.data.ticket);
          } else if (result.data.status === 'AUTHORIZED' && result.data.ticket) {
            // 用户已授权，执行登录
            console.log('✅ 用户已授权，准备登录');
            await handleWechatLogin(result.data.ticket);
          } else if (result.data.status === 'EXPIRED') {
            console.warn('⏰ 二维码已过期');
            // 二维码过期，停止轮询
            if (pollingRef.current) {
              clearInterval(pollingRef.current);
              pollingRef.current = null;
            }
          } else if (result.data.status === 'CANCELLED') {
            console.warn('🚫 用户取消登录');
            // 二维码取消，停止轮询
            if (pollingRef.current) {
              clearInterval(pollingRef.current);
              pollingRef.current = null;
            }
          }
        }
      } catch (error) {
        console.error('❌ 查询二维码状态失败:', error);
      }
    }, 2000);
  };

  // 微信登录
  const handleWechatLogin = async (ticket: string) => {
    // 停止轮询
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }

    // 立即显示成功提示，让用户知道正在处理
    Toast.success('登录成功！正在跳转...');

    setLoading(true);
    try {
      const result = await UserService.loginByWechatMiniProgramQrCode(ticket);
      if (result.success && result.data) {
        handleLoginSuccess(result.data);
      } else {
        Toast.error(result.message || '微信登录失败');
        // 登录失败，重新生成二维码
        generateQrCode();
      }
    } catch (error) {
      console.error('微信登录失败:', error);
      Toast.error('微信登录失败，请重试');
      generateQrCode();
    } finally {
      setLoading(false);
    }
  };

  // 登录成功处理
  const handleLoginSuccess = (data: UserLoginResponseDTO) => {
    const normalized = {
      id: data.id,
      username: data.username,
      email: data.email || '',
      role: data.role,
      avatar: data.avatar,
      status: data.status,
      createTime: data.createTime,
      updateTime: data.updateTime,
    };

    // 保存 token
    localStorage.setItem('token', data.token || data.accessToken || '');
    if (data.refreshToken) {
      localStorage.setItem('refreshToken', data.refreshToken);
    }
    localStorage.setItem('userInfo', JSON.stringify(normalized));
    localStorage.setItem('isLoggedIn', 'true');

    Toast.success('登录成功！');
    navigate('/');
  };

  const handleSendCode = async () => {
    const email = formApi?.getValue('email') || '';

    // 清除验证码区域的错误(不影响邮箱区域)
    setCodeError('');

    // 清除邮箱之前的错误
    setEmailError('');

    // 手动验证邮箱
    if (!email) {
      setEmailError('请输入邮箱地址');
      return;
    }
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setEmailError('请输入正确的邮箱格式');
      return;
    }

    if (countdown > 0) {
      return;
    }

    setCodeSending(true);
    try {
      const result = await UserService.sendEmailCode(email);
      if (result.success) {
        Toast.success('验证码已发送，请注意查收');
        setCountdown(70);
      } else {
        Toast.error(result.message || '发送验证码失败，请稍后重试');
      }
    } catch (error) {
      console.error('发送验证码失败:', error);
      Toast.error('发送验证码失败，请检查网络连接');
    } finally {
      setCodeSending(false);
    }
  };

  const handleLogin = async (values: Record<string, any>) => {
    // 清除之前的错误
    setEmailError('');
    setCodeError('');
    setPasswordError('');

    // 验证邮箱
    const email = values.email || '';
    if (!email) {
      setEmailError('请输入邮箱地址');
      return;
    } else if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setEmailError('请输入正确的邮箱格式');
      return;
    }

    // 根据登录方式进行验证和登录
    if (loginMode === 'code') {
      // 验证码登录
      if (!values.code) {
        setCodeError('请输入验证码');
        return;
      }

      setLoading(true);
      try {
        const result = await UserService.loginByEmail(values.email, values.code);

        if (result.success && result.data) {
          const raw = result.data;

          // 保存 token
          localStorage.setItem('token', raw.token || raw.accessToken || '');
          if (raw.refreshToken) {
            localStorage.setItem('refreshToken', raw.refreshToken);
          }

          const normalized = {
            id: raw.id,
            username: raw.username,
            email: values.email,
            role: raw.role,
            avatar: raw.avatar,
            status: raw.status,
            createTime: raw.createTime,
            updateTime: raw.updateTime,
          };
          localStorage.setItem('userInfo', JSON.stringify(normalized));
          localStorage.setItem('isLoggedIn', 'true');

          // 检查是否是首次登录
          if (raw.isFirst === true || raw.first === true) {
            // 首次登录，提示用户设置密码但允许跳过
            setTimeout(() => {
              Modal.confirm({
                title: '首次登录提示',
                content: '检测到您是首次登录，建议设置登录密码以便下次使用密码登录。您也可以稍后在设置中修改密码。',
                okText: '立即设置',
                cancelText: '稍后设置',
                onOk: () => {
                  // 显示密码初始化界面
                  setInitPasswordEmail(values.email);
                  setShowInitPassword(true);
                  setLoading(false);
                },
                onCancel: () => {
                  // 直接进入聊天页面
                  Toast.success('登录成功！');
                  navigate('/');
                },
              });
            }, 500);
          } else {
            Toast.success('登录成功！');
            navigate('/');
          }
        } else {
          Toast.error(result.message || '验证码错误或已过期，请重试');
        }
      } catch (error) {
        console.error('登录失败:', error);
        Toast.error('登录失败，请检查网络连接或稍后重试');
      } finally {
        setLoading(false);
      }
    } else {
      // 密码登录
      if (!values.password) {
        setPasswordError('请输入密码');
        return;
      }
      if (values.password.length < 6) {
        setPasswordError('密码至少为6位');
        return;
      }

      setLoading(true);
      try {
        const result = await UserService.loginByEmailPassword(values.email, values.password);

        if (result.success && result.data) {
          const raw = result.data;

          // 保存 token
          localStorage.setItem('token', raw.token || raw.accessToken || '');
          if (raw.refreshToken) {
            localStorage.setItem('refreshToken', raw.refreshToken);
          }

          const normalized = {
            id: raw.id,
            username: raw.username,
            email: values.email,
            role: raw.role,
            avatar: raw.avatar,
            status: raw.status,
            createTime: raw.createTime,
            updateTime: raw.updateTime,
          };
          localStorage.setItem('userInfo', JSON.stringify(normalized));
          localStorage.setItem('isLoggedIn', 'true');

          Toast.success('登录成功！');
          navigate('/');
        } else {
          Toast.error(result.message || '邮箱或密码错误，请重试');
        }
      } catch (error) {
        console.error('登录失败:', error);
        Toast.error('登录失败，请检查网络连接或稍后重试');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleInitPassword = async (values: Record<string, any>) => {
    // 清除之前的错误
    setPasswordError('');
    setConfirmPasswordError('');

    // 验证密码
    const password = values.password || '';
    const confirmPassword = values.confirmPassword || '';

    if (!password) {
      setPasswordError('请输入密码');
      return;
    }
    if (password.length < 6) {
      setPasswordError('密码至少为6位');
      return;
    }
    if (!confirmPassword) {
      setConfirmPasswordError('请输入确认密码');
      return;
    }
    if (password !== confirmPassword) {
      setConfirmPasswordError('两次输入的密码不一致');
      return;
    }

    setLoading(true);
    try {
      const result = await UserService.initEmailPassword(initPasswordEmail, password, confirmPassword);

      if (result.success) {
        Toast.success('密码设置成功！登录成功！');
        navigate('/');
      } else {
        Toast.error(result.message || '密码设置失败，请重试');
      }
    } catch (error) {
      console.error('密码设置失败:', error);
      Toast.error('密码设置失败，请检查网络连接或稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleSkipPasswordInit = () => {
    // 跳过密码设置，弹出确认提示框
    Modal.confirm({
      title: '使用默认密码',
      content: '默认密码为 123456，请尽快修改密码以确保账户安全！',
      okText: '确认',
      cancelText: '继续设置密码',
      onOk: () => {
        // 确认使用默认密码，进入聊天页面
        Toast.success('登录成功！');
        navigate('/');
      },
      onCancel: () => {
        // 继续留在密码创建界面
      },
    });
  };

  return (
    <LoginContainer>
      <LoginCard>
        <Header>
          <Brand>
            <BrandIcon>
              <img src="/logo.png" alt="logo" />
            </BrandIcon>
            <BrandTitle heading={5}>
              {showInitPassword ? '设置登录密码' : '灵犀AI助手'}
            </BrandTitle>
          </Brand>
          {!showInitPassword && (
          <BroadcastWrapper>
              <div className="track-wrap">
                <div className="track">✅如未收到验证码，请检查是否被垃圾邮箱拦截</div>
                <div className="track">✅如未收到验证码，请检查是否被垃圾邮箱拦截</div>
                <div className="track">✅如未收到验证码，请检查是否被垃圾邮箱拦截</div>
                <div className="track">✅如未收到验证码，请检查是否被垃圾邮箱拦截</div>
                <div className="track">✅如未收到验证码，请检查是否被垃圾邮箱拦截</div>
                <div className="track">✅如未收到验证码，请检查是否被垃圾邮箱拦截</div>
                <div className="track">✅如未收到验证码，请检查是否被垃圾邮箱拦截</div>
                <div className="track">✅如未收到验证码，请检查是否被垃圾邮箱拦截</div>
                <div className="track">✅如未收到验证码，请检查是否被垃圾邮箱拦截</div>
                <div className="track">✅如未收到验证码，请检查是否被垃圾邮箱拦截</div>
              </div>
            </BroadcastWrapper>
          )}
        </Header>

        {showInitPassword ? (
          // 密码初始化界面
          <StyledForm
            onSubmit={handleInitPassword}
            initValues={{ password: '', confirmPassword: '' }}
            getFormApi={setFormApi}
          >
            <div style={{ marginBottom: '16px', fontSize: '14px', color: '#5f738c' }}>
              设置您的登录密码（密码至少6位）
            </div>

            <PasswordFieldWrapper $hasError={!!passwordError}>
              <Form.Input
                field="password"
                label={
                  <span>
                    <span style={{ color: '#ff4d4f', marginRight: '4px' }}>*</span>
                    密码
                  </span>
                }
                type="password"
                mode="password"
                placeholder={passwordError || '请输入密码（至少6位）'}
                prefix={<IconLock />}
                size="large"
                onFocus={() => setPasswordError('')}
              />
            </PasswordFieldWrapper>

            <ConfirmPasswordFieldWrapper $hasError={!!confirmPasswordError}>
              <Form.Input
                field="confirmPassword"
                label={
                  <span>
                    <span style={{ color: '#ff4d4f', marginRight: '4px' }}>*</span>
                    确认密码
                  </span>
                }
                type="password"
                mode="password"
                placeholder={confirmPasswordError || '请再次输入密码'}
                prefix={<IconLock />}
                size="large"
                onFocus={() => setConfirmPasswordError('')}
              />
            </ConfirmPasswordFieldWrapper>

            <div style={{ marginTop: '8px' }} />

            <LoginButton type="primary" htmlType="submit" loading={loading}>
              完成设置
            </LoginButton>

            <GuestLoginWrapper>
              <SwitchLoginButton
                onClick={handleSkipPasswordInit}
                disabled={loading}
                type="button"
              >
                跳过
              </SwitchLoginButton>
            </GuestLoginWrapper>
          </StyledForm>
        ) : (
          // 正常登录界面
          <>
            {/* 登录方式切换标签 */}
            <LoginTabs>
              <LoginTab
                $active={authType === 'wechat'}
                onClick={() => setAuthType('wechat')}
                type="button"
              >
                <IconQrCode size={16} />
                微信登录
                <RecommendTag>推荐</RecommendTag>
              </LoginTab>
              <LoginTab
                $active={authType === 'email'}
                onClick={() => setAuthType('email')}
                type="button"
              >
                <IconMail size={16} />
                邮箱登录
              </LoginTab>
            </LoginTabs>

            {authType === 'wechat' ? (
              // 微信二维码登录
              <WechatQrCodeWrapper>
                {qrCodeLoading ? (
                  <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Spin size="large" />
                  </div>
                ) : qrCodeData ? (
                  <>
                    <QrCodeContainer>
                      <img
                        src={qrCodeData.qrCodeUrl || ''}
                        alt="微信登录二维码"
                        onError={(e) => {
                          console.error('❌ 二维码图片加载失败:', qrCodeData.qrCodeUrl);
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                      {/* 二维码过期遮罩 */}
                      {qrCodeData.status === QrCodeStatus.EXPIRED && (
                        <QrCodeStatusOverlay $expired>
                          <span style={{ color: '#fff', fontSize: 14 }}>二维码已过期</span>
                          <RefreshButton
                            onClick={generateQrCode}
                            size="small"
                            type="primary"
                          >
                            刷新二维码
                          </RefreshButton>
                        </QrCodeStatusOverlay>
                      )}
                      {/* 已扫码待确认状态 */}
                      {qrCodeData.status === QrCodeStatus.SCANNED && (
                        <QrCodeStatusOverlay>
                          <span style={{ color: '#75ad80', fontSize: 14 }}>扫码成功</span>
                          <span style={{ color: '#5f738c', fontSize: 12 }}>请在手机上确认登录</span>
                        </QrCodeStatusOverlay>
                      )}
                    </QrCodeContainer>

                    {/* 扫码后显示用户信息 */}
                    {qrCodeData.status === QrCodeStatus.SCANNED && (qrCodeData.displayName || qrCodeData.photo) && (
                      <ScannedUserInfo>
                        {qrCodeData.photo && (
                          <img className="avatar" src={qrCodeData.photo} alt="用户头像" />
                        )}
                        {qrCodeData.displayName && (
                          <span className="nickname">{qrCodeData.displayName}</span>
                        )}
                      </ScannedUserInfo>
                    )}

                    <QrCodeStatusText>
                      {qrCodeData.status === QrCodeStatus.PENDING && '请使用微信扫描二维码登录'}
                      {qrCodeData.status === QrCodeStatus.SCANNED && '请在手机微信上确认登录'}
                      {qrCodeData.status === QrCodeStatus.AUTHORIZED && '✅ 登录成功！正在跳转...'}
                      {qrCodeData.status === QrCodeStatus.CONFIRMED && '✅ 登录成功！正在跳转...'}
                      {qrCodeData.status === QrCodeStatus.CANCELLED && '登录已取消，请重新扫码'}
                    </QrCodeStatusText>

                    {qrCodeData.status === QrCodeStatus.EXPIRED && (
                      <RefreshButton onClick={generateQrCode} type="primary">
                        刷新二维码
                      </RefreshButton>
                    )}
                  </>
                ) : (
                  <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5f738c' }}>
                    <Button onClick={generateQrCode} type="primary">
                      获取登录二维码
                    </Button>
                  </div>
                )}
              </WechatQrCodeWrapper>
            ) : (
              // 邮箱登录表单
              <StyledForm
                onSubmit={handleLogin}
                initValues={{ email: '', code: '', password: '' }}
                getFormApi={setFormApi}
              >
                <EmailFieldWrapper $hasError={!!emailError}>
                  <Form.Input
                    field="email"
                    label={
                      <span>
                        <span style={{ color: '#ff4d4f', marginRight: '4px' }}>*</span>
                        邮箱
                      </span>
                    }
                    placeholder={emailError || '请输入邮箱地址'}
                    prefix={<IconMail />}
                    size="large"
                    onFocus={() => setEmailError('')}
                  />
                </EmailFieldWrapper>

                {loginMode === 'code' ? (
                  <CodeInputWrapper>
                    <CodeFieldWrapper $hasError={!!codeError}>
                      <Form.Input
                        field="code"
                        label={
                          <span>
                            <span style={{ color: '#ff4d4f', marginRight: '4px' }}>*</span>
                            验证码
                          </span>
                        }
                        placeholder={codeError || '请输入验证码'}
                        size="large"
                        style={{ flex: 1 }}
                        onFocus={() => setCodeError('')}
                      />
                    </CodeFieldWrapper>
                    <Button
                      className="code-button"
                      onClick={handleSendCode}
                      loading={codeSending}
                      disabled={countdown > 0 || codeSending}
                    >
                      {codeSending ? '发送中...' : countdown > 0 ? `重新发送(${countdown}s)` : '获取验证码'}
                    </Button>
                  </CodeInputWrapper>
                ) : (
                  <PasswordFieldWrapper $hasError={!!passwordError}>
                    <Form.Input
                      field="password"
                      label={
                        <span>
                          <span style={{ color: '#ff4d4f', marginRight: '4px' }}>*</span>
                          密码
                        </span>
                      }
                      type="password"
                      mode="password"
                      placeholder={passwordError || '请输入密码（至少6位）'}
                      prefix={<IconLock />}
                      size="large"
                      onFocus={() => setPasswordError('')}
                    />
                  </PasswordFieldWrapper>
                )}

                <div style={{ marginTop: '8px' }} />

                <LoginButton type="primary" htmlType="submit" loading={loading}>
                  登录
                </LoginButton>
              </StyledForm>
            )}
          </>
        )}
      </LoginCard>

      <GithubLink
        href="https://github.com/userwanyong/AI-AGENT-FRONT"
        target="_blank"
        rel="noopener noreferrer"
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
        </svg>
        GitHub
      </GithubLink>
    </LoginContainer>
  );
};

export default LoginPage;
