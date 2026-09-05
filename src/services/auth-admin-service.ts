import {
  API_ENDPOINTS,
  getDefaultHeaders,
  parseResponseJsonSafely,
  stringifySafely,
} from '../config';

/**
 * 认证服务管理端 API（用户/角色/权限/登录方式，全部通过后端 RPC 直通 auth-service）
 */

export interface AuthAdminUserDTO {
  id: number | string;
  username: string;
  email: string;
  phone: string;
  nickname: string;
  avatar: string;
  status: number; // 1-正常 0-禁用
  roles: string[];
  permissions: string[];
  emailVerified: boolean;
  phoneVerified: boolean;
  realName: string;
  gender: number;
  birthday: string;
  lastLoginAt: number;
  createdAt: number;
  updatedAt: number;
}

export interface AuthAdminRoleDTO {
  id: number | string;
  code: string;
  name: string;
  description: string;
  status: number;
  permissions: string[];
}

export interface AuthAdminPermissionDTO {
  id: number | string;
  code: string;
  name: string;
  resource: string;
  action: string;
  description: string;
}

export interface AuthAdminLoginMethodDTO {
  method: string;
  category: string; // password / email / sms / oauth
  displayName: string;
  enabled: number; // 平台级=平台开关；租户级=本租户开关
  usePlatformConfig: number;
  hasConfig: boolean;
  platformEnabled: boolean;
  platformLocked: boolean;
}

interface AdminResponse<T> {
  code: string;
  msg: string;
  info?: string;
  data: T;
}

const BASE = () => `${API_ENDPOINTS.USER.BASE.replace(/\/user$/, '')}/admin/auth`;

