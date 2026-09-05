import { useNavigate, useSearchParams } from 'react-router-dom';
import React, { useState, useEffect, useRef } from 'react';

import styled from 'styled-components';
import { Button, Form, Toast, Typography, Modal } from '@douyinfe/semi-ui';
import { IconMail, IconLock, IconUser, IconPhone } from '@douyinfe/semi-icons';

import { UserService } from '../services';
import type { UserLoginResponseDTO } from '../services/user-service';

const { Title, Text } = Typography;

// ---------------------------------------------------------------------------
// 登录方式编码 → 展示配置
// 后端返回 auth-service 的方式编码：password / email:* / sms:* / oauth:gitee / oauth:github
// ---------------------------------------------------------------------------

type FormMethod = 'password' | 'email' | 'sms';

interface MethodMeta {
  tab: FormMethod;
  label: string;
  accountLabel: string;
  accountField: string;
  placeholder: string;
  needCode: boolean;
}

const FORM_METHOD_META: Record<FormMethod, MethodMeta> = {
  password: {
    tab: 'password',
    label: '密码登录',
    accountLabel: '用户名',
    accountField: 'username',
    placeholder: '请输入用户名',
    needCode: false,
  },
  email: {
    tab: 'email',
    label: '邮箱登录',
    accountLabel: '邮箱地址',
    accountField: 'target',
    placeholder: '请输入邮箱地址',
    needCode: true,
  },
  sms: {
    tab: 'sms',
    label: '手机登录',
    accountLabel: '手机号',
    accountField: 'target',
    placeholder: '请输入手机号',
    needCode: true,
  },
};

const OAUTH_META: Record<string, { label: string; color: string }> = {
  gitee: { label: 'Gitee', color: '#c71d23' },
  github: { label: 'GitHub', color: '#24292f' },
};

const GiteeIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M11.98 2.4C6.5 2.4 2 5.27 2 9.09c0 2.58 2.06 4.82 5.1 6.1-.16.6-.5 2.04-.54 2.36-.06.44-.27.53.12.3.32-.19 1.1-.65 2.13-1.27.99.14 2.02.22 3.07.22 5.48 0 9.98-2.87 9.98-6.71 0-3.82-4.4-7.69-9.88-7.69zM7.53 10.9c-.35 0-.63-.28-.63-.63s.28-.64.63-.64.63.29.63.64-.28.63-.63.63zm2.83 0c-.35 0-.63-.28-.63-.63s.28-.64.63-.64.63.29.63.64-.28.63-.63.63zm2.83 0c-.35 0-.63-.28-.63-.63s.28-.64.63-.64.63.29.63.64-.28.63-.63.63zm2.98 0c-.35 0-.63-.28-.63-.63s.28-.64.63-.64.63.29.63.64-.28.63-.63.63z" />
  </svg>
);

const GithubIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55 0-.27-.01-1.17-.02-2.12-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.76 2.69 1.25 3.35.96.1-.75.4-1.25.72-1.54-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.25 5.67.41.35.77 1.05.77 2.12 0 1.53-.01 2.76-.01 3.14 0 .3.2.67.8.55A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z" />
  </svg>
);

// ---------------------------------------------------------------------------
// 样式
// ---------------------------------------------------------------------------

const LoginContainer = styled.div`
  min-height: 100vh;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  overflow: hidden;
  background: linear-gradient(140deg, #1b1f3b 0%, #2b2660 45%, #3d2f7d 75%, #241a4d 100%);

  /* 装饰光斑 */
  &::before,
  &::after {
    content: '';
    position: absolute;
    border-radius: 50%;
    filter: blur(90px);
    z-index: 0;
  }
  &::before {
    width: 520px;
    height: 520px;
    top: -160px;
    right: -120px;
    background: rgba(124, 108, 255, 0.35);
  }
  &::after {
    width: 460px;
    height: 460px;
    bottom: -180px;
    left: -140px;
    background: rgba(64, 166, 255, 0.25);
  }
`;

