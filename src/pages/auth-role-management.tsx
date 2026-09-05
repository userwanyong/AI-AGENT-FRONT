import React, { useCallback, useEffect, useState } from 'react';

import { Button, Input, Modal, Popconfirm, Select, Table, Tag, Toast, Typography } from '@douyinfe/semi-ui';
import { IconPlus } from '@douyinfe/semi-icons';

import { AuthAdminService } from '../services/auth-admin-service';
import type { AuthAdminPermissionDTO, AuthAdminRoleDTO } from '../services/auth-admin-service';
import { AuthAdminPage } from '../components/layout/auth-admin-page';

const { Text } = Typography;

/**
 * 认证服务 · 角色管理（RPC 直通 auth-service）
 */
export const AuthRoleManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<AuthAdminRoleDTO[]>([]);
  const [permissions, setPermissions] = useState<AuthAdminPermissionDTO[]>([]);

  // 新建/编辑（modalVisible 控制弹窗；editingRole 为 null 表示新建）
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRole, setEditingRole] = useState<AuthAdminRoleDTO | null>(null);
  const [form, setForm] = useState({ code: '', name: '', description: '' });
  const [saving, setSaving] = useState(false);

  // 分配权限
  const [assigning, setAssigning] = useState<AuthAdminRoleDTO | null>(null);
  const [assignPermCodes, setAssignPermCodes] = useState<string[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [roleResult, permResult] = await Promise.all([
        AuthAdminService.listRoles(),
        AuthAdminService.listPermissions(),
      ]);
      if (roleResult.success && roleResult.data) {
        setRoles(roleResult.data);
      } else {
        Toast.error(roleResult.message || '获取角色列表失败');
      }
      if (permResult.success && permResult.data) {
        setPermissions(permResult.data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditingRole(null);
    setForm({ code: '', name: '', description: '' });
    setModalVisible(true);
  };

  const openEdit = (role: AuthAdminRoleDTO) => {
    setEditingRole(role);
    setForm({ code: role.code, name: role.name, description: role.description });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      Toast.warning('角色名称不能为空');
      return;
    }
    if (!editingRole && !form.code.trim()) {
      Toast.warning('角色编码不能为空');
      return;
    }
    setSaving(true);
    try {
      const result = editingRole
        ? await AuthAdminService.updateRole({ id: editingRole.id, name: form.name, description: form.description })
        : await AuthAdminService.createRole({ code: form.code.trim(), name: form.name.trim(), description: form.description });
      if (result.success) {
        Toast.success(editingRole ? '角色更新成功' : '角色创建成功');
        setModalVisible(false);
        void load();
      } else {
        Toast.error(result.message || '保存失败');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (role: AuthAdminRoleDTO) => {
    const result = await AuthAdminService.deleteRole(role.id);
    if (result.success) {
      Toast.success('角色已删除');
      void load();
    } else {
      Toast.error(result.message || '删除失败');
    }
  };

  const openAssignPermissions = (role: AuthAdminRoleDTO) => {
    setAssigning(role);
    setAssignPermCodes(role.permissions || []);
  };

  const handleSavePermissions = async () => {
    if (!assigning) {
      return;
    }
    const ids = assignPermCodes
      .map((code) => String(permissions.find((p) => p.code === code)?.id ?? ''))
      .filter((id) => id !== '');
    const result = await AuthAdminService.assignRolePermissions(assigning.id, ids);
    if (result.success) {
      Toast.success('权限分配成功');
      setAssigning(null);
      void load();
    } else {
      Toast.error(result.message || '权限分配失败');
    }
  };

  const columns = [
    { title: '角色 ID', dataIndex: 'id', width: 180 },
    { title: '编码', dataIndex: 'code', width: 160 },
    { title: '名称', dataIndex: 'name', width: 160 },
    { title: '描述', dataIndex: 'description', width: 220, render: (v: string) => v || '-' },
    {
      title: '权限',
      dataIndex: 'permissions',
      width: 320,
      render: (perms: string[]) =>
        (perms || []).length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {perms.slice(0, 6).map((code) => (
              <Tag key={code} size="small" color="cyan">
                {code}
              </Tag>
            ))}
            {perms.length > 6 ? <Tag size="small">+{perms.length - 6}</Tag> : null}
          </div>
        ) : (
          <Text type="tertiary">无</Text>
        ),
    },
    {
      title: '操作',
      dataIndex: 'op',
      width: 240,
      render: (_: unknown, record: AuthAdminRoleDTO) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <Button size="small" onClick={() => openEdit(record)}>
            编辑
          </Button>
          <Button size="small" onClick={() => openAssignPermissions(record)}>
            分配权限
          </Button>
          <Popconfirm title="确定删除该角色？" onConfirm={() => void handleDelete(record)}>
            <Button size="small" type="danger">
              删除
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <AuthAdminPage
      selectedKey="auth-role-management"
      title="角色管理"
      extra={
        <Button type="primary" icon={<IconPlus />} onClick={openCreate}>
          新建角色
        </Button>
      }
    >
      <Table columns={columns} dataSource={roles} loading={loading} rowKey="id" size="middle" scroll={{ x: 1200 }} pagination={false} />

      {/* 新建/编辑角色 */}
      <Modal
        title={editingRole ? `编辑角色：${editingRole.code}` : '新建角色'}
        visible={modalVisible}
        onOk={() => void handleSave()}
        onCancel={() => setModalVisible(false)}
        confirmLoading={saving}
      >
        {!editingRole ? (
          <div style={{ marginBottom: 12 }}>
            <Text type="tertiary" size="small">角色编码（唯一，如 ROLE_EDITOR）</Text>
            <Input value={form.code} onChange={(v) => setForm((f) => ({ ...f, code: v }))} placeholder="ROLE_EDITOR" />
          </div>
        ) : null}
        <div style={{ marginBottom: 12 }}>
          <Text type="tertiary" size="small">角色名称</Text>
          <Input value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} placeholder="内容编辑" />
        </div>
        <div>
          <Text type="tertiary" size="small">描述</Text>
          <Input value={form.description} onChange={(v) => setForm((f) => ({ ...f, description: v }))} />
        </div>
      </Modal>

      {/* 分配权限 */}
      <Modal
        title={`分配权限：${assigning?.name ?? ''}`}
        visible={!!assigning}
        onOk={() => void handleSavePermissions()}
        onCancel={() => setAssigning(null)}
        width={520}
      >
        <Text type="tertiary" size="small" style={{ display: 'block', marginBottom: 8 }}>
          全量覆盖：保存后角色权限即为所选集合
        </Text>
        <Select
          multiple
          style={{ width: '100%' }}
          value={assignPermCodes}
          onChange={(value) => setAssignPermCodes((value as string[]) ?? [])}
          optionList={permissions.map((p) => ({ value: p.code, label: `${p.name}（${p.code}）` }))}
          placeholder="选择权限"
        />
      </Modal>
    </AuthAdminPage>
  );
};
