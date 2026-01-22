import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';

import styled from 'styled-components';
import { Button, Form, Toast, Typography, Modal } from '@douyinfe/semi-ui';
import { IconMail, IconLock } from '@douyinfe/semi-icons';

import { theme } from '../styles/theme';
import { UserService } from '../services';
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
  justify-content: space-between;
  align-items: center;
`;

const GuestLoginButton = styled.button`
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

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formApi, setFormApi] = useState<any>(null);
  const [codeSending, setCodeSending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [emailError, setEmailError] = useState('');
  const [codeError, setCodeError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [guestLogging, setGuestLogging] = useState(false);
  const [loginMode, setLoginMode] = useState<'code' | 'password'>('code'); // 登录方式: 验证码或密码
  const [showInitPassword, setShowInitPassword] = useState(false); // 是否显示密码创建界面
  const [initPasswordEmail, setInitPasswordEmail] = useState(''); // 首次登录的邮箱
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  useEffect(() => {
    if (countdown > 0) {
      const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [countdown]);

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

          // 保存 token，直接登录成功
          localStorage.setItem('token', raw.token);
          localStorage.setItem('userInfo', JSON.stringify(normalized));
          localStorage.setItem('isLoggedIn', 'true');

          // 检查是否是首次登录
          if (raw.first === true) {
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
                  navigate('/agent-chat');
                },
              });
            }, 500);
          } else {
            Toast.success('登录成功！');
            navigate('/agent-chat');
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

          // 保存 token
          localStorage.setItem('token', raw.token);
          localStorage.setItem('userInfo', JSON.stringify(normalized));
          localStorage.setItem('isLoggedIn', 'true');
          Toast.success('登录成功！');
          navigate('/agent-chat');
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
        navigate('/agent-chat');
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
        navigate('/agent-chat');
      },
      onCancel: () => {
        // 继续留在密码创建界面
      },
    });
  };

  const handleGuestLogin = async () => {
    setGuestLogging(true);
    try {
      const result = await UserService.validateAdminUserLogin({
        username: 'tourist',
        password: '123456'
      });

      if (result.success && result.data) {
        const raw = result.data;
        const normalized = {
          id: raw.id,
          username: raw.username,
          email: raw.email || '',
          role: raw.role,
          avatar: raw.avatar,
          status: raw.status,
          createTime: raw.createTime,
          updateTime: raw.updateTime,
        };

        // 保存 token
        localStorage.setItem('token', raw.token);
        localStorage.setItem('userInfo', JSON.stringify(normalized));
        localStorage.setItem('isLoggedIn', 'true');
        Toast.success('访客登录成功！');
        navigate('/agent-chat');
      } else {
        Toast.error(result.message || '访客登录失败，请稍后重试');
      }
    } catch (error) {
      console.error('访客登录失败:', error);
      Toast.error('访客登录失败，请检查网络连接或稍后重试');
    } finally {
      setGuestLogging(false);
    }
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
              <div style={{ flex: 1 }} />
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

            <GuestLoginWrapper>
              <SwitchLoginButton
                onClick={() => {
                  setLoginMode(loginMode === 'code' ? 'password' : 'code');
                  setEmailError('');
                  setCodeError('');
                  setPasswordError('');
                }}
                disabled={loading || guestLogging}
                type="button"
              >
                {loginMode === 'code' ? '邮箱密码登录' : '邮箱验证码登录'}
              </SwitchLoginButton>
              <GuestLoginButton
                onClick={handleGuestLogin}
                disabled={guestLogging || loading}
              >
                {guestLogging ? '访客登录中...' : '访客登录☞'}
              </GuestLoginButton>
            </GuestLoginWrapper>
          </StyledForm>
        )}
      </LoginCard>
    </LoginContainer>
  );
};

export default LoginPage;
