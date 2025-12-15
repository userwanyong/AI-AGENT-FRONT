/**
 * AI客户端模型API服务
 */

import { API_ENDPOINTS, getDefaultHeaders, parseResponseJsonSafely } from '../config';

// 定义响应数据类型
export interface AiClientModelResponseDTO {
  id: string;
  name: string;
  type?: string;
  chatApiId?: string;
  description?: string;
  status: number;
  createTime: string;
  updateTime: string;
}

// 定义API响应格式
export interface ApiResponse<T> {
  code: string;
  info: string;
  data: T;
}

/**
 * AI客户端模型API服务类
 */
export class AiClientModelService {
  private static readonly BASE_URL = API_ENDPOINTS.AI_CLIENT_MODEL.BASE;

  /**
   * 查询所有启用的AI客户端模型配置
   */
  static async queryEnabledAiClientModels(): Promise<AiClientModelResponseDTO[]> {
    try {
      const response = await fetch(
        `${this.BASE_URL}${API_ENDPOINTS.AI_CLIENT_MODEL.QUERY_ENABLED}`,
        {
          method: 'GET',
          headers: getDefaultHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<AiClientModelResponseDTO[]> = await parseResponseJsonSafely(
        response
      );

      if (result.code === '0000') {
        return result.data || [];
      } else {
        throw new Error(result.info || '查询失败');
      }
    } catch (error) {
      console.error('查询启用的AI客户端模型配置失败:', error);
      // 返回空数组作为降级处理
      return [];
    }
  }
}
