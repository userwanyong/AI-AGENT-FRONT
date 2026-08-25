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
   * 修改密码（登录后，需校验旧密码）
   */
  static async updatePassword(payload: {
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

  /**
   * 设置密码（验证码自动注册用户首次设置，无需旧密码）
   */
  static async setPassword(newPassword: string): Promise<{success: boolean, message?: string}> {
    try {
      const response = await fetch(`${this.BASE_URL}${API_ENDPOINTS.USER.SET_PWD}`, {
        method: 'PUT',
        headers: getDefaultHeaders(),
        body: stringifySafely({ newPassword }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await parseResponseJsonSafely(response);
      if (result.code === '0000') {
        return { success: true };
      }
      return { success: false, message: result.info || result.msg || '设置密码失败' };
    } catch (error) {
      console.error('设置密码请求失败:', error);
      return { success: false, message: '设置密码失败,请检查网络连接' };
    }
  }

  /**
   * 获取用户历史对话列表（结构化数据）
   * @returns {Promise<ConversationResponseDTO[]>} 历史对话列表
   */
  static async getUserHistory(): Promise<ConversationResponseDTO[]> {
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
   * @returns {Promise<any[]>} 对话记录列表
   */
  static async getUserSession(sessionId: string): Promise<any[]> {
    try {
      const response = await fetch(
        `${API_ENDPOINTS.USER.BASE}/session/${encodeURIComponent(sessionId)}`,
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
      return Array.isArray(list) ? list : [];
    } catch (error) {
      return [];
    }
  }

  /**
   * 修改会话标题
   * @param sessionId 会话ID
   * @param title 新标题
   * @returns 是否修改成功
   */
  static async updateConversationTitle(sessionId: string, title: string): Promise<boolean> {
    try {
      const url = `${API_ENDPOINTS.USER.BASE}/session/${encodeURIComponent(sessionId)}/title`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: getDefaultHeaders(),
        body: stringifySafely({ sessionId, title }),
      });

      if (!response.ok) {
        throw new Error('修改标题失败');
      }

      return true;
    } catch (error) {
      console.error('修改会话标题失败:', error);
      return false;
    }
  }

  /**
   * 分页获取会话消息
   * @param sessionId 会话ID
   * @param cursor 游标（上一页最后一条消息ID），首次加载不传
   * @param limit 每页数量，默认 20
   * @returns 分页消息数据
   */
  static async getPaginatedMessages(
    sessionId: string,
    cursor?: number,
    limit: number = 20
  ): Promise<MessagePageResponseDTO | null> {
    try {
      let url = `${API_ENDPOINTS.USER.BASE}/session/${encodeURIComponent(sessionId)}/messages?limit=${limit}`;
      if (cursor !== undefined && cursor !== null) {
        url += `&cursor=${cursor}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: getDefaultHeaders(),
      });

      if (!response.ok) {
        throw new Error('获取分页消息失败');
      }

      const data = await parseResponseJsonSafely(response);
      return data.data || null;
    } catch (error) {
      console.error('获取分页消息失败:', error);
      return null;
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
   * 查询已启用的登录方式编码（登录页动态渲染）
   * 如 ["password", "email:smtp", "oauth:gitee", "oauth:github"]
   */
  static async getLoginMethods(): Promise<{success: boolean, data?: string[], message?: string}> {
    try {
      const response = await fetch(`${this.BASE_URL}${API_ENDPOINTS.USER.LOGIN_METHODS}`, {
        method: 'GET',
        headers: getDefaultHeaders(),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await parseResponseJsonSafely(response);
      if (result.code === '0000') {
        return { success: true, data: result.data || [] };
      }
      return { success: false, message: result.info || result.msg || '获取登录方式失败' };
    } catch (error) {
      console.error('获取登录方式请求失败:', error);
      return { success: false, message: '获取登录方式失败,请检查网络连接' };
    }
  }

  /**
   * 账号密码登录
   */
  static async loginByPassword(username: string, password: string): Promise<{success: boolean, data?: UserLoginResponseDTO, message?: string}> {
    try {
      const response = await fetch(`${this.BASE_URL}${API_ENDPOINTS.USER.LOGIN}`, {
        method: 'POST',
        headers: getDefaultHeaders(),
        body: stringifySafely({ username, password }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await parseResponseJsonSafely(response);
      if (result.code === '0000') {
        return { success: true, data: result.data };
      }
      return { success: false, message: result.info || result.msg || '登录失败' };
    } catch (error) {
      console.error('登录请求失败:', error);
      return { success: false, message: '登录失败,请检查网络连接' };
    }
  }

  /**
   * 发送登录验证码（邮箱/手机）
   */
  static async sendLoginCode(target: string): Promise<{success: boolean, message?: string}> {
    try {
      const response = await fetch(`${this.BASE_URL}${API_ENDPOINTS.USER.CODE_SEND}`, {
        method: 'POST',
        headers: getDefaultHeaders(),
        body: stringifySafely({ target }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await parseResponseJsonSafely(response);
      if (result.code === '0000') {
        return { success: true };
      }
      return { success: false, message: result.info || result.msg || '发送验证码失败' };
    } catch (error) {
      console.error('发送验证码请求失败:', error);
      return { success: false, message: '发送验证码失败,请检查网络连接' };
    }
  }

  /**
   * 验证码登录（自动注册）
   */
  static async loginByCode(target: string, code: string): Promise<{success: boolean, data?: UserLoginResponseDTO, message?: string}> {
    try {
      const response = await fetch(`${this.BASE_URL}${API_ENDPOINTS.USER.CODE_LOGIN}`, {
        method: 'POST',
        headers: getDefaultHeaders(),
        body: stringifySafely({ target, code }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await parseResponseJsonSafely(response);
      if (result.code === '0000') {
        return { success: true, data: result.data };
      }
      return { success: false, message: result.info || result.msg || '登录失败' };
    } catch (error) {
      console.error('验证码登录请求失败:', error);
      return { success: false, message: '登录失败,请检查网络连接' };
    }
  }

  /**
   * 获取当前登录用户信息
   */
  static async getCurrentUser(): Promise<{success: boolean, data?: UserLoginResponseDTO, message?: string}> {
    try {
      const response = await fetch(`${this.BASE_URL}${API_ENDPOINTS.USER.CURRENT_USER}`, {
        method: 'GET',
        headers: getDefaultHeaders(),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await parseResponseJsonSafely(response);
      if (result.code === '0000') {
        return { success: true, data: result.data };
      }
      return { success: false, message: result.info || result.msg || '获取用户信息失败' };
    } catch (error) {
      console.error('获取用户信息请求失败:', error);
      return { success: false, message: '获取用户信息失败,请检查网络连接' };
    }
  }

  /**
   * OAuth 登录入口地址（浏览器直接跳转，后端 302 到提供方授权页）
   */
  static getOAuthAuthorizeUrl(provider: string): string {
    return `${this.BASE_URL}/oauth/${encodeURIComponent(provider)}/authorize`;
  }

  // ==================== 个人中心 ====================

  /**
   * 获取当前用户档案（认证服务信息 + 第三方绑定）
   */
  static async getUserProfile(): Promise<{success: boolean, data?: UserProfileResponseDTO, message?: string}> {
    try {
      const response = await fetch(`${this.BASE_URL}/profile`, {
        method: 'GET',
        headers: getDefaultHeaders(),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await parseResponseJsonSafely(response);
      if (result.code === '0000') {
        return { success: true, data: result.data };
      }
      return { success: false, message: result.info || result.msg || '获取个人档案失败' };
    } catch (error) {
      console.error('获取个人档案失败:', error);
      return { success: false, message: '获取个人档案失败,请检查网络连接' };
    }
  }

  /**
   * 更新当前用户资料（昵称/真实姓名/性别/生日）
   */
  static async updateProfile(payload: {
    nickname?: string;
    realName?: string;
    gender?: number;
    birthday?: string;
  }): Promise<{success: boolean, message?: string}> {
    try {
      const response = await fetch(`${this.BASE_URL}/profile`, {
        method: 'PUT',
        headers: getDefaultHeaders(),
        body: stringifySafely(payload),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await parseResponseJsonSafely(response);
      if (result.code === '0000') {
        return { success: true };
      }
      return { success: false, message: result.info || result.msg || '资料更新失败' };
    } catch (error) {
      console.error('资料更新失败:', error);
      return { success: false, message: '资料更新失败,请检查网络连接' };
    }
  }

  /**
   * 上传头像（转存认证服务 OSS 并持久化），返回头像 URL
   */
  static async uploadProfileAvatar(file: File): Promise<{success: boolean, data?: string, message?: string}> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch(`${this.BASE_URL}/profile/avatar`, {
        method: 'POST',
        headers: getUploadHeaders(),
        body: formData,
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await parseResponseJsonSafely(response);
      if (result.code === '0000') {
        return { success: true, data: result.data };
      }
      return { success: false, message: result.info || result.msg || '头像上传失败' };
    } catch (error) {
      console.error('头像上传失败:', error);
      return { success: false, message: '头像上传失败,请检查网络连接' };
    }
  }

  /**
   * 绑定邮箱/手机号（先对新目标调用 sendLoginCode 发送验证码）
   */
  static async bindContact(kind: 'email' | 'phone', target: string, code: string): Promise<{success: boolean, message?: string}> {
    try {
      const response = await fetch(`${this.BASE_URL}/profile/bind-${kind}`, {
        method: 'POST',
        headers: getDefaultHeaders(),
        body: stringifySafely({ target, code }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await parseResponseJsonSafely(response);
      if (result.code === '0000') {
        return { success: true };
      }
      return { success: false, message: result.info || result.msg || '绑定失败' };
    } catch (error) {
      console.error('绑定失败:', error);
      return { success: false, message: '绑定失败,请检查网络连接' };
    }
  }

  /**
   * 解绑邮箱/手机号
   */
  static async unbindContact(kind: 'email' | 'phone'): Promise<{success: boolean, message?: string}> {
    try {
      const response = await fetch(`${this.BASE_URL}/profile/${kind}`, {
        method: 'DELETE',
        headers: getDefaultHeaders(),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await parseResponseJsonSafely(response);
      if (result.code === '0000') {
        return { success: true };
      }
      return { success: false, message: result.info || result.msg || '解绑失败' };
    } catch (error) {
      console.error('解绑失败:', error);
      return { success: false, message: '解绑失败,请检查网络连接' };
    }
  }

  /**
   * 第三方账号绑定列表
   */
  static async getOAuthBindings(): Promise<{success: boolean, data?: OAuthBindingResponseDTO[], message?: string}> {
    try {
      const response = await fetch(`${this.BASE_URL}/profile/oauth-bindings`, {
        method: 'GET',
        headers: getDefaultHeaders(),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await parseResponseJsonSafely(response);
      if (result.code === '0000') {
        return { success: true, data: result.data || [] };
      }
      return { success: false, message: result.info || result.msg || '获取绑定列表失败' };
    } catch (error) {
      console.error('获取绑定列表失败:', error);
      return { success: false, message: '获取绑定列表失败,请检查网络连接' };
    }
  }

  /**
   * 第三方账号绑定授权 URL（浏览器跳转后回调自动完成绑定）
   */
  static async getOAuthBindUrl(provider: string): Promise<{success: boolean, data?: string, message?: string}> {
    try {
      const response = await fetch(`${this.BASE_URL}/profile/oauth-bind-url/${encodeURIComponent(provider)}`, {
        method: 'GET',
        headers: getDefaultHeaders(),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await parseResponseJsonSafely(response);
      if (result.code === '0000') {
        return { success: true, data: result.data };
      }
      return { success: false, message: result.info || result.msg || '获取绑定地址失败' };
    } catch (error) {
      console.error('获取绑定地址失败:', error);
      return { success: false, message: '获取绑定地址失败,请检查网络连接' };
    }
  }

  /**
   * 解绑第三方账号
   */
  static async unbindOAuth(provider: string): Promise<{success: boolean, message?: string}> {
    try {
      const response = await fetch(`${this.BASE_URL}/profile/oauth-binding/${encodeURIComponent(provider)}`, {
        method: 'DELETE',
        headers: getDefaultHeaders(),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await parseResponseJsonSafely(response);
      if (result.code === '0000') {
        return { success: true };
      }
      return { success: false, message: result.info || result.msg || '解绑失败' };
    } catch (error) {
      console.error('解绑失败:', error);
      return { success: false, message: '解绑失败,请检查网络连接' };
    }
  }

  /**
   * 刷新Token
   * @param refreshToken 刷新令牌
   * @returns Promise<{success: boolean, data?: UserLoginResponseDTO, message?: string}>
   */
  static async refreshToken(refreshToken: string): Promise<{success: boolean, data?: UserLoginResponseDTO, message?: string}> {
    try {
      const response = await fetch(`${this.BASE_URL}${API_ENDPOINTS.USER.REFRESH_TOKEN}`, {
        method: 'POST',
        headers: getDefaultHeaders(),
        body: stringifySafely({ refreshToken }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await parseResponseJsonSafely(response);
      if (result.code === '0000') {
        return { success: true, data: result.data };
      } else {
        return { success: false, message: result.info || result.msg || '刷新Token失败' };
      }
    } catch (error) {
      console.error('刷新Token请求失败:', error);
      return { success: false, message: '刷新Token失败,请检查网络连接' };
    }
  }

  /**
   * 登出（同时传 refreshToken 使其一并失效）
   */
  static async logout(): Promise<{success: boolean, message?: string}> {
    try {
      const refreshToken = localStorage.getItem('refreshToken') || '';
      const response = await fetch(`${this.BASE_URL}${API_ENDPOINTS.USER.LOGOUT}`, {
        method: 'POST',
        headers: getDefaultHeaders(),
        body: stringifySafely({ refreshToken }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await parseResponseJsonSafely(response);
      if (result.code === '0000') {
        return { success: true };
      } else {
        return { success: false, message: result.info || result.msg || '登出失败' };
      }
    } catch (error) {
      console.error('登出请求失败:', error);
      return { success: false, message: '登出失败,请检查网络连接' };
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

// 定义用户登录响应数据类型
export interface UserLoginResponseDTO {
  id: number | string;
  username: string;
  email?: string;
  status: number; // 1-正常 0-禁用
  role: number; // 0-管理员 1-用户
  avatar?: string;
  createTime: string;
  updateTime: string;
  token: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  isFirst: boolean; // 是否首次登录
}

// 定义刷新Token请求类型
export interface RefreshTokenRequestDTO {
  refreshToken: string;
}

// 第三方账号绑定
export interface OAuthBindingResponseDTO {
  id: number | string;
  provider: string; // gitee / github
  providerUid: string;
  createdAt: number;
}

// 个人中心用户档案
export interface UserProfileResponseDTO {
  id: number | string;
  username: string;
  account: string; // 登录账号展示（邮箱优先，其次用户名）
  email: string;
  emailVerified: boolean;
  phone: string;
  phoneVerified: boolean;
  nickname: string;
  realName: string;
  gender: number; // 0-未知 1-男 2-女
  birthday: string;
  avatar: string;
  status: number;
  roles: string[];
  permissions: string[];
  oauthBindings: OAuthBindingResponseDTO[];
}

// 会话列表响应 DTO（对应后端 ConversationResponseDTO）
export interface ConversationResponseDTO {
  sessionId: string;
  userId: number;
  agentId: number;
  agentName: string;
  title: string;
  messageCount: number;
  lastMessageAt: string;
  createTime: string;
  updateTime: string;
}

// 消息分页响应 DTO（对应后端 MessagePageResponseDTO）
export interface MessagePageResponseDTO {
  messages: MessageItemDTO[];
  nextCursor: number | null;
  hasMore: boolean;
}

// 单条消息 DTO（对应后端 MessageItemDTO）
export interface MessageItemDTO {
  id: number;
  conversationId: string;
  role: string;       // user/assistant/system/tool
  content: string;
  messageType: string;
  createTime: string;
}
