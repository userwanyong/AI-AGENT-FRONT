import React, { useCallback, useEffect, useRef, useState } from 'react';

import styled from 'styled-components';
import { Button, Input, Popconfirm, Select, Spin, Tabs, Tag, Toast, Typography } from '@douyinfe/semi-ui';
import { IconCamera, IconTickCircle } from '@douyinfe/semi-icons';

import { UserService } from '../services';
import type { UserProfileResponseDTO } from '../services/user-service';
import { logoutAndRedirect } from '../utils/logout';

const { Text } = Typography;

/**
 * 左下角个人中心独立弹窗内容
 *
 * - 资料：头像上传、昵称/真实姓名/性别/生日修改（RPC）
 * - 账号绑定：邮箱/手机（验证码）、第三方（Gitee/GitHub）
 * - 安全：设置/修改密码
 */

const OAUTH_PROVIDERS = [
  { provider: 'gitee', label: 'Gitee', color: '#c71d23' },
  { provider: 'github', label: 'GitHub', color: '#24292f' },
];

// 第三方自动注册的用户名前缀（auth-service 约定）
const isThirdPartyRegistered = (profile: UserProfileResponseDTO | null): boolean => {
  if (!profile) {
    return false;
  }
  if ((profile.oauthBindings || []).length > 0) {
    return true;
  }
  return /^(gitee|github)_/.test(profile.username || '');
};

// ---------------------------------------------------------------------------
// 样式（与登录页同一套设计语言：靛蓝主色 / 渐变 / 圆角 / 柔和边框 / 聚焦高亮）
// ---------------------------------------------------------------------------

const PRIMARY = '#6a5ae0';
const GRADIENT = 'linear-gradient(135deg, #6a5ae0 0%, #4d7cf0 100%)';

const CenterContainer = styled.div`
  width: 100%;
  max-height: 62vh;
  overflow-y: auto;
  padding: 2px 6px 6px;

  /* Semi 主题变量覆盖为主题紫：主按钮/Tab 激活态/Select 等全部跟随 */
  --semi-color-primary: #6a5ae0;
  --semi-color-primary-hover: #7d6ff0;
  --semi-color-primary-active: #5a4bd0;
  --semi-color-primary-light-default: #f0effe;
  --semi-color-primary-light-hover: #e6e4fd;
  --semi-color-primary-light-active: #ddd9fb;
  --semi-color-focus-border: #6a5ae0;

  /* Semi Tabs */
  .semi-tabs-bar-line .semi-tabs-tab-active {
    color: #6a5ae0;
  }
  .semi-tabs-bar-line .semi-tabs-tab:hover {
    color: #6a5ae0;
  }
`;

const HeaderSection = styled.div`
  display: flex;
  gap: 14px;
  align-items: center;
  padding: 14px 16px;
  margin-bottom: 12px;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(106, 90, 224, 0.08) 0%, rgba(77, 124, 240, 0.08) 100%);
  border: 1px solid rgba(106, 90, 224, 0.15);
`;

const AvatarBox = styled.div`
  position: relative;
  width: 64px;
  height: 64px;
  box-sizing: border-box;
  border-radius: 50%;
  padding: 2px;
  background: ${GRADIENT};
  cursor: pointer;
  flex-shrink: 0;

  /* 头像图片：填满内圆，等比裁切 */
  .avatar-photo {
    display: block;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
    background: #fff;
  }

  /* 无头像时的首字占位圆 */
  .avatar-letter {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: ${GRADIENT};
    color: #fff;
    font-size: 22px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    user-select: none;
  }

  /* 上传中遮罩 */
  .avatar-loading {
    position: absolute;
    inset: 2px;
    border-radius: 50%;
    background: rgba(23, 20, 48, 0.45);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* 悬停出现“更换”遮罩 */
  .avatar-mask {
    position: absolute;
    inset: 2px;
    border-radius: 50%;
    background: rgba(23, 20, 48, 0.55);
    color: #fff;
    font-size: 11px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    opacity: 0;
    transition: opacity 0.2s ease;
  }
  &:hover .avatar-mask {
    opacity: 1;
  }
`;

const HeaderInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const NameRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
`;

const AccountLine = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  color: #7a7f99;
  font-size: 12px;
  min-width: 0;

  .account-value {
    color: #3c3f52;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 200px;
  }
`;

const HintBanner = styled.div`
  display: flex;
  gap: 8px;
  align-items: flex-start;
  background: rgba(250, 173, 20, 0.1);
  border: 1px solid rgba(250, 173, 20, 0.35);
  border-radius: 10px;
  padding: 8px 12px;
  margin-bottom: 12px;
  font-size: 12px;
  color: #ad6800;
  line-height: 1.6;
`;

const Panel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 8px;
`;

const FieldBox = styled.div`
  .field-label {
    display: block;
    font-size: 12px;
    color: #7a7f99;
    margin-bottom: 6px;
  }

  .semi-input-wrapper,
  .semi-select {
    border-radius: 10px;
    border: 1.5px solid #e3e5ef;
    background: #fbfbfe;
    transition: border-color 0.2s ease, background 0.2s ease;
  }
  .semi-input-wrapper:focus-within,
  .semi-select:focus-within,
  .semi-select-selection:hover {
    border-color: ${PRIMARY};
    background: #ffffff;
  }
  .semi-input {
    font-size: 13px;
  }
  .semi-select-focus {
    border-color: ${PRIMARY};
  }
`;

/* 按钮形状样式（配合原生 Semi Button 使用；不经过 styled 转发，避免 theme 属性被 styled-components 拦截） */
const primaryBtnStyle: React.CSSProperties = {
  height: 40,
  borderRadius: 10,
  fontSize: 14,
  fontWeight: 600,
  width: '100%',
};

const softBtnStyle: React.CSSProperties = {
  height: 32,
  borderRadius: 9,
  fontSize: 13,
};

const DangerLinkButton = styled(Button)`
  height: 26px;
  padding: 0 8px;
  border-radius: 8px;
  font-size: 12px;
  color: #e05454 !important;
  background: rgba(224, 84, 84, 0.07);
  border: none;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(224, 84, 84, 0.14);
    color: #d03030 !important;
  }
`;

const BindCard = styled.div`
  background: #fafbff;
  border: 1px solid #eceef6;
  border-radius: 12px;
  padding: 12px 14px;
`;

const BindTitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 8px;

  .accent {
    width: 3px;
    height: 14px;
    border-radius: 2px;
    background: ${GRADIENT};
  }
  .title {
    font-size: 13px;
    font-weight: 600;
    color: #3c3f52;
    margin-right: 4px;
  }
`;

const BindFormRow = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 4px;
  align-items: center;

  /* 输入框与按钮同高（32px） */
  .semi-input-wrapper {
    height: 32px;
    border-radius: 9px;
    border: 1.5px solid #e3e5ef;
    background: #ffffff;
  }
  .semi-input-wrapper:focus-within {
    border-color: ${PRIMARY};
  }
`;

const ProviderButton = styled.button<{ $color: string; $bound: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  flex: 1;
  height: 34px;
  border-radius: 9px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1.5px solid ${(props) => (props.$bound ? props.$color : '#e3e5ef')};
  background: ${(props) => (props.$bound ? 'rgba(106, 90, 224, 0.05)' : '#ffffff')};
  color: ${(props) => (props.$bound ? props.$color : '#4a4f68')};

  &:hover {
    border-color: ${(props) => props.$color};
    background: rgba(106, 90, 224, 0.06);
  }
`;

const SecurityTip = styled.div`
  font-size: 12px;
  color: #a0a4bb;
  text-align: center;
`;

// ---------------------------------------------------------------------------
// 组件
// ---------------------------------------------------------------------------

interface PersonalCenterProps {
  onProfileChanged?: () => void;
}

