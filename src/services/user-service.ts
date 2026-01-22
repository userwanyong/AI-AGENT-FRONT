import {
  API_ENDPOINTS,
  getDefaultHeaders,
  getUploadHeaders,
  parseResponseJsonSafely,
  stringifySafely,
} from '../config';

// 定义API响应格式
export interface ApiResponse<T> {
  code: string;
  msg: string;
  data: T;
}

export class UserService {
  private static readonly BASE_URL = API_ENDPOINTS.USER.BASE;

  /**
   * 修改密码
   */
  static async updatePassword(payload: {
    username: string;
    oldPassword: string;
    newPassword: string;
  }): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${this.BASE_URL}${API_ENDPOINTS.USER.UPDATE_PWD}`, {
        method: 'PUT',
        headers: getDefaultHeaders(),
        body: stringifySafely(payload),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await parseResponseJsonSafely(response);
    } catch (error) {
      console.error('修改密码失败:', error);
      throw error;
    }
  }

  static async resetPassword(username: string): Promise<ApiResponse<void>> {
    try {
      const url = `${this.BASE_URL}${API_ENDPOINTS.USER.RESET_PWD}?username=${encodeURIComponent(
        username
      )}`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: getDefaultHeaders(),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await parseResponseJsonSafely(response);
    } catch (error) {
      console.error('重置密码失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户历史对话列表
   * @returns {Promise<string[]>} 历史对话列表
   */
  static async getUserHistory(): Promise<string[]> {
    try {
      const response = await fetch(`${API_ENDPOINTS.USER.BASE}/history`, {
        method: 'GET',
        headers: getDefaultHeaders(),
      });

      if (!response.ok) {
        throw new Error('获取历史对话失败');
      }

      const data = await parseResponseJsonSafely(response);
      return data.data || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * 删除用户历史对话
   */
  static async deleteUserHistory(sessionId: string): Promise<boolean> {
    try {
      if (!sessionId) {
        throw new Error('缺少会话ID');
      }
      const url = `${API_ENDPOINTS.USER.BASE}/history/delete/${encodeURIComponent(
        sessionId
      )}`;
      const response = await fetch(url, {
        method: 'DELETE',
        headers: getDefaultHeaders(),
      });

      if (!response.ok) {
        throw new Error('删除历史对话失败');
      }

      // 后端返回 BaseResponse<Void>，data 为 null
      await response.json();
      return true;
    } catch (error) {
      console.error('删除历史对话失败:', error);
      return false;
    }
  }

  /**
   * 获取特定会话的对话记录
   * @param {string} sessionId 会话ID
   * @returns {Promise<string[]>} 对话记录列表
   */
  static async getUserSession(sessionId: string): Promise<any[]> {
    try {
      const response = await fetch(
        `${API_ENDPOINTS.USER.BASE}/session?session_id=${sessionId}`,
        {
          method: 'GET',
          headers: getDefaultHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error('获取会话记录失败');
      }

      const data = await response.json();
      const list = data?.data || [];
      // 保持接口原始顺序（通常为时间正序），由前端按需渲染
      return Array.isArray(list) ? list : [];
    } catch (error) {
      return [];
    }
  }

  /**
   * 获取用户信息
   */
  static async getUserInfo(userId: string | number): Promise<ApiResponse<UserInfoResponseDTO>> {
    try {
      const response = await fetch(
        `${this.BASE_URL}${API_ENDPOINTS.USER.INFO}/${encodeURIComponent(String(userId))}`,
        {
          method: 'GET',
          headers: getDefaultHeaders(),
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await parseResponseJsonSafely(response);
    } catch (error) {
      console.error('获取用户信息失败:', error);
      throw error;
    }
  }

  /**
   * 更新用户信息
   */
  static async updateUserInfo(payload: UserInfoRequestDTO): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${this.BASE_URL}${API_ENDPOINTS.USER.INFO}`, {
        method: 'PUT',
        headers: getDefaultHeaders(),
        body: stringifySafely(payload),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await parseResponseJsonSafely(response);
    } catch (error) {
      console.error('更新用户信息失败:', error);
      throw error;
    }
  }

  /**
   * 上传头像，返回 URL
   */
  static async uploadAvatar(file: File): Promise<ApiResponse<string>> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch(`${API_ENDPOINTS.FILE.BASE}${API_ENDPOINTS.FILE.UPLOAD}`, {
        method: 'POST',
        headers: getUploadHeaders(),
        body: formData,
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await parseResponseJsonSafely(response);
    } catch (error) {
      console.error('上传头像失败:', error);
      throw error;
    }
  }

  /**
   * 发送邮箱登录验证码
   * @param email 邮箱地址
   * @returns Promise<{success: boolean, message?: string}>
   */
  static async sendEmailCode(email: string): Promise<{success: boolean, message?: string}> {
    try {
      const response = await fetch(`${this.BASE_URL}/email/code`, {
        method: 'POST',
        headers: getDefaultHeaders(),
        body: stringifySafely({ email }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await parseResponseJsonSafely(response);
      // 后端返回格式: {code, message, ...}
      // code === '0000' 表示成功
      if (result.code === '0000') {
        return { success: true };
      } else {
        return { success: false, message: result.msg || '发送验证码失败' };
      }
    } catch (error) {
      console.error('发送验证码请求失败:', error);
      return { success: false, message: '发送验证码失败,请检查网络连接' };
    }
  }

  /**
   * 邮箱验证码登录
   * @param email 邮箱地址
   * @param code 验证码
   * @returns Promise<{success: boolean, data?: any, message?: string}>
   */
  static async loginByEmail(email: string, code: string): Promise<{success: boolean, data?: any, message?: string}> {
    try {
      const response = await fetch(`${this.BASE_URL}/email/login`, {
        method: 'POST',
        headers: getDefaultHeaders(),
        body: stringifySafely({ email, code }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await parseResponseJsonSafely(response);
      if (result.code === '0000') {
        return { success: true, data: result.data };
      } else {
        return { success: false, message: result.msg || '登录失败' };
      }
    } catch (error) {
      console.error('邮箱登录请求失败:', error);
      return { success: false, message: '登录失败,请检查网络连接' };
    }
  }

  /**
   * 验证管理员用户登录
   * @param loginData 登录数据
   * @returns Promise<boolean> 登录是否成功
   */
  static async validateAdminUserLogin(loginData: AdminUserLoginRequestDTO): Promise<boolean> {
    try {
      const response = await fetch(`${API_ENDPOINTS.ADMIN_USER.BASE}${API_ENDPOINTS.ADMIN_USER.VALIDATE_LOGIN}`, {
        method: 'POST',
        headers: getDefaultHeaders(),
        body: stringifySafely(loginData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await parseResponseJsonSafely(response) as ApiResponse<boolean> & { info?: string };

      if (result.code === '0000') {
        return result.data || false;
      } else {
        console.error('登录验证失败:', result.info || result.msg);
        return false;
      }
    } catch (error) {
      console.error('登录验证请求失败:', error);
      return false;
    }
  }
}

// DTO 类型声明
export interface UserInfoResponseDTO {
  id?: string | number;
  userId?: string | number;
  nickname?: string;
  sex?: number; // 0-男 1-女
  phone?: string;
  email?: string;
  avatar?: string;
  language?: number; // 0-中文 1-英文
  bio?: string;
}

export interface UserInfoRequestDTO extends UserInfoResponseDTO {}

// 定义邮箱验证码请求数据类型
export interface EmailCodeRequestDTO {
  email: string;
}

// 定义邮箱登录请求数据类型
export interface EmailLoginRequestDTO {
  email: string;
  code: string;
}

// 定义邮箱登录响应数据类型
export interface EmailLoginResponseDTO {
  id: number;
  username: string;
  status: number; // 0-正常 1-禁用
  role: number; // 0-管理员 1-用户
  avatar?: string;
  createTime: string;
  updateTime: string;
  token: string;
}

// 定义管理员登录请求数据类型
export interface AdminUserLoginRequestDTO {
  username: string;
  password: string;
}