const LoginCard = styled.div`
  position: relative;
  z-index: 1;
  width: 420px;
  max-width: 100%;
  padding: 40px 36px 32px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.98);
  box-shadow:
    0 24px 60px rgba(15, 12, 41, 0.45),
    0 4px 16px rgba(15, 12, 41, 0.25);
`;

const Brand = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  margin-bottom: 28px;
`;

const BrandLogo = styled.img`
  width: 52px;
  height: 52px;
  border-radius: 14px;
  box-shadow: 0 6px 18px rgba(59, 43, 158, 0.35);
`;

const BrandTitle = styled(Title)`
  margin: 0 !important;
  font-weight: 700 !important;
  letter-spacing: 1px;
`;

const BrandSubtitle = styled(Text)`
  color: #8a8fa8;
`;

const MethodTabs = styled.div`
  display: flex;
  gap: 6px;
  padding: 5px;
  margin-bottom: 26px;
  background: #f1f2f7;
  border-radius: 12px;
`;

const MethodTab = styled.button<{ $active: boolean }>`
  flex: 1;
  padding: 9px 0;
  border: none;
  border-radius: 9px;
  background: ${(props) => (props.$active ? '#ffffff' : 'transparent')};
  color: ${(props) => (props.$active ? '#3b2b9e' : '#7a7f99')};
  font-size: 14px;
  font-weight: ${(props) => (props.$active ? 600 : 400)};
  cursor: pointer;
  box-shadow: ${(props) => (props.$active ? '0 2px 8px rgba(30, 25, 80, 0.12)' : 'none')};
  transition: all 0.2s ease;
`;

const FieldWrapper = styled.div<{ $hasError?: boolean }>`
  margin-bottom: 16px;

  .semi-input-wrapper {
    border-radius: 10px;
    border: 1.5px solid ${(props) => (props.$hasError ? '#f93920' : '#e3e5ef')};
    transition: border-color 0.2s ease;
  }
  .semi-input-wrapper:focus-within {
    border-color: #6a5ae0;
  }
  .semi-input {
    font-size: 14px;
  }
`;

const CodeFieldWrapper = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;

  /* Semi Form 字段包装器默认占位错误信息导致高度不一致，统一对齐 */
  .semi-field {
    margin-bottom: 0;
  }
  .semi-input-wrapper {
    height: 40px;
  }
`;

const CodeButton = styled(Button)`
  height: 40px;
  border-radius: 10px;
  flex-shrink: 0;
  width: 116px;
  font-size: 13px;
`;

const LoginButton = styled(Button)`
  width: 100%;
  height: 44px;
  margin-top: 8px;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 4px;
  color: #ffffff !important;
  background: linear-gradient(135deg, #6a5ae0 0%, #4d7cf0 100%);
  border: none;
  transition: filter 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    color: #ffffff !important;
    filter: brightness(1.08);
    box-shadow: 0 8px 20px rgba(93, 78, 216, 0.4);
  }

  &:disabled {
    color: rgba(255, 255, 255, 0.7) !important;
  }
`;

/* 首次登录设密弹窗按钮：与弹窗内其他按钮同高同行对齐（不复用 LoginButton 的外边距/宽度） */
const ModalSecondaryButton = styled(Button)`
  flex: 1;
  height: 40px;
  margin: 0;
  border-radius: 10px;
  font-size: 14px;
`;

const ModalPrimaryButton = styled(Button)`
  flex: 1;
  height: 40px;
  margin: 0;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  color: #ffffff !important;
  background: linear-gradient(135deg, #6a5ae0 0%, #4d7cf0 100%);
  border: none;
  transition: filter 0.2s ease;

  &:hover {
    color: #ffffff !important;
    filter: brightness(1.08);
  }

  &:disabled {
    color: rgba(255, 255, 255, 0.7) !important;
  }
`;

const Divider = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 26px 0 16px;
  color: #a0a4bb;
  font-size: 12px;

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #e7e8f2;
  }
`;

const OAuthRow = styled.div`
  display: flex;
  gap: 12px;