export const PersonalCenter: React.FC<PersonalCenterProps> = ({ onProfileChanged }) => {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfileResponseDTO | null>(null);

  // 资料表单
  const [profileForm, setProfileForm] = useState({ nickname: '', realName: '', gender: 0, birthday: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 绑定表单
  const [bindEmailTarget, setBindEmailTarget] = useState('');
  const [bindEmailCode, setBindEmailCode] = useState('');
  const [emailCountdown, setEmailCountdown] = useState(0);
  const [bindPhoneTarget, setBindPhoneTarget] = useState('');
  const [bindPhoneCode, setBindPhoneCode] = useState('');
  const [phoneCountdown, setPhoneCountdown] = useState(0);
  const [binding, setBinding] = useState(false);

  // 密码表单
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const result = await UserService.getUserProfile();
      if (result.success && result.data) {
        setProfile(result.data);
        setProfileForm({
          nickname: result.data.nickname || '',
          realName: result.data.realName || '',
          gender: result.data.gender ?? 0,
          birthday: result.data.birthday || '',
        });
      } else {
        Toast.error(result.message || '获取个人档案失败');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  // OAuth 绑定回调结果提示（后端绑定完成后重定向回首页）
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const bindResult = params.get('oauthBind');
    if (bindResult) {
      const msg = params.get('msg') || '';
      if (bindResult === 'success') {
        Toast.success('第三方账号绑定成功');
        void loadProfile();
      } else {
        Toast.error(`绑定失败${msg ? `：${msg}` : ''}`);
      }
      params.delete('oauthBind');
      params.delete('msg');
      const rest = params.toString();
      window.history.replaceState(null, '', window.location.pathname + (rest ? `?${rest}` : ''));
    }
  }, [loadProfile]);

  // 同步本地登录态（头像/昵称变更后全局可见）
  const syncLocalUserInfo = (next: Partial<{ nickname: string; avatar: string }>) => {
    try {
      const raw = localStorage.getItem('userInfo');
      const info = raw ? JSON.parse(raw) : {};
      localStorage.setItem('userInfo', JSON.stringify({ ...info, ...next }));
      onProfileChanged?.();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAvatarSelect = async (file: File | undefined) => {
    if (!file) {
      return;
    }
    setUploadingAvatar(true);
    try {
      const result = await UserService.uploadProfileAvatar(file);
      if (result.success && result.data) {
        Toast.success('头像已更新');
        syncLocalUserInfo({ avatar: result.data });
        await loadProfile();
      } else {
        Toast.error(result.message || '头像上传失败');
      }
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const result = await UserService.updateProfile(profileForm);
      if (result.success) {
        Toast.success('资料已保存');
        syncLocalUserInfo({ nickname: profileForm.nickname });
        await loadProfile();
      } else {
        Toast.error(result.message || '资料保存失败');
      }
    } finally {
      setSavingProfile(false);
    }
  };

  const sendBindCode = async (kind: 'email' | 'phone') => {
    const target = kind === 'email' ? bindEmailTarget : bindPhoneTarget;
    if (!target) {
      Toast.warning(kind === 'email' ? '请先输入邮箱地址' : '请先输入手机号');
      return;
    }
    const result = await UserService.sendLoginCode(target);
    if (result.success) {
      Toast.success('验证码已发送');
      if (kind === 'email') {
        setEmailCountdown(60);
      } else {
        setPhoneCountdown(60);
      }
    } else {
      Toast.error(result.message || '验证码发送失败');
    }
  };

  const handleBind = async (kind: 'email' | 'phone') => {
    const target = kind === 'email' ? bindEmailTarget : bindPhoneTarget;
    const code = kind === 'email' ? bindEmailCode : bindPhoneCode;
    if (!target || !code) {
      Toast.warning('请填写完整');
      return;
    }
    setBinding(true);
    try {
      const result = await UserService.bindContact(kind, target, code);
      if (result.success) {
        Toast.success(kind === 'email' ? '邮箱绑定成功' : '手机号绑定成功');
        if (kind === 'email') {
          setBindEmailTarget('');
          setBindEmailCode('');
        } else {
          setBindPhoneTarget('');
          setBindPhoneCode('');
        }
        await loadProfile();
      } else {
        Toast.error(result.message || '绑定失败');
      }
    } finally {
      setBinding(false);
    }
  };

  const handleUnbind = async (kind: 'email' | 'phone') => {
    const result = await UserService.unbindContact(kind);
    if (result.success) {
      Toast.success('已解绑');
      await loadProfile();
    } else {
      Toast.error(result.message || '解绑失败');
    }
  };

  const handleOAuthBind = async (provider: string) => {
    const result = await UserService.getOAuthBindUrl(provider);
    if (result.success && result.data) {
      window.location.href = result.data;
    } else {
      Toast.error(result.message || '获取绑定地址失败');
    }
  };

  const handleOAuthUnbind = async (provider: string) => {
    const result = await UserService.unbindOAuth(provider);
    if (result.success) {
      Toast.success('已解绑');
      await loadProfile();
    } else {
      Toast.error(result.message || '解绑失败');
    }
  };

  const handleSavePassword = async () => {
    if (newPassword.length < 6 || newPassword.length > 50) {
      Toast.warning('新密码长度为 6~50 位');
      return;
    }
    if (newPassword !== confirmPassword) {
      Toast.warning('两次输入的新密码不一致');
      return;
    }
    setSavingPassword(true);
    try {
      if (oldPassword) {
        // 修改密码（校验旧密码）
        const result = await UserService.updatePassword({ oldPassword, newPassword });
        if (result.code === '0000') {
          Toast.success('密码修改成功，请重新登录');
          setTimeout(() => void logoutAndRedirect(), 800);
        } else {
          Toast.error((result as { msg?: string }).msg || '密码修改失败');
        }
      } else {
        // 设置密码（无需旧密码，适用于第三方/验证码注册未设置密码的账号）
        const result = await UserService.setPassword(newPassword);
        if (result.success) {
          Toast.success('密码设置成功');
          setOldPassword('');
          setNewPassword('');
          setConfirmPassword('');
        } else {
          Toast.error(result.message || '密码设置失败');
        }
      }
    } finally {
      setSavingPassword(false);
    }
  };

  // 倒计时
  useEffect(() => {
    if (emailCountdown <= 0 && phoneCountdown <= 0) {
      return;
    }
    const timer = setInterval(() => {
      setEmailCountdown((v) => Math.max(0, v - 1));
      setPhoneCountdown((v) => Math.max(0, v - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [emailCountdown > 0 || phoneCountdown > 0]);

  const thirdParty = isThirdPartyRegistered(profile);
  const boundProviders = new Set((profile?.oauthBindings || []).map((b) => b.provider));

  return (
    <CenterContainer>
      {/* 头部：头像（悬停可更换）+ 账号信息 */}
      <HeaderSection>
        <AvatarBox onClick={() => fileInputRef.current?.click()}>
          {profile?.avatar ? (
            <img className="avatar-photo" src={profile.avatar} alt="头像" />
          ) : (
            <div className="avatar-letter">{(profile?.nickname || profile?.username || 'U')?.[0]?.toUpperCase()}</div>
          )}
          {uploadingAvatar ? (
            <div className="avatar-loading">
              <Spin size="small" />
            </div>
          ) : null}
          <div className="avatar-mask">
            <IconCamera size="small" />
            更换
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            style={{ display: 'none' }}
            onChange={(e) => void handleAvatarSelect(e.target.files?.[0])}
          />
        </AvatarBox>
        <HeaderInfo>
          <NameRow>
            <Text strong ellipsis={{ showTooltip: true }} style={{ maxWidth: 170, fontSize: 15 }}>
              {profile?.nickname || profile?.username || '用户'}
            </Text>
            {(profile?.roles || []).map((code) => (
              <Tag key={code} size="small" color={code.toUpperCase().endsWith('ADMIN') ? 'red' : 'violet'}>
                {code}
              </Tag>
            ))}
          </NameRow>
          {/* 无论何种方式注册，始终展示登录账号 */}
          <AccountLine>
            <span>账号</span>
            <span className="account-value">{profile?.account || '-'}</span>
          </AccountLine>
        </HeaderInfo>
      </HeaderSection>

      {thirdParty ? (
        <HintBanner>
          <IconTickCircle size="small" style={{ flexShrink: 0, marginTop: 2 }} />
          <span>第三方登录的账号未设置初始密码（由系统随机生成，无法查看），如需密码登录请在「安全设置」中设置密码</span>
        </HintBanner>
      ) : null}

      <Tabs type="line" size="small">
        {/* ==================== 资料 ==================== */}
        <Tabs.TabPane tab="个人资料" itemKey="profile">
          {loading ? (
            <div style={{ padding: 24, textAlign: 'center' }}>
              <Spin />
            </div>
          ) : (
            <Panel>
              <FieldBox>
                <span className="field-label">昵称</span>
                <Input value={profileForm.nickname} onChange={(v) => setProfileForm((f) => ({ ...f, nickname: v }))} maxLength={50} />
              </FieldBox>
              <FieldBox>
                <span className="field-label">真实姓名</span>
                <Input value={profileForm.realName} onChange={(v) => setProfileForm((f) => ({ ...f, realName: v }))} maxLength={50} />
              </FieldBox>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <FieldBox>
                  <span className="field-label">性别</span>
                  <Select
                    value={String(profileForm.gender)}
                    onChange={(v) => setProfileForm((f) => ({ ...f, gender: Number(v) }))}
                    optionList={[
                      { value: '0', label: '未知' },
                      { value: '1', label: '男' },
                      { value: '2', label: '女' },
                    ]}
                    style={{ width: '100%' }}
                  />
                </FieldBox>
                <FieldBox>
                  <span className="field-label">生日</span>
                  <Input
                    value={profileForm.birthday}
                    onChange={(v) => setProfileForm((f) => ({ ...f, birthday: v }))}
                    placeholder="yyyy-MM-dd"
                  />
                </FieldBox>
              </div>
              <Button type="primary" theme="solid" style={primaryBtnStyle} loading={savingProfile} onClick={() => void handleSaveProfile()}>
                保存资料
              </Button>
            </Panel>
          )}
        </Tabs.TabPane>

        {/* ==================== 账号绑定 ==================== */}
        <Tabs.TabPane tab="账号绑定" itemKey="binding">
          {loading ? (
            <div style={{ padding: 24, textAlign: 'center' }}>
              <Spin />
            </div>
          ) : (
            <Panel>
              {/* 邮箱 */}
              <BindCard>
                <BindTitleRow>
                  <span className="accent" />
                  <span className="title">邮箱</span>
                  {profile?.email ? (
                    <>
                      <Tag size="small" color="green">{profile.email}</Tag>
                      {profile.emailVerified ? null : <Tag size="small" color="orange">未验证</Tag>}
                      <Popconfirm title="确定解绑邮箱？" onConfirm={() => void handleUnbind('email')}>
                        <DangerLinkButton size="small" theme="borderless">解绑</DangerLinkButton>
                      </Popconfirm>
                    </>
                  ) : (
                    <Tag size="small" color="grey">未绑定</Tag>
                  )}
                </BindTitleRow>
                {!profile?.email ? (
                  <BindFormRow>
                    <Input placeholder="新邮箱地址" value={bindEmailTarget} onChange={setBindEmailTarget} style={{ flex: 1 }} />
                    <Button type="primary" theme="light" style={softBtnStyle} disabled={emailCountdown > 0} onClick={() => void sendBindCode('email')}>
                      {emailCountdown > 0 ? `${emailCountdown}s` : '发验证码'}
                    </Button>
                    <Input placeholder="验证码" value={bindEmailCode} onChange={setBindEmailCode} style={{ width: 104 }} />
                    <Button type="primary" theme="light" style={softBtnStyle} loading={binding} onClick={() => void handleBind('email')}>绑定</Button>
                  </BindFormRow>
                ) : null}
              </BindCard>

              {/* 手机号 */}
              <BindCard>
                <BindTitleRow>
                  <span className="accent" />
                  <span className="title">手机号</span>
                  {profile?.phone ? (
                    <>
                      <Tag size="small" color="green">{profile.phone}</Tag>
                      {profile.phoneVerified ? null : <Tag size="small" color="orange">未验证</Tag>}
                      <Popconfirm title="确定解绑手机号？" onConfirm={() => void handleUnbind('phone')}>
                        <DangerLinkButton size="small" theme="borderless">解绑</DangerLinkButton>
                      </Popconfirm>
                    </>
                  ) : (
                    <Tag size="small" color="grey">未绑定</Tag>
                  )}
                </BindTitleRow>
                {!profile?.phone ? (
                  <BindFormRow>
                    <Input placeholder="新手机号" value={bindPhoneTarget} onChange={setBindPhoneTarget} style={{ flex: 1 }} />
                    <Button type="primary" theme="light" style={softBtnStyle} disabled={phoneCountdown > 0} onClick={() => void sendBindCode('phone')}>
                      {phoneCountdown > 0 ? `${phoneCountdown}s` : '发验证码'}
                    </Button>
                    <Input placeholder="验证码" value={bindPhoneCode} onChange={setBindPhoneCode} style={{ width: 104 }} />
                    <Button type="primary" theme="light" style={softBtnStyle} loading={binding} onClick={() => void handleBind('phone')}>绑定</Button>
                  </BindFormRow>
                ) : null}
              </BindCard>

              {/* 第三方账号 */}
              <BindCard>
                <BindTitleRow>
                  <span className="accent" />
                  <span className="title">第三方账号</span>
                </BindTitleRow>
                <div style={{ display: 'flex', gap: 10 }}>
                  {OAUTH_PROVIDERS.map(({ provider, label, color }) =>
                    boundProviders.has(provider) ? (
                      <Popconfirm key={provider} title={`确定解绑 ${label} 账号？`} onConfirm={() => void handleOAuthUnbind(provider)}>
                        <ProviderButton type="button" $color={color} $bound>
                          {label} · 已绑定，点击解绑
                        </ProviderButton>
                      </Popconfirm>
                    ) : (
                      <ProviderButton key={provider} type="button" $color={color} $bound={false} onClick={() => void handleOAuthBind(provider)}>
                        绑定 {label}
                      </ProviderButton>
                    )
                  )}
                </div>
              </BindCard>
            </Panel>
          )}
        </Tabs.TabPane>

        {/* ==================== 安全设置 ==================== */}
        <Tabs.TabPane tab="安全设置" itemKey="security">
          <Panel>
            <FieldBox>
              <span className="field-label">旧密码（未设置过密码或忘记密码可留空，留空则为直接设置）</span>
              <Input mode="password" value={oldPassword} onChange={setOldPassword} placeholder="留空表示未设置/忘记密码" />
            </FieldBox>
            <FieldBox>
              <span className="field-label">新密码（6~50 位）</span>
              <Input mode="password" value={newPassword} onChange={setNewPassword} />
            </FieldBox>
            <FieldBox>
              <span className="field-label">确认新密码</span>
              <Input mode="password" value={confirmPassword} onChange={setConfirmPassword} />
            </FieldBox>
            <Button type="primary" theme="solid" style={primaryBtnStyle} loading={savingPassword} onClick={() => void handleSavePassword()}>
              {oldPassword ? '修改密码' : '设置密码'}
            </Button>
            {oldPassword ? <SecurityTip>修改密码成功后需要重新登录</SecurityTip> : null}
          </Panel>
        </Tabs.TabPane>
      </Tabs>
    </CenterContainer>
  );
};

export default PersonalCenter;
