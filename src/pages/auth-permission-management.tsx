import React, { useCallback, useEffect, useState } from 'react';

import { Button, Input, Modal, Popconfirm, Table, Tag, Toast, Typography } from '@douyinfe/semi-ui';
import { IconPlus } from '@douyinfe/semi-icons';

import { AuthAdminService } from '../services/auth-admin-service';
import type { AuthAdminPermissionDTO } from '../services/auth-admin-service';
import { AuthAdminPage } from '../components/layout/auth-admin-page';

const { Text } = Typography;

/**
 * 认证服务 · 权限管理（RPC 直通 auth-service）
 */
export const AuthPermissionManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [permissions, setPermissions] = useState<AuthAdminPermissionDTO[]>([]);
  const [keyword, setKeyword] = useState('');

  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ code: '', name: '', resource: '', action: '', description: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await AuthAdminService.listPermissions();
      if (result.success && result.data) {
        setPermissions(result.data);
      } else {
        Toast.error(result.message || '获取权限列表失败');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = async () => {
    if (!form.code.trim() || !form.name.trim()) {
      Toast.warning('权限编码与名称不能为空');
      return;
    }
    setSaving(true);
    try {
      const result = await AuthAdminService.createPermission({
        code: form.code.trim(),
        name: form.name.trim(),
        resource: form.resource.trim(),
        action: form.action.trim(),
        description: form.description,
      });
      if (result.success) {
        Toast.success('权限创建成功');
        setModalVisible(false);
        setForm({ code: '', name: '', resource: '', action: '', description: '' });
        void load();
      } else {
        Toast.error(result.message || '创建失败');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (perm: AuthAdminPermissionDTO) => {
    const result = await AuthAdminService.deletePermission(perm.id);
    if (result.success) {
      Toast.success('权限已删除');
      void load();
    } else {
      Toast.error(result.message || '删除失败');
    }
  };

  const filtered = permissions.filter(
    (p) =>
      !keyword ||
      p.code.includes(keyword) ||
      p.name.includes(keyword) ||
      (p.resource || '').includes(keyword) ||
      (p.action || '').includes(keyword)
  );

  const columns = [
    { title: '权限 ID', dataIndex: 'id', width: 180 },
    {
      title: '编码',
      dataIndex: 'code',
      width: 200,
      render: (code: string) => <Tag color="cyan">{code}</Tag>,
    },
    { title: '名称', dataIndex: 'name', width: 160 },
    { title: '资源', dataIndex: 'resource', width: 120, render: (v: string) => v || '-' },
    { title: '动作', dataIndex: 'action', width: 120, render: (v: string) => v || '-' },
    { title: '描述', dataIndex: 'description', width: 220, render: (v: string) => v || '-' },
    {
      title: '操作',
      dataIndex: 'op',
      width: 100,
      render: (_: unknown, record: AuthAdminPermissionDTO) => (
        <Popconfirm title="确定删除该权限？已分配角色的关联将一并移除" onConfirm={() => void handleDelete(record)}>
          <Button size="small" type="danger">
            删除
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <AuthAdminPage
      selectedKey="auth-permission-management"
      title="权限管理"
      extra={
        <Button type="primary" icon={<IconPlus />} onClick={() => setModalVisible(true)}>
          新建权限
        </Button>
      }
    >
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <Input
          placeholder="搜索权限编码/名称/资源"
          value={keyword}
          onChange={setKeyword}
          style={{ width: 260 }}
          showClear
        />
      </div>

      <Table columns={columns} dataSource={filtered} loading={loading} rowKey="id" size="middle" scroll={{ x: 1100 }} pagination={false} />

      <Modal
        title="新建权限"
        visible={modalVisible}
        onOk={() => void handleCreate()}
        onCancel={() => setModalVisible(false)}
        confirmLoading={saving}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <Text type="tertiary" size="small">编码（唯一，如 article:read）</Text>
            <Input value={form.code} onChange={(v) => setForm((f) => ({ ...f, code: v }))} placeholder="article:read" />
          </div>
          <div>
            <Text type="tertiary" size="small">名称</Text>
            <Input value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} placeholder="查看文章" />
          </div>
          <div>
            <Text type="tertiary" size="small">资源</Text>
            <Input value={form.resource} onChange={(v) => setForm((f) => ({ ...f, resource: v }))} placeholder="article" />
          </div>
          <div>
            <Text type="tertiary" size="small">动作</Text>
            <Input value={form.action} onChange={(v) => setForm((f) => ({ ...f, action: v }))} placeholder="read" />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <Text type="tertiary" size="small">描述</Text>
            <Input value={form.description} onChange={(v) => setForm((f) => ({ ...f, description: v }))} />
          </div>
        </div>
      </Modal>
    </AuthAdminPage>
  );
};
