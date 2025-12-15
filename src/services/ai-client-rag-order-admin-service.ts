import {
  API_CONFIG,
  getDefaultHeaders,
  getUploadHeaders,
  parseResponseJsonSafely,
  stringifySafely,
} from '../config';

// 请求和响应接口定义
export interface AiClientRagOrderRequestDTO {
  id?: string;
  name?: string;
  tag?: string;
  status?: number;
}

export interface AiClientRagOrderQueryRequestDTO {
  id?: string;
  name?: string;
  tag?: string;
  status?: number;
  pageNum?: number;
  pageSize?: number;
}

export interface AiClientRagOrderResponseDTO {
  id: string;
  name: string;
  tag: string;
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

export class AiClientRagOrderAdminService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_CONFIG.BASE_DOMAIN}/api/v1/admin/rag`;
  }

  /**
   * 创建知识库配置
   */
  async createRagOrder(request: AiClientRagOrderRequestDTO): Promise<ApiResponse<boolean>> {
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
   * 根据ID删除知识库配置
   */
  async deleteRagOrderById(id: string): Promise<ApiResponse<boolean>> {
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
   * 分页查询知识库配置列表
   */
  async queryRagOrderList(
    request: AiClientRagOrderQueryRequestDTO
  ): Promise<ApiResponse<PageResponse<AiClientRagOrderResponseDTO[]>>> {
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

  /**
   * 上传知识库文件
   */
  async uploadRagFile(name: string, tag: string, files: File[]): Promise<ApiResponse<boolean>> {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('tag', tag);
    files.forEach((file) => {
      formData.append('files', file);
    });

    const response = await fetch(`${this.baseUrl}/file/upload`, {
      method: 'POST',
      headers: {
        ...getUploadHeaders(),
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await parseResponseJsonSafely(response);
  }
}

export const aiClientRagOrderAdminService = new AiClientRagOrderAdminService();