`;

const OAuthButton = styled.button<{ $color: string }>`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 0;
  border-radius: 10px;
  border: 1.5px solid #e3e5ef;
  background: #ffffff;
  color: ${(props) => props.$color};
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${(props) => props.$color};
    background: rgba(106, 90, 224, 0.04);
  }
`;

const FooterTip = styled(Text)`
  display: block;
  margin-top: 22px;
  text-align: center;
  color: #a0a4bb;
  font-size: 12px;
`;

// ---------------------------------------------------------------------------
// 组件
// ---------------------------------------------------------------------------

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // 后端下发的已启用登录方式
  const [enabledMethods, setEnabledMethods] = useState<string[]>([]);
  const [methodsLoading, setMethodsLoading] = useState(true);

  // 可用的表单登录方式与 OAuth 提供方
  const [formTabs, setFormTabs] = useState<FormMethod[]>([]);
  const [oauthProviders, setOauthProviders] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<FormMethod>('password');

  const [submitting, setSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [sendingCode, setSendingCode] = useState(false);
  const [accountError, setAccountError] = useState(false);

  // 首次登录设置密码
  const [showInitPassword, setShowInitPassword] = useState(false);
  const [initPasswordLoading, setInitPasswordLoading] = useState(false);

  const formApiRef = useRef<any>(null);
  const countdownTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // 加载租户已启用的登录方式（管理端开闭后登录页自动同步）
  useEffect(() => {
    let mounted = true;
    (async () => {
      const result = await UserService.getLoginMethods();
      if (!mounted) {
        return;
      }
      const methods = result.success && result.data ? result.data : ['password'];
      setEnabledMethods(methods);

      const tabs: FormMethod[] = [];
      if (methods.includes('password')) {
        tabs.push('password');
      }
      if (methods.some((m) => m.startsWith('email:'))) {
        tabs.push('email');
      }
      if (methods.some((m) => m.startsWith('sms:'))) {
        tabs.push('sms');
      }
      setFormTabs(tabs);
      setActiveTab(tabs[0] || 'password');

      setOauthProviders(methods.filter((m) => m.startsWith('oauth:')).map((m) => m.slice('oauth:'.length)));
      setMethodsLoading(false);

      if (!result.success) {
        Toast.warning(result.message || '登录方式获取失败，已展示默认方式');
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // OAuth 失败重定向提示
  useEffect(() => {
    const oauthError = searchParams.get('oauthError');
    if (oauthError) {
      Toast.error(oauthError);
    }
  }, [searchParams]);

  // 验证码倒计时
  useEffect(() => {
    if (countdown <= 0) {
      if (countdownTimer.current) {
        clearInterval(countdownTimer.current);
        countdownTimer.current = null;
      }
      return;
    }
    countdownTimer.current = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => {
      if (countdownTimer.current) {
        clearInterval(countdownTimer.current);
      }
    };
  }, [countdown > 0]);

  const meta = FORM_METHOD_META[activeTab];

  const persistLogin = (data: UserLoginResponseDTO) => {
    const token = data.accessToken || data.token || '';
    if (token) {
      localStorage.setItem('token', token);
    }
    if (data.refreshToken) {
      localStorage.setItem('refreshToken', data.refreshToken);
    }
    localStorage.setItem(
      'userInfo',
      JSON.stringify({
        id: data.id,
        username: data.username,
        email: data.email || '',
        role: data.role,
        avatar: data.avatar || '',
        status: data.status,
        createTime: data.createTime,
        updateTime: data.updateTime,
      })
    );
    localStorage.setItem('isLoggedIn', 'true');
  };

  const handleLoginSuccess = (data: UserLoginResponseDTO) => {
    persistLogin(data);
    if (data.isFirst || (data as any).first) {
      // 验证码自动注册的新用户：引导设置密码
      Modal.confirm({
        title: '设置登录密码',
        content: '检测到你是首次登录，建议设置密码以便下次使用账号密码登录',
        okText: '立即设置',
        cancelText: '跳过',
        onOk: () => setShowInitPassword(true),
        onCancel: () => navigate('/'),
      });
    } else {
      Toast.success('登录成功');
      navigate('/');
    }
  };

  // 密码登录
  const handlePasswordLogin = async (values: Record<string, string>) => {
    setSubmitting(true);
    try {
      const result = await UserService.loginByPassword(values.username || '', values.password || '');
      if (result.success && result.data) {
        handleLoginSuccess(result.data);
      } else {
        Toast.error(result.message || '用户名或密码错误');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // 发送验证码
  const handleSendCode = async () => {
    const values = formApiRef.current?.getValues() || {};
    const target: string = values.target || '';
    if (!target) {
      setAccountError(true);
      Toast.warning(`请先输入${meta.accountLabel}`);
      return;
    }
    setAccountError(false);
    setSendingCode(true);
    try {
      const result = await UserService.sendLoginCode(target);
      if (result.success) {
        Toast.success('验证码已发送，请注意查收');
        setCountdown(60);
      } else {
        Toast.error(result.message || '验证码发送失败');
      }
    } finally {
      setSendingCode(false);
    }
  };

  // 验证码登录
  const handleCodeLogin = async (values: Record<string, string>) => {
    setSubmitting(true);
    try {
      const result = await UserService.loginByCode(values.target || '', values.code || '');
      if (result.success && result.data) {
        handleLoginSuccess(result.data);
      } else {
        Toast.error(result.message || '验证码错误或已过期');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (values: Record<string, string>) => {
    if (activeTab === 'password') {
      handlePasswordLogin(values);
    } else {
      handleCodeLogin(values);
    }
  };

  // OAuth 登录：跳转后端授权入口，由后端 302 到提供方
  const handleOAuthLogin = (provider: string) => {
    window.location.href = UserService.getOAuthAuthorizeUrl(provider);
  };

  // 首次登录设置密码
  const handleInitPassword = async (values: Record<string, string>) => {
    if (!values.newPassword || values.newPassword.length < 6) {
      Toast.warning('密码长度至少 6 位');
      return;
    }
    if (values.newPassword !== values.confirmPassword) {
      Toast.warning('两次输入的密码不一致');
      return;
    }
    setInitPasswordLoading(true);
    try {
      const result = await UserService.setPassword(values.newPassword);
      if (result.success) {
        Toast.success('密码设置成功');
        setShowInitPassword(false);
        navigate('/');
      } else {
        Toast.error(result.message || '密码设置失败');
      }
    } finally {
      setInitPasswordLoading(false);
    }
  };

  return (
    <div data-theme="light">
      <LoginContainer>
        <LoginCard>
          <Brand>
            <BrandLogo src="/logo.png" alt="logo" />
            <BrandTitle heading={4}>灵犀AI助手</BrandTitle>
            <BrandSubtitle size="small">登录后开启你的智能对话之旅</BrandSubtitle>
          </Brand>

          {methodsLoading ? (
            <div style={{ textAlign: 'center', padding: '36px 0', color: '#8a8fa8' }}>加载登录方式中…</div>
          ) : (
            <>
              {formTabs.length > 0 && (
                <>
                  {formTabs.length > 1 && (
                    <MethodTabs>
                      {formTabs.map((tab) => (
                        <MethodTab
                          key={tab}
                          type="button"
                          $active={activeTab === tab}
                          onClick={() => setActiveTab(tab)}
                        >
                          {FORM_METHOD_META[tab].label}
                        </MethodTab>
                      ))}
                    </MethodTabs>
                  )}

                  <Form getFormApi={(api: any) => (formApiRef.current = api)} onSubmit={handleSubmit}>
                    <FieldWrapper $hasError={accountError}>
                      <Form.Input
                        field={meta.accountField}
                        noLabel
                        size="large"
                        placeholder={meta.placeholder}
                        prefix={activeTab === 'password' ? <IconUser /> : activeTab === 'sms' ? <IconPhone /> : <IconMail />}
                        onChange={() => setAccountError(false)}
                        rules={[{ required: true, message: `请输入${meta.accountLabel}` }]}
                      />
                    </FieldWrapper>

                    {activeTab === 'password' && (
                      <FieldWrapper>
                        <Form.Input
                          field="password"
                          noLabel
                          size="large"
                          mode="password"
                          placeholder="请输入密码"
                          prefix={<IconLock />}
                          rules={[{ required: true, message: '请输入密码' }]}
                        />
                      </FieldWrapper>
                    )}

                    {meta.needCode && (
                      <FieldWrapper>
                        <CodeFieldWrapper>
                          <div style={{ flex: 1 }}>
                            <Form.Input
                              field="code"
                              noLabel
                              size="large"
                              placeholder="请输入验证码"
                              prefix={<IconMail />}
                              rules={[{ required: true, message: '请输入验证码' }]}
                            />
                          </div>
                          <CodeButton
                            type="tertiary"
                            theme="light"
                            disabled={countdown > 0 || sendingCode}
                            loading={sendingCode}
                            onClick={handleSendCode}
                          >
                            {countdown > 0 ? `${countdown}s 后重发` : '获取验证码'}
                          </CodeButton>
                        </CodeFieldWrapper>
                      </FieldWrapper>
                    )}

                    <LoginButton htmlType="submit" loading={submitting}>
                      登录
                    </LoginButton>
                  </Form>
                </>
              )}

              {oauthProviders.length > 0 && (
                <>
                  <Divider>第三方登录</Divider>
                  <OAuthRow>
                    {oauthProviders.map((provider) => {
                      const providerMeta = OAUTH_META[provider] || { label: provider, color: '#333' };
                      return (
                        <OAuthButton
                          key={provider}
                          type="button"
                          $color={providerMeta.color}
                          onClick={() => handleOAuthLogin(provider)}
                        >
                          {provider === 'gitee' ? <GiteeIcon /> : provider === 'github' ? <GithubIcon /> : null}
                          {providerMeta.label} 登录
                        </OAuthButton>
                      );
                    })}
                  </OAuthRow>
                </>
              )}

              <FooterTip>
                {enabledMethods.some((m) => m.startsWith('email:'))
                  ? '未注册的邮箱验证码登录将自动注册账号'
                  : '登录方式由管理员在认证服务中配置'}
              </FooterTip>
            </>
          )}
        </LoginCard>
      </LoginContainer>

      {/* 首次登录设置密码 */}
      <Modal
        title="设置登录密码"
        visible={showInitPassword}
        footer={null}
        closeOnEsc
        onCancel={() => {
          setShowInitPassword(false);
          navigate('/');
        }}
      >
        <div style={{ color: '#8a8fa8', fontSize: 13, marginBottom: 16 }}>
          为方便下次登录，请为你的账号设置一个密码（可跳过，跳过后将无法使用密码登录）
        </div>
        <Form onSubmit={handleInitPassword}>
          <FieldWrapper>
            <Form.Input
              field="newPassword"
              noLabel
              size="large"
              mode="password"
              placeholder="设置密码（6~50 位）"
              prefix={<IconLock />}
              rules={[{ required: true, message: '请输入密码' }]}
            />
          </FieldWrapper>
          <FieldWrapper>
            <Form.Input
              field="confirmPassword"
              noLabel
              size="large"
              mode="password"
              placeholder="确认密码"
              prefix={<IconLock />}
              rules={[{ required: true, message: '请再次输入密码' }]}
            />
          </FieldWrapper>
          <div style={{ display: 'flex', gap: 12, alignItems: 'stretch' }}>
            <ModalSecondaryButton
              type="tertiary"
              theme="light"
              onClick={() => {
                setShowInitPassword(false);
                navigate('/');
              }}
            >
              跳过
            </ModalSecondaryButton>
            <ModalPrimaryButton htmlType="submit" loading={initPasswordLoading}>
              保存
            </ModalPrimaryButton>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default LoginPage;