async function request<T>(path: string, init?: RequestInit): Promise<AdminResponse<T>> {
  const response = await fetch(`${BASE()}${path}`, {
    headers: getDefaultHeaders(),
    ...init,
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return (await parseResponseJsonSafely(response)) as AdminResponse<T>;
}

function ok<T>(resp: AdminResponse<T>): { success: true; data: T } {
  return { success: true, data: resp.data };
}

function fail(resp: AdminResponse<unknown>): { success: false; message: string } {
  return { success: false, message: resp.info || resp.msg || '操作失败' };
}

export class AuthAdminService {
  // ==================== 用户管理 ====================

  static async searchUsers(params: {
    keyword?: string;
    pageNum?: number;
    pageSize?: number;
  }): Promise<{ success: boolean; data?: { total: number; items: AuthAdminUserDTO[] }; message?: string }> {
    try {
      const query = new URLSearchParams();
      if (params.keyword) {
        query.set('keyword', params.keyword);
      }
      query.set('pageNum', String(params.pageNum ?? 1));
      query.set('pageSize', String(params.pageSize ?? 10));
      const resp = await request<{ total: number; items: AuthAdminUserDTO[] }>(`/users?${query.toString()}`);
      return ok(resp);
    } catch (error) {
      console.error('搜索用户失败:', error);
      return { success: false, message: '搜索用户失败,请检查网络连接' };
    }
  }

  /**
   * 更新用户（fieldsToUpdate 字段掩码）
   */
  static async updateUser(payload: {
    userId: number | string;
    username?: string;
    password?: string;
    email?: string;
    phone?: string;
    nickname?: string;
    avatar?: string;
    status?: number;
    realName?: string;
    gender?: number;
    birthday?: string;
    fieldsToUpdate: string[];
  }): Promise<{ success: boolean; message?: string }> {
    try {
      const resp = await request<void>('/user', {
        method: 'PUT',
        body: stringifySafely(payload),
      });
      return resp.code === '0000' ? { success: true } : fail(resp);
    } catch (error) {
      console.error('更新用户失败:', error);
      return { success: false, message: '更新用户失败,请检查网络连接' };
    }
  }

  static async updateUserStatus(
    userId: number | string,
    status: number
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const resp = await request<void>(`/user/${userId}/status/${status}`, { method: 'PUT' });
      return resp.code === '0000' ? { success: true } : fail(resp);
    } catch (error) {
      console.error('更新用户状态失败:', error);
      return { success: false, message: '更新用户状态失败,请检查网络连接' };
    }
  }

  static async assignUserRoles(
    userId: number | string,
    roleIds: string[]
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const resp = await request<void>('/user/roles', {
        method: 'PUT',
        body: stringifySafely({ userId, roleIds }),
      });
      return resp.code === '0000' ? { success: true } : fail(resp);
    } catch (error) {
      console.error('分配用户角色失败:', error);
      return { success: false, message: '分配用户角色失败,请检查网络连接' };
    }
  }

  static async deleteUser(userId: number | string): Promise<{ success: boolean; message?: string }> {
    try {
      const resp = await request<void>(`/user/${userId}`, { method: 'DELETE' });
      return resp.code === '0000' ? { success: true } : fail(resp);
    } catch (error) {
      console.error('删除用户失败:', error);
      return { success: false, message: '删除用户失败,请检查网络连接' };
    }
  }

  // ==================== 角色管理 ====================

  static async listRoles(): Promise<{ success: boolean; data?: AuthAdminRoleDTO[]; message?: string }> {
    try {
      const resp = await request<AuthAdminRoleDTO[]>('/roles');
      return ok(resp);
    } catch (error) {
      console.error('获取角色列表失败:', error);
      return { success: false, message: '获取角色列表失败,请检查网络连接' };
    }
  }

  static async createRole(payload: {
    code: string;
    name: string;
    description?: string;
  }): Promise<{ success: boolean; message?: string }> {
    try {
      const resp = await request<AuthAdminRoleDTO>('/role', {
        method: 'POST',
        body: stringifySafely(payload),
      });
      return resp.code === '0000' ? { success: true } : fail(resp);
    } catch (error) {
      console.error('创建角色失败:', error);
      return { success: false, message: '创建角色失败,请检查网络连接' };
    }
  }

  static async updateRole(payload: {
    id: number | string;
    name?: string;
    description?: string;
  }): Promise<{ success: boolean; message?: string }> {
    try {
      const resp = await request<void>('/role', {
        method: 'PUT',
        body: stringifySafely(payload),
      });
      return resp.code === '0000' ? { success: true } : fail(resp);
    } catch (error) {
      console.error('更新角色失败:', error);
      return { success: false, message: '更新角色失败,请检查网络连接' };
    }
  }

  static async deleteRole(roleId: number | string): Promise<{ success: boolean; message?: string }> {
    try {
      const resp = await request<void>(`/role/${roleId}`, { method: 'DELETE' });
      return resp.code === '0000' ? { success: true } : fail(resp);
    } catch (error) {
      console.error('删除角色失败:', error);
      return { success: false, message: '删除角色失败,请检查网络连接' };
    }
  }

  static async assignRolePermissions(
    roleId: number | string,
    permissionIds: string[]
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const resp = await request<void>('/role/permissions', {
        method: 'PUT',
        body: stringifySafely({ roleId, permissionIds }),
      });
      return resp.code === '0000' ? { success: true } : fail(resp);
    } catch (error) {
      console.error('分配角色权限失败:', error);
      return { success: false, message: '分配角色权限失败,请检查网络连接' };
    }
  }

  // ==================== 权限管理 ====================

  static async listPermissions(): Promise<{ success: boolean; data?: AuthAdminPermissionDTO[]; message?: string }> {
    try {
      const resp = await request<AuthAdminPermissionDTO[]>('/permissions');
      return ok(resp);
    } catch (error) {
      console.error('获取权限列表失败:', error);
      return { success: false, message: '获取权限列表失败,请检查网络连接' };
    }
  }

  static async createPermission(payload: {
    code: string;
    name: string;
    resource?: string;
    action?: string;
    description?: string;
  }): Promise<{ success: boolean; message?: string }> {
    try {
      const resp = await request<AuthAdminPermissionDTO>('/permission', {
        method: 'POST',
        body: stringifySafely(payload),
      });
      return resp.code === '0000' ? { success: true } : fail(resp);
    } catch (error) {
      console.error('创建权限失败:', error);
      return { success: false, message: '创建权限失败,请检查网络连接' };
    }
  }

  static async deletePermission(permissionId: number | string): Promise<{ success: boolean; message?: string }> {
    try {
      const resp = await request<void>(`/permission/${permissionId}`, { method: 'DELETE' });
      return resp.code === '0000' ? { success: true } : fail(resp);
    } catch (error) {
      console.error('删除权限失败:', error);
      return { success: false, message: '删除权限失败,请检查网络连接' };
    }
  }

  // ==================== 登录方式配置 ====================

  static async listLoginMethods(level: 'platform' | 'tenant'): Promise<{
    success: boolean;
    data?: AuthAdminLoginMethodDTO[];
    message?: string;
  }> {
    try {
      const resp = await request<AuthAdminLoginMethodDTO[]>(`/login-methods/${level}`);
      return ok(resp);
    } catch (error) {
      console.error('获取登录方式配置失败:', error);
      return { success: false, message: '获取登录方式配置失败,请检查网络连接' };
    }
  }

  static async saveLoginMethod(
    level: 'platform' | 'tenant',
    payload: {
      method: string;
      enabled: number;
      usePlatformConfig?: number;
      configJson?: string;
    }
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const resp = await request<void>(`/login-methods/${level}`, {
        method: 'PUT',
        body: stringifySafely(payload),
      });
      return resp.code === '0000' ? { success: true } : fail(resp);
    } catch (error) {
      console.error('保存登录方式配置失败:', error);
      return { success: false, message: '保存登录方式配置失败,请检查网络连接' };
    }
  }
}
