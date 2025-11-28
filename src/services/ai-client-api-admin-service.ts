import { API_CONFIG, getDefaultHeaders } from '../config/api';

// 请求和响应接口定义
export interface AiClientApiQueryRequestDTO {
  id?: string;
  status?: number;
  pageNum?: number;
  pageSize?: number;
}

// AI客户端API请求接口
export interface AiClientApiRequestDTO {
  id?: string;
  baseUrl: string;
  apiKey?: string;
  completionsPath?: string;
  embeddingsPath?: string;
  status: number;
}

export interface AiClientApiResponseDTO {
  id: string;
  baseUrl: string;
  apiKey?: string;
  completionsPath?: string;
  embeddingsPath?: string;
  status: number;
  createTime: string;
  updateTime: string;
}

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

export class AiClientApiAdminService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_CONFIG.BASE_DOMAIN}/api/v1/admin/api`;
  }

  /**
   * 创建AI客户端API配置
   */
  async createAiClientApi(request: AiClientApiRequestDTO): Promise<ApiResponse<boolean>> {
    const response = await fetch(`${this.baseUrl}/create`, {
      method: 'POST',
      headers: {
        ...getDefaultHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * 根据ID更新AI客户端API配置
   */
  async updateAiClientApiById(request: AiClientApiRequestDTO): Promise<ApiResponse<boolean>> {
    const response = await fetch(`${this.baseUrl}/update`, {
      method: 'PUT',
      headers: {
        ...getDefaultHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * 根据ID删除AI客户端API配置
   */
  async deleteAiClientApiById(id: string): Promise<ApiResponse<boolean>> {
    const response = await fetch(`${this.baseUrl}/delete/${id}`, {
      method: 'DELETE',
      headers: getDefaultHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * 分页查询AI客户端API配置列表
   */
  async queryAiClientApiList(
    request: AiClientApiQueryRequestDTO
  ): Promise<ApiResponse<PageResponse<AiClientApiResponseDTO[]>>> {
    const response = await fetch(`${this.baseUrl}/query-all`, {
      method: 'POST',
      headers: {
        ...getDefaultHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * 查询可用api
   */
  async queryAiEnableClientApiList(): Promise<ApiResponse<AiClientApiResponseDTO[]>> {
    const response = await fetch(`${this.baseUrl}/query-enabled`, {
      method: 'Get',
      headers: {
        ...getDefaultHeaders(),
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }


}



export const aiClientApiAdminService = new AiClientApiAdminService();
