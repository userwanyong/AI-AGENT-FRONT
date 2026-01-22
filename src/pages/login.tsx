import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';

import styled from 'styled-components';
import { Button, Form, Toast, Typography } from '@douyinfe/semi-ui';
import { IconMail } from '@douyinfe/semi-icons';

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
        setCountdown(60);
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

    // 验证邮箱
    const email = values.email || '';
    if (!email) {
      setEmailError('请输入邮箱地址');
    } else if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setEmailError('请输入正确的邮箱格式');
    }

    // 验证验证码
    if (!values.code) {
      setCodeError('请输入验证码');
    }

    // 如果有错误,不继续执行
    if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/) || !values.code) {
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

        // 保存 token
        localStorage.setItem('token', raw.token);
        localStorage.setItem('userInfo', JSON.stringify(normalized));
        localStorage.setItem('isLoggedIn', 'true');
        Toast.success('登录成功！');
        navigate('/agent-chat');
      } else {
        Toast.error(result.message || '验证码错误或已过期，请重试');
      }
    } catch (error) {
      console.error('登录失败:', error);
      Toast.error('登录失败，请检查网络连接或稍后重试');
    } finally {
      setLoading(false);
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
            <BrandTitle heading={5}>灵犀AI助手</BrandTitle>
          </Brand>
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
        </Header>

        <StyledForm
          onSubmit={handleLogin}
          initValues={{ email: '', code: '' }}
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

          <div style={{ marginTop: '8px' }} />

          <LoginButton type="primary" htmlType="submit" loading={loading}>
            登录
          </LoginButton>
        </StyledForm>
      </LoginCard>
    </LoginContainer>
  );
};

export default LoginPage;
