import { API_ENDPOINTS, getDefaultHeaders } from '../config';
export class UserService {
  /**
   * 获取用户历史对话列表
   * @returns {Promise<string[]>} 历史对话列表
   */
  static async getUserHistory(): Promise<string[]> {
    try {
      const response = await fetch(`${API_ENDPOINTS.ADMIN_USER.BASE}/user/history`, {
        method: 'GET',
        headers: getDefaultHeaders(),
      });

      if (!response.ok) {
        throw new Error('获取历史对话失败');
      }

      const data = await response.json();
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
      const url = `${API_ENDPOINTS.ADMIN_USER.BASE}/history/delete/${encodeURIComponent(
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
        `${API_ENDPOINTS.ADMIN_USER.BASE}/user/session?session_id=${sessionId}`,
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
}
