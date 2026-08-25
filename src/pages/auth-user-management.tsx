import React, { useCallback, useEffect, useState } from 'react';

import { Avatar, Button, Input, Modal, Popconfirm, Select, Switch, Table, Tag, Toast, Typography } from '@douyinfe/semi-ui';
import { IconSearch } from '@douyinfe/semi-icons';

import { AuthAdminService } from '../services/auth-admin-service';
import type { AuthAdminUserDTO } from '../services/auth-admin-service';
import { AuthAdminPage } from '../components/layout/auth-admin-page';
import { logoutAndRedirect } from '../utils/logout';

const { Text } = Typography;

/**
 * 认证服务 · 用户管理（RPC 直通 auth-service，数据实时同步）
 */
export const AuthUserManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<AuthAdminUserDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [pageNum, setPageNum] = useState(1);
  const [pageSize] = useState(10);
  const [keyword, setKeyword] = useState('');

  // 角色列表（分配角色用）
  const [roles, setRoles] = useState<{ value: string; label: string; roleCode: string }[]>([]);

  // 编辑弹窗
  const [editing, setEditing] = useState<AuthAdminUserDTO | null>(null);
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // 分配角色弹窗
  const [assigning, setAssigning] = useState<AuthAdminUserDTO | null>(null);
  const [assignRoleCodes, setAssignRoleCodes] = useState<string[]>([]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await AuthAdminService.searchUsers({ keyword, pageNum, pageSize });
      if (result.success && result.data) {
        setUsers(result.data.items || []);
        setTotal(Number(result.data.total) || 0);
      } else {
        Toast.error(result.message || '获取用户列表失败');
      }
    } finally {
      setLoading(false);
    }
  }, [keyword, pageNum, pageSize]);

  const loadRoles = useCallback(async () => {
    const result = await AuthAdminService.listRoles();
    if (result.success && result.data) {
      setRoles(
        result.data.map((role) => ({
          value: role.code,
          label: `${role.name}（${role.code}）`,
          roleCode: role.code,
        }))
      );
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    void loadRoles();
  }, [loadRoles]);

  const handleSearch = () => {
    setPageNum(1);
    void loadUsers();
  };

  // 编辑用户（字段掩码：仅提交用户修改过的字段）
  const openEdit = (user: AuthAdminUserDTO) => {
    setEditing(user);
    setEditForm({
      username: user.username,
      nickname: user.nickname,
      email: user.email,
      phone: user.phone,
      realName: user.realName,
      gender: user.gender === 1 ? '男' : user.gender === 2 ? '女' : '',
      birthday: user.birthday,
    });
  };

  const handleSaveEdit = async () => {
    if (!editing) {
      return;
    }
    const fields: string[] = [];
    const payload: Record<string, unknown> = { userId: editing.id, fieldsToUpdate: fields };

    if (editForm.username !== editing.username) {
      payload.username = editForm.username;
      fields.push('username');
    }
    if (editForm.nickname !== editing.nickname) {
      payload.nickname = editForm.nickname;
      fields.push('nickname');
    }
    if (editForm.email !== editing.email) {
      payload.email = editForm.email;
      fields.push('email');
    }
    if (editForm.phone !== editing.phone) {
      payload.phone = editForm.phone;
      fields.push('phone');
    }
    if (editForm.realName !== editing.realName) {
      payload.realName = editForm.realName;
      fields.push('realName');
    }
    const genderValue = editForm.gender === '男' ? 1 : editForm.gender === '女' ? 2 : 0;
    if (genderValue !== editing.gender) {
      payload.gender = genderValue;
      fields.push('gender');
    }
    if (editForm.birthday !== editing.birthday) {
      payload.birthday = editForm.birthday;
      fields.push('birthday');
    }
    // 重置密码（填写了才提交）
    if (editForm.newPassword) {
      payload.password = editForm.newPassword;
      fields.push('password');
    }

    if (fields.length === 0) {
      Toast.info('没有修改任何字段');
      setEditing(null);
      return;
    }

    setSaving(true);
    try {
      const result = await AuthAdminService.updateUser(payload as Parameters<typeof AuthAdminService.updateUser>[0]);
      if (result.success) {
        Toast.success('用户更新成功');
        setEditing(null);
        void loadUsers();
      } else {
        Toast.error(result.message || '用户更新失败');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (user: AuthAdminUserDTO) => {
    const next = user.status === 1 ? 0 : 1;
    const result = await AuthAdminService.updateUserStatus(user.id, next);
    if (result.success) {
      Toast.success(next === 1 ? '已启用' : '已禁用');
      void loadUsers();
    } else {
      Toast.error(result.message || '状态更新失败');
    }
  };

  const openAssignRoles = (user: AuthAdminUserDTO) => {
    setAssigning(user);
    setAssignRoleCodes(user.roles || []);
  };

  const handleSaveRoles = async () => {
    if (!assigning) {
      return;
    }
    // 角色编码 → 角色 ID（全量覆盖）
    const roleResult = await AuthAdminService.listRoles();
    if (!roleResult.success || !roleResult.data) {
      Toast.error('获取角色列表失败');
      return;
    }
    const ids = assignRoleCodes
      .map((code) => String(roleResult.data!.find((r) => r.code === code)?.id ?? ''))
      .filter((id) => id !== '');
    const result = await AuthAdminService.assignUserRoles(assigning.id, ids);
    if (result.success) {
      Toast.success('角色分配成功');
      setAssigning(null);
      void loadUsers();
    } else {
      Toast.error(result.message || '角色分配失败');
    }
  };

  const handleDelete = async (user: AuthAdminUserDTO) => {
    const result = await AuthAdminService.deleteUser(user.id);
    if (result.success) {
      Toast.success('用户已删除');
      void loadUsers();
    } else {
      Toast.error(result.message || '删除失败');
    }
  };

  const formatTime = (epoch?: number) => {
    if (!epoch) {
      return '-';
    }
    return new Date(epoch).toLocaleString('zh-CN', { hour12: false });
  };

  const columns = [
    {
      title: '用户',
      dataIndex: 'username',
      width: 200,
      render: (_: unknown, record: AuthAdminUserDTO) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar size="small" src={record.avatar || undefined}>
            {(record.nickname || record.username || '?').slice(0, 1).toUpperCase()}
          </Avatar>
          <div>
            <div>{record.username}</div>
            {record.nickname && record.nickname !== record.username ? (
              <Text type="tertiary" size="small">
                {record.nickname}
              </Text>
            ) : null}
          </div>
        </div>
      ),
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      width: 200,
      render: (email: string, record: AuthAdminUserDTO) =>
        email ? (
          <span>
            {email}
            {record.emailVerified ? <Tag size="small" color="green" style={{ marginLeft: 4 }}>已验证</Tag> : null}
          </span>
        ) : (
          '-'
        ),
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      width: 130,
      render: (phone: string) => phone || '-',
    },
    {
      title: '角色',
      dataIndex: 'roles',
      width: 150,
      render: (rolesList: string[]) =>
        (rolesList || []).length > 0
          ? rolesList.map((code) => (
              <Tag key={code} size="small" color={code.toUpperCase().endsWith('ADMIN') ? 'red' : 'blue'}>
                {code}
              </Tag>
            ))
          : <Text type="tertiary">无</Text>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (status: number, record: AuthAdminUserDTO) => (
        <Switch checked={status === 1} onChange={() => void handleToggleStatus(record)} size="small" />
      ),
    },
    {
      title: '最近登录',
      dataIndex: 'lastLoginAt',
      width: 170,
      render: (value: number) => formatTime(value),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 170,
      render: (value: number) => formatTime(value),
    },
    {
      title: '操作',
      dataIndex: 'op',
      width: 220,
      render: (_: unknown, record: AuthAdminUserDTO) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <Button size="small" onClick={() => openEdit(record)}>
            编辑
          </Button>
          <Button size="small" onClick={() => openAssignRoles(record)}>
            分配角色
          </Button>
          <Popconfirm title="确定删除该用户？删除后不可恢复" onConfirm={() => void handleDelete(record)}>
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
      selectedKey="auth-user-management"
      title="用户管理"
      extra={
        <Button size="small" onClick={() => void logoutAndRedirect()}>
          退出登录
        </Button>
      }
    >
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <Input
          placeholder="搜索用户名/昵称/邮箱"
          value={keyword}
          onChange={setKeyword}
          style={{ width: 260 }}
          onEnterPress={handleSearch}
          prefix={<IconSearch />}
          showClear
        />
        <Button type="primary" onClick={handleSearch} loading={loading}>
          搜索
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={users}
        loading={loading}
        rowKey="id"
        size="middle"
        scroll={{ x: 1300 }}
        pagination={{
          currentPage: pageNum,
          pageSize,
          total,
          onPageChange: (page: number) => setPageNum(page),
        }}
      />

      {/* 编辑用户 */}
      <Modal
        title={`编辑用户：${editing?.username ?? ''}`}
        visible={!!editing}
        onOk={() => void handleSaveEdit()}
        onCancel={() => setEditing(null)}
        confirmLoading={saving}
        width={520}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <Text type="tertiary" size="small">用户名</Text>
            <Input value={editForm.username ?? ''} onChange={(v) => setEditForm((f) => ({ ...f, username: v }))} />
          </div>
          <div>
            <Text type="tertiary" size="small">昵称</Text>
            <Input value={editForm.nickname ?? ''} onChange={(v) => setEditForm((f) => ({ ...f, nickname: v }))} />
          </div>
          <div>
            <Text type="tertiary" size="small">邮箱（填非空值视为已验证绑定）</Text>
            <Input value={editForm.email ?? ''} onChange={(v) => setEditForm((f) => ({ ...f, email: v }))} />
          </div>
          <div>
            <Text type="tertiary" size="small">手机号</Text>
            <Input value={editForm.phone ?? ''} onChange={(v) => setEditForm((f) => ({ ...f, phone: v }))} />
          </div>
          <div>
            <Text type="tertiary" size="small">真实姓名</Text>
            <Input value={editForm.realName ?? ''} onChange={(v) => setEditForm((f) => ({ ...f, realName: v }))} />
          </div>
          <div>
            <Text type="tertiary" size="small">性别</Text>
            <Select
              value={editForm.gender ?? ''}
              onChange={(v) => setEditForm((f) => ({ ...f, gender: String(v ?? '') }))}
              optionList={[
                { value: '', label: '未知' },
                { value: '男', label: '男' },
                { value: '女', label: '女' },
              ]}
            />
          </div>
          <div>
            <Text type="tertiary" size="small">生日（yyyy-MM-dd）</Text>
            <Input value={editForm.birthday ?? ''} onChange={(v) => setEditForm((f) => ({ ...f, birthday: v }))} placeholder="1995-06-01" />
          </div>
          <div>
            <Text type="tertiary" size="small">重置密码（留空不修改）</Text>
            <Input
              mode="password"
              value={editForm.newPassword ?? ''}
              onChange={(v) => setEditForm((f) => ({ ...f, newPassword: v }))}
              placeholder="6~50 位"
            />
          </div>
        </div>
        <Text type="tertiary" size="small" style={{ display: 'block', marginTop: 10 }}>
          仅提交发生修改的字段（含密码）；邮箱/手机传非空值将被视为管理员代为绑定且标记已验证。
        </Text>
      </Modal>

      {/* 分配角色 */}
      <Modal
        title={`分配角色：${assigning?.username ?? ''}`}
        visible={!!assigning}
        onOk={() => void handleSaveRoles()}
        onCancel={() => setAssigning(null)}
      >
        <Text type="tertiary" size="small" style={{ display: 'block', marginBottom: 8 }}>
          全量覆盖：保存后用户角色即为所选集合
        </Text>
        <Select
          multiple
          style={{ width: '100%' }}
          value={assignRoleCodes}
          onChange={(value) => setAssignRoleCodes((value as string[]) ?? [])}
          optionList={roles}
          placeholder="选择角色"
        />
      </Modal>
    </AuthAdminPage>
  );
};
