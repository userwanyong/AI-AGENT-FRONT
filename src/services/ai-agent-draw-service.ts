/**
 * AI Agent Draw 配置服务
 */
import { API_ENDPOINTS, getDefaultHeaders, parseResponseJsonSafely, stringifySafely } from '../config';

export interface AiAgentDrawConfigResponseDTO {
  id?: string;
  name: string;
  description?: string;
  status?: number;
  agentId?: string;
  data?: string;
  version?: number;
  createdBy?: string;
  updatedBy?: string;
  createTime?: string;
  updateTime?: string;
}

export interface ApiResponse<T> {
  code: string;
  info: string;
  data: T;
}

export interface PageResponse<T> {
  items: T;
  total: number;
  pageNum: number;
  pageSize: number;
}

export interface AiAgentDrawConfigQueryRequestDTO {
  id?: string;
  name?: string;
  status?: number;
  pageNum?: number;
  pageSize?: number;
}

export class AiAgentDrawService {
  private static readonly BASE_URL = API_ENDPOINTS.AI_AGENT_DRAW.BASE;

  static async queryDrawConfigList(
    payload: AiAgentDrawConfigQueryRequestDTO
  ): Promise<ApiResponse<PageResponse<AiAgentDrawConfigResponseDTO[]>>> {
    const response = await fetch(`${this.BASE_URL}${API_ENDPOINTS.AI_AGENT_DRAW.QUERY_LIST}`, {
      method: 'POST',
      headers: getDefaultHeaders(),
      body: stringifySafely(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await parseResponseJsonSafely(response);
  }

  static async getDrawConfig(configId: string): Promise<AiAgentDrawConfigResponseDTO | null> {
    try {
      const url = `${this.BASE_URL}${API_ENDPOINTS.AI_AGENT_DRAW.GET_CONFIG}/${encodeURIComponent(
        configId
      )}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: getDefaultHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<AiAgentDrawConfigResponseDTO> = await parseResponseJsonSafely(response);

      if (result.code === '0000') {
        return result.data || null;
      } else {
        throw new Error(result.info || '获取配置失败');
      }
    } catch (error) {
      console.error('获取Agent Draw配置失败:', error);
      return null;
    }
  }

  static async deleteDrawConfig(configId: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.BASE_URL}${API_ENDPOINTS.AI_AGENT_DRAW.DELETE_CONFIG}/${encodeURIComponent(
          configId
        )}`,
        {
          method: 'DELETE',
          headers: getDefaultHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<boolean> = await parseResponseJsonSafely(response);
      if (result.code === '0000') {
        return true;
      } else {
        throw new Error(result.info || '删除配置失败');
      }
    } catch (error) {
      console.error('删除Agent Draw配置失败:', error);
      throw error;
    }
  }
}
