/**
 * AI客户端模型管理API服务
 */

import {
  API_ENDPOINTS,
  getDefaultHeaders,
  parseResponseJsonSafely,
  stringifySafely,
} from '../config';

// 定义请求数据类型
export interface AiClientModelRequestDTO {
  id?: string;
  chatApiId?: string;
  name?: string;
  type?: string;
  status?: number;
}

// 定义查询请求数据类型
export interface AiClientModelQueryRequestDTO {
  id?: string;
  chatApiId?: string;
  name?: string;
  type?: string;
  status?: number;
  pageNum?: number;
  pageSize?: number;
}

// 定义响应数据类型
export interface AiClientModelResponseDTO {
  id: string;
  chatApiId?: string;
  name: string;
  type?: string;
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

// 添加分页响应接口
export interface PageResponse<T> {
  items: T;
  total: number;
  pageNum: number;
  pageSize: number;
}

/**
 * AI客户端模型管理API服务类
 */
export class AiModelAdminService {
  private static readonly BASE_URL = API_ENDPOINTS.AI_CLIENT_MODEL.BASE;

  /**
   * 创建AI客户端模型配置
   */
  static async createAiClientModel(
    request: AiClientModelRequestDTO
  ): Promise<ApiResponse<boolean>> {
    try {
      const response = await fetch(`${this.BASE_URL}${API_ENDPOINTS.AI_CLIENT_MODEL.CREATE}`, {
        method: 'POST',
        headers: getDefaultHeaders(),
        body: stringifySafely(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await parseResponseJsonSafely(response);
    } catch (error) {
      console.error('创建AI客户端模型配置失败:', error);
      throw error;
    }
  }

  /**
   * 根据ID更新AI客户端模型配置
   */
  static async updateAiClientModelById(
    request: AiClientModelRequestDTO
  ): Promise<ApiResponse<boolean>> {
    try {
      const response = await fetch(`${this.BASE_URL}${API_ENDPOINTS.AI_CLIENT_MODEL.UPDATE}`, {
        method: 'PUT',
        headers: getDefaultHeaders(),
        body: stringifySafely(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await parseResponseJsonSafely(response);
    } catch (error) {
      console.error('根据ID更新AI客户端模型配置失败:', error);
      throw error;
    }
  }

  /**
   * 根据ID删除AI客户端模型配置
   */
  static async deleteAiClientModelById(id: string): Promise<ApiResponse<boolean>> {
    try {
      const response = await fetch(
        `${this.BASE_URL}${API_ENDPOINTS.AI_CLIENT_MODEL.DELETE}/${id}`,
        {
          method: 'DELETE',
          headers: getDefaultHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await parseResponseJsonSafely(response);
    } catch (error) {
      console.error('根据ID删除AI客户端模型配置失败:', error);
      throw error;
    }
  }

  /**
   * 根据条件查询AI客户端模型配置列表
   */
  static async queryAiClientModelList(
    request: AiClientModelQueryRequestDTO
  ): Promise<ApiResponse<PageResponse<AiClientModelResponseDTO[]>>> {
    try {
      const response = await fetch(`${this.BASE_URL}${API_ENDPOINTS.AI_CLIENT_MODEL.QUERY_ALL}`, {
        method: 'POST',
        headers: getDefaultHeaders(),
        body: stringifySafely(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await parseResponseJsonSafely(response);
    } catch (error) {
      console.error('根据条件查询AI客户端模型配置列表失败:', error);
      throw error;
    }
  }
}

// 导出服务实例
export const aiClientModelAdminService = AiModelAdminService;
