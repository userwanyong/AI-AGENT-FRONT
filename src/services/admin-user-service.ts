/**
 * 管理员用户API服务
 */

import {
  API_ENDPOINTS,
  getDefaultHeaders,
  parseResponseJsonSafely,
  stringifySafely,
} from '../config';

// 定义API响应格式
export interface ApiResponse<T> {
  code: string;
  info: string;
  data: T;
}

export interface AgentResponseDTO {
  id: string;
  name: string;
  description: string;
  channel: string;
  strategy: string;
  status: string;
  createTime: string;
  updateTime: string;
}

export interface PageResponse<T> {
  items: T;
  total: number;
  pageNum: number;
  pageSize: number;
}

// 更新智能体请求数据
export interface AgentRequestDTO {
  id?: string;
  name?: string;
  description?: string;
  channel?: string;
  strategy?: string;
  status: number; // 0 禁用, 1 启用
}

/**
 * 管理员用户API服务类
 */
export class AdminUserService {
  private static readonly BASE_URL = API_ENDPOINTS.ADMIN_USER.BASE;

  /**
   * 查询启用的智能体
   */
  static async queryEnableAgent(): Promise<ApiResponse<AgentResponseDTO[]>> {
    try {
      const response = await fetch(
        `${this.BASE_URL}${API_ENDPOINTS.ADMIN_USER.QUERY_AGENT_ENABLED}`,
        {
          method: 'GET',
          headers: getDefaultHeaders(),
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return parseResponseJsonSafely(response);
    } catch (error) {
      console.error('查询启用的智能体失败:', error);
      throw error;
    }
  }

  /**
   * 更新智能体状态/信息
   */
  static async updateAgent(payload: AgentRequestDTO): Promise<ApiResponse<boolean>> {
    try {
      const response = await fetch(`${this.BASE_URL}${API_ENDPOINTS.ADMIN_USER.UPDATE_AGENT}`, {
        method: 'POST',
        headers: getDefaultHeaders(),
        body: stringifySafely(payload),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await parseResponseJsonSafely(response);
    } catch (error) {
      console.error('更新智能体失败:', error);
      throw error;
    }
  }
}
