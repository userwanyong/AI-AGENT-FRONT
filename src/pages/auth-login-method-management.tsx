import React, { useCallback, useEffect, useState } from 'react';

import { Button, Modal, Popconfirm, Switch, Tabs, Tag, TextArea, Toast, Typography } from '@douyinfe/semi-ui';

import { AuthAdminService } from '../services/auth-admin-service';
import type { AuthAdminLoginMethodDTO } from '../services/auth-admin-service';
import { AuthAdminPage } from '../components/layout/auth-admin-page';

const { Text } = Typography;

/**
 * 认证服务 · 登录方式配置（RPC 直通 auth-service，与认证服务管理端功能一致）
 *
 * 平台级：全部 6 种方式的开关与默认凭证（password 不可关闭）
 * 租户级：本租户开关 + 凭证来源（平台凭证/自有凭证）+ 自有凭证 JSON
 */
export const AuthLoginMethodManagement: React.FC = () => {
  const [level, setLevel] = useState<'platform' | 'tenant'>('tenant');
  const [loading, setLoading] = useState(false);
  const [methods, setMethods] = useState<AuthAdminLoginMethodDTO[]>([]);

  // 凭证编辑弹窗
  const [editing, setEditing] = useState<AuthAdminLoginMethodDTO | null>(null);
  const [configJson, setConfigJson] = useState('');
  const [usePlatformConfig, setUsePlatformConfig] = useState(1);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await AuthAdminService.listLoginMethods(level);
      if (result.success && result.data) {
        setMethods(result.data);
      } else {
        Toast.error(result.message || '获取登录方式配置失败');
      }
    } finally {
      setLoading(false);
    }
  }, [level]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleToggle = async (method: AuthAdminLoginMethodDTO, enabled: boolean) => {
    const result = await AuthAdminService.saveLoginMethod(level, {
      method: method.method,
      enabled: enabled ? 1 : 0,
      ...(level === 'tenant' ? { usePlatformConfig: method.usePlatformConfig } : {}),
    });
    if (result.success) {
      Toast.success(enabled ? '已开启' : '已关闭');
      void load();
    } else {
      Toast.error(result.message || '保存失败');
    }
  };

  const openConfig = (method: AuthAdminLoginMethodDTO) => {
    setEditing(method);
    setConfigJson('');
    setUsePlatformConfig(method.usePlatformConfig ?? 1);
  };

  const handleSaveConfig = async () => {
    if (!editing) {
      return;
    }
    if (configJson.trim()) {
      try {
        JSON.parse(configJson);
      } catch {
        Toast.error('凭证 JSON 格式不正确');
        return;
      }
    }
    setSaving(true);
    try {
      const result = await AuthAdminService.saveLoginMethod(level, {
        method: editing.method,
        enabled: editing.enabled,
        ...(level === 'tenant' ? { usePlatformConfig } : {}),
        ...(configJson.trim() ? { configJson: configJson.trim() } : {}),
      });
      if (result.success) {
        Toast.success('凭证配置已保存');
        setEditing(null);
        void load();
      } else {
        Toast.error(result.message || '保存失败');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSource = async (method: AuthAdminLoginMethodDTO, usePlatform: number) => {
    const result = await AuthAdminService.saveLoginMethod(level, {
      method: method.method,
      enabled: method.enabled,
      usePlatformConfig: usePlatform,
    });
    if (result.success) {
      Toast.success(usePlatform === 1 ? '已切换为平台凭证' : '已切换为自有凭证');
      void load();
    } else {
      Toast.error(result.message || '保存失败');
    }
  };

  // 各方式的凭证 JSON 模板（与 auth-service 集成指南一致）
  const configTemplate = (method: string): string => {
    if (method.startsWith('email:aliyun')) {
      return JSON.stringify(
        { accessKeyId: '', accessKeySecret: '', accountName: '', fromAlias: 'Auth Service', region: 'cn-hangzhou', codeTtlMinutes: '5', subject: '登录验证码', template: '<p>验证码 {code}，{minutes} 分钟内有效</p>' },
        null,
        2
      );
    }
    if (method.startsWith('email:smtp')) {
      return JSON.stringify({ host: 'smtp.qq.com', port: '465', username: '', password: '', encryption: 'ssl', codeTtlMinutes: '5' }, null, 2);
    }
    if (method.startsWith('sms:aliyun')) {
      return JSON.stringify({ accessKeyId: '', accessKeySecret: '', signName: '', templateCode: '' }, null, 2);
    }
    if (method.startsWith('oauth:')) {
      const provider = method.slice('oauth:'.length);
      return JSON.stringify({ clientId: '', clientSecret: '', redirectUri: `http://localhost:8071/api/v1/user/oauth/${provider}/callback` }, null, 2);
    }
    return '';
  };

  const MethodCard: React.FC<{ method: AuthAdminLoginMethodDTO }> = ({ method: m }) => {
    const locked = level === 'platform' && m.platformLocked;
    return (
      <div
        style={{
          border: '1px solid #e3e5ef',
          borderRadius: 10,
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          marginBottom: 10,
          background: '#fff',
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Text strong>{m.displayName}</Text>
            <Tag size="small" color="grey">
              {m.method}
            </Tag>
            {locked ? <Tag size="small" color="orange">平台锁定</Tag> : null}
            {level === 'tenant' && !m.platformEnabled ? <Tag size="small" color="red">平台已关闭</Tag> : null}
            {m.hasConfig ? <Tag size="small" color="green">已配置凭证</Tag> : <Tag size="small" color="red">未配置凭证</Tag>}
          </div>
          {level === 'tenant' && m.category !== 'password' ? (
            <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Text type="tertiary" size="small">凭证来源：</Text>
              <Text size="small" strong={m.usePlatformConfig === 0}>
                {m.usePlatformConfig === 1 ? '平台凭证' : '自有凭证'}
              </Text>
              <Button size="small" theme="borderless" onClick={() => void handleSaveSource(m, m.usePlatformConfig === 1 ? 0 : 1)}>
                切换为{m.usePlatformConfig === 1 ? '自有凭证' : '平台凭证'}
              </Button>
            </div>
          ) : null}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {m.category !== 'password' || !locked ? (
            <Button size="small" onClick={() => openConfig(m)}>
              {m.category === 'password' ? '查看' : '配置凭证'}
            </Button>
          ) : null}
          <Switch
            checked={m.enabled === 1}
            disabled={locked || (level === 'tenant' && !m.platformEnabled)}
            onChange={(checked) => void handleToggle(m, checked)}
          />
        </div>
      </div>
    );
  };

  return (
    <AuthAdminPage selectedKey="auth-login-method-management" title="登录方式配置">
      <Text type="tertiary" style={{ display: 'block', marginBottom: 12 }}>
        与认证服务管理端数据实时同步：平台级控制全局开关与默认凭证；租户级控制本应用开关与凭证来源。修改后登录页自动生效。
      </Text>

      <Tabs
        activeKey={level}
        onChange={(key) => setLevel(key as 'platform' | 'tenant')}
        type="line"
      >
        <Tabs.TabPane tab="租户级配置" itemKey="tenant" />
        <Tabs.TabPane tab="平台级配置" itemKey="platform" />
      </Tabs>

      <div style={{ marginTop: 12 }}>
        {loading ? (
          <Text type="tertiary">加载中…</Text>
        ) : methods.length === 0 ? (
          <Text type="tertiary">暂无可配置的登录方式</Text>
        ) : (
          methods.map((m) => <MethodCard key={m.method} method={m} />)
        )}
      </div>

      {/* 凭证配置弹窗 */}
      <Modal
        title={`凭证配置：${editing?.displayName ?? ''}`}
        visible={!!editing}
        onOk={() => void handleSaveConfig()}
        onCancel={() => setEditing(null)}
        confirmLoading={saving}
        width={620}
      >
        {level === 'tenant' && editing && editing.category !== 'password' ? (
          <div style={{ marginBottom: 12 }}>
            <Text type="tertiary" size="small">
              当前凭证来源：{usePlatformConfig === 1 ? '平台凭证（JSON 仅在切换为自有凭证后生效）' : '自有凭证'}
            </Text>
          </div>
        ) : null}
        <Text type="tertiary" size="small" style={{ display: 'block', marginBottom: 6 }}>
          按非空键合并到已有配置（只填要改的键，空值不覆盖）：
        </Text>
        <TextArea
          rows={12}
          value={configJson}
          onChange={setConfigJson}
          placeholder={editing ? configTemplate(editing.method) : ''}
          style={{ fontFamily: 'monospace' }}
        />
        <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
          <Popconfirm
            title="用模板填充编辑框？已填写内容将被覆盖"
            onConfirm={() => {
              if (editing) {
                setConfigJson(configTemplate(editing.method));
              }
            }}
          >
            <Button size="small">填入模板</Button>
          </Popconfirm>
        </div>
      </Modal>
    </AuthAdminPage>
  );
};
