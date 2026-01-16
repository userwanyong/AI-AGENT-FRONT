import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';

import styled from 'styled-components';
import { Button, Form, Toast, Typography } from '@douyinfe/semi-ui';
import { IconEyeClosed, IconEyeOpened, IconLock, IconUser } from '@douyinfe/semi-icons';

import { theme } from '../styles/theme';
import { AdminUserService, UserService } from '../services';
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
  }
  .semi-input-wrapper:focus-within {
    border-color: var(--semi-color-primary);
  }
  .reset-pwd-link {
    background: transparent !important;
    box-shadow: none !important;
    padding: 0 !important;
    color: #1a73e8 !important;
    cursor: pointer;
  }
  .reset-pwd-link:hover,
  .reset-pwd-link:focus {
    background: transparent !important;
    box-shadow: none !important;
    color: #0b5ed7 !important;
    text-decoration: underline;
  }
  @media (max-width: ${theme.breakpoints.sm}) {
    .semi-input-wrapper {
      height: 34px;
    }
  }
`;

const LoginButton = styled(Button)`
  width: 100%;
  height: 38px; /* 降低按钮高度 */
  border-radius: ${theme.borderRadius.base};
  background: linear-gradient(135deg, #9ac6a2 0%, #75ad80 100%) !important;
  border: none !important;
  color: white !important;
  font-weight: ${theme.typography.fontWeight.medium};
  @media (max-width: ${theme.breakpoints.sm}) {
    height: 40px;
  }
`;

/* 取消验证码登录与注册按钮区域 */

const RoleRow = styled.div`
  display: grid;
  grid-template-columns: 1fr; /* 仅保留一个游客登录按钮 */
  gap: 10px;
  margin-top: ${theme.spacing.base};

  @media (max-width: ${theme.breakpoints.md}) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (max-width: ${theme.breakpoints.sm}) {
    grid-template-columns: 1fr;
  }
`;

// 彩色光束沿按钮四周顺时针转圈
const GlowWrapper = styled.div`
  position: relative;
  display: block;
  width: 100%;
`;

const GlowButtonInner = styled(Button)`
  position: relative;
  border-radius: ${theme.borderRadius.base};
  background: #ffffff !important;
  color: #1a73e8 !important;
  font-weight: 600;
  width: 100%;
  height: 38px; /* 与确认按钮一致 */
  border: none !important;
  box-shadow: 0 2px 8px rgba(26, 115, 232, 0.12);

  &:hover {
    background: #f7faff !important;
    box-shadow: 0 6px 16px rgba(26, 115, 232, 0.24);
  }

  @media (max-width: ${theme.breakpoints.sm}) {
    height: 40px; /* 小屏与确认按钮一致 */
  }
`;

const BeamSvg = styled.svg`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;

  rect {
    fill: none;
    stroke: url(#beamGradient);
    stroke-width: 3.5;
    stroke-linecap: round;
    /* 使用百分比路径，形成一段彩色光束并顺时针移动 */
    stroke-dasharray: 12 88;
    animation: dashMove 2.8s linear infinite;
  }

  @keyframes dashMove {
    from {
      stroke-dashoffset: 0;
    }
    to {
      stroke-dashoffset: -100;
    } /* 负方向以顺时针效果 */
  }
`;

type GuestGlowButtonProps = {
  onClick: () => void | Promise<void>;
  size?: 'large' | 'default' | 'small';
  children?: React.ReactNode;
};

const GuestGlowButton: React.FC<GuestGlowButtonProps> = ({
  onClick,
  size = 'default',
  children,
}) => (
  <GlowWrapper>
    <GlowButtonInner onClick={onClick} size={size}>
      {children}
    </GlowButtonInner>
    <BeamSvg viewBox="0 0 100 48" preserveAspectRatio="none">
      <defs>
        <linearGradient id="beamGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ff6b6b" />
          <stop offset="25%" stopColor="#f9ca24" />
          <stop offset="50%" stopColor="#6ab04c" />
          <stop offset="75%" stopColor="#00a8ff" />
          <stop offset="100%" stopColor="#9c88ff" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="96" height="44" rx="8" ry="8" pathLength="100" />
    </BeamSvg>
  </GlowWrapper>
);

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formApi, setFormApi] = useState<any>(null);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetCooldown, setResetCooldown] = useState(0);

  useEffect(() => {
    if (resetCooldown > 0) {
      const t = setInterval(() => setResetCooldown((c) => (c > 0 ? c - 1 : 0)), 1000);
      return () => clearInterval(t);
    }
  }, [resetCooldown]);

  const handleLogin = async (values: Record<string, any>) => {
    setLoading(true);
    try {
      if (!values.username || !values.password) {
        Toast.error('请输入账号和密码');
        return;
      }

      const isLoginSuccess = await AdminUserService.validateAdminUserLogin({
        username: values.username,
        password: values.password,
      });

      if (isLoginSuccess) {
        // 统一提取与规范化用户信息，供 agent-chat 页面展示
        const raw =
          typeof isLoginSuccess === 'object'
            ? (isLoginSuccess as any).userInfo || (isLoginSuccess as any).data || isLoginSuccess
            : {};
        const normalized = {
          id: raw.id ?? raw.userId ?? raw.uid ?? undefined,
          username: raw.username ?? raw.name ?? values.username,
          role: raw.role ?? raw.userRole ?? 1,
          avatar: raw.avatar ?? undefined,
        } as any;

        // 保存 token（若存在）与用户信息
        const token = (isLoginSuccess as any).token ?? raw.token;
        if (token) {
          localStorage.setItem('token', token);
        }
        localStorage.setItem('userInfo', JSON.stringify(normalized));
        localStorage.setItem('isLoggedIn', 'true');
        Toast.success('登录成功！');
        navigate('/agent-chat');
      } else {
        Toast.error('账号或密码错误，请重试');
      }
    } catch (error) {
      console.error('登录失败:', error);
      Toast.error('登录失败，请检查网络连接或稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const guestLogin = async () => {
    setLoading(true);
    try {
      // 使用指定游客账号调用真实登录接口
      const result: any = await AdminUserService.validateAdminUserLogin({
        username: 'tourist',
        password: '123456',
      });

      if (result) {
        // 如果后端返回对象（含 token、userInfo），优先使用真实数据
        if (typeof result === 'object') {
          if (result.token) {
            localStorage.setItem('token', result.token);
          }
          const raw = result.userInfo || result.data || result;
          const normalized = {
            id: raw.id ?? raw.userId ?? raw.uid ?? undefined,
            username: raw.username ?? raw.name ?? 'tourist',
            role: raw.role ?? raw.userRole ?? 2,
            avatar: raw.avatar ?? undefined,
          } as any;
          localStorage.setItem('userInfo', JSON.stringify(normalized));
        } else {
          // 如果仅返回布尔值，作为成功登录处理，写入游客信息
          localStorage.setItem('userInfo', JSON.stringify({ username: 'tourist', role: 2 }));
        }
        localStorage.setItem('isLoggedIn', 'true');
        Toast.success('游客登录成功');
        navigate('/agent-chat');
      } else {
        Toast.error('游客登录失败：账号或密码错误');
      }
    } catch (error) {
      console.error('游客登录失败:', error);
      Toast.error('游客登录失败，请检查网络后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPwd = async () => {
    try {
      if (resetLoading) {
        Toast.info('正在重置，请稍候');
        return;
      }
      if (resetCooldown > 0) {
        Toast.info(`密码已重置为123456，请勿频繁点击`);
        return;
      }
      const username = formApi?.getValue('username') || '';
      if (!username) {
        Toast.error('请输入账号后再重置密码');
        return;
      }
      setResetLoading(true);
      const resp = await UserService.resetPassword(username);
      if (resp.code === '0000') {
        Toast.success('重置密码成功');
        setResetCooldown(15);
      } else {
        Toast.error(resp.msg || '重置密码失败');
        setResetCooldown(4);
      }
    } catch (e) {
      Toast.error('重置密码失败');
      setResetCooldown(4);
    } finally {
      setResetLoading(false);
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
              <div className="track">
                ⚠️如登录失败，可能公共密码已被人测试修改，请重置密码后登录
              </div>
              <div className="track">
                ⚠️如登录失败，可能公共密码已被人测试修改，请重置密码后登录
              </div>
              <div className="track">
                ⚠️如登录失败，可能公共密码已被人测试修改，请重置密码后登录
              </div>
              <div className="track">
                ⚠️如登录失败，可能公共密码已被人测试修改，请重置密码后登录
              </div>
              <div className="track">
                ⚠️如登录失败，可能公共密码已被人测试修改，请重置密码后登录
              </div>
              <div className="track">
                ⚠️如登录失败，可能公共密码已被人测试修改，请重置密码后登录
              </div>
              <div className="track">
                ⚠️如登录失败，可能公共密码已被人测试修改，请重置密码后登录
              </div>
              <div className="track">
                ⚠️如登录失败，可能公共密码已被人测试修改，请重置密码后登录
              </div>
              <div className="track">
                ⚠️如登录失败，可能公共密码已被人测试修改，请重置密码后登录
              </div>
              <div className="track">
                ⚠️如登录失败，可能公共密码已被人测试修改，请重置密码后登录
              </div>
              <div className="track">
                ⚠️如登录失败，可能公共密码已被人测试修改，请重置密码后登录
              </div>
              <div className="track">
                ⚠️如登录失败，可能公共密码已被人测试修改，请重置密码后登录
              </div>
            </div>
          </BroadcastWrapper>
        </Header>

        <StyledForm
          onSubmit={handleLogin}
          initValues={{ username: 'wanyj', password: '123456', remember: true }}
          getFormApi={setFormApi}
        >
          <Form.Input
            field="username"
            label="用户名"
            placeholder="请输入账号"
            prefix={<IconUser />}
            size="large"
            rules={[{ required: true, message: '请输入账号' }]}
          />

          <Form.Input
            field="password"
            type={showPassword ? 'text' : 'password'}
            label="密码"
            placeholder="请输入密码"
            prefix={<IconLock />}
            size="large"
            suffix={
              <Button
                theme="borderless"
                icon={showPassword ? <IconEyeClosed /> : <IconEyeOpened />}
                onClick={() => {
                  const el = document.getElementById('loginPwd') as HTMLInputElement | null;
                  const start = el?.selectionStart ?? el?.value.length ?? 0;
                  const end = el?.selectionEnd ?? el?.value.length ?? 0;
                  setShowPassword(!showPassword);
                  setTimeout(() => {
                    const el2 = document.getElementById('loginPwd') as HTMLInputElement | null;
                    if (el2) {
                      el2.focus();
                      el2.setSelectionRange(start, end);
                    }
                  }, 0);
                }}
                style={{ padding: '4px' }}
              />
            }
            id="loginPwd"
            rules={[{ required: true, message: '请输入密码' }]}
          />

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '4px',
              marginBottom: '8px',
            }}
          >
            <Form.Checkbox field="remember" noLabel>
              记住我
            </Form.Checkbox>
            <Button
              theme="borderless"
              type="primary"
              onClick={handleResetPwd}
              className="reset-pwd-link"
              style={{
                background: 'transparent',
                boxShadow: 'none',
                padding: 0,
                cursor: resetLoading || resetCooldown > 0 ? 'not-allowed' : 'pointer',
                opacity: resetLoading || resetCooldown > 0 ? 0.8 : 1,
              }}
            >
              {resetCooldown > 0 ? `重置密码(${resetCooldown}s)` : '重置密码'}
            </Button>
          </div>

          <LoginButton type="primary" htmlType="submit" loading={loading}>
            登录
          </LoginButton>
        </StyledForm>

        <RoleRow>
          <GuestGlowButton onClick={guestLogin} size="large">
            以游客身份登录
          </GuestGlowButton>
        </RoleRow>
      </LoginCard>
    </LoginContainer>
  );
};

export default LoginPage;
