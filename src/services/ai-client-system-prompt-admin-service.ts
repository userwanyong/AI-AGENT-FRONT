import { API_CONFIG, getDefaultHeaders, parseResponseJsonSafely, stringifySafely } from '../config';

// 请求和响应接口定义
export interface AiClientSystemPromptRequestDTO {
  id?: string;
  name?: string;
  content?: string;
  description?: string;
  status?: number;
}

export interface AiClientSystemPromptQueryRequestDTO {
  id?: string;
  name?: string;
  status?: number;
  pageNum?: number;
  pageSize?: number;
}

export interface AiClientSystemPromptResponseDTO {
  id: string;
  name: string;
  content: string;
  description?: string;
  status: number;
  createTime: string;
  updateTime: string;
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

export class AiClientSystemPromptAdminService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_CONFIG.BASE_DOMAIN}/api/v1/admin/prompt`;
  }

  /**
   * 创建系统提示词配置
   */
  async createSystemPrompt(request: AiClientSystemPromptRequestDTO): Promise<ApiResponse<boolean>> {
    const response = await fetch(`${this.baseUrl}/create`, {
      method: 'POST',
      headers: {
        ...getDefaultHeaders(),
      },
      body: stringifySafely(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await parseResponseJsonSafely(response);
  }

  /**
   * 根据ID更新系统提示词配置
   */
  async updateSystemPromptById(
    request: AiClientSystemPromptRequestDTO
  ): Promise<ApiResponse<boolean>> {
    const response = await fetch(`${this.baseUrl}/update`, {
      method: 'PUT',
      headers: {
        ...getDefaultHeaders(),
      },
      body: stringifySafely(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await parseResponseJsonSafely(response);
  }

  /**
   * 根据ID删除系统提示词配置
   */
  async deleteSystemPromptById(id: string): Promise<ApiResponse<boolean>> {
    const response = await fetch(`${this.baseUrl}/delete/${id}`, {
      method: 'DELETE',
      headers: {
        ...getDefaultHeaders(),
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await parseResponseJsonSafely(response);
  }

  /**
   * 根据条件查询系统提示词配置列表
   */
  async querySystemPromptList(
    request: AiClientSystemPromptQueryRequestDTO
  ): Promise<ApiResponse<PageResponse<AiClientSystemPromptResponseDTO[]>>> {
    const response = await fetch(`${this.baseUrl}/query-all`, {
      method: 'POST',
      headers: {
        ...getDefaultHeaders(),
      },
      body: stringifySafely(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await parseResponseJsonSafely(response);
  }
}

// 导出服务实例
export const aiClientSystemPromptAdminService = new AiClientSystemPromptAdminService();
