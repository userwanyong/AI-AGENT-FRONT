import { API_CONFIG, getDefaultHeaders, parseResponseJsonSafely, stringifySafely } from '../config';

// 请求和响应接口定义
export interface AiClientQueryRequestDTO {
  id?: string;
  name?: string;
  status?: number;
  pageNum?: number;
  pageSize?: number;
}

// 新增客户端请求接口
export interface AiClientRequestDTO {
  id?: string;
  name: string;
  description?: string;
  status: number;
}

export interface AiClientResponseDTO {
  id: string;
  name: string;
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

// 添加分页响应接口
export interface PageResponse<T> {
  items: T;
  total: number;
  pageNum: number;
  pageSize: number;
}

export class AiClientAdminService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_CONFIG.BASE_DOMAIN}/api/v1/admin/client`;
  }

  /**
   * 查询客户端列表
   */
  async queryClientList(
    request: AiClientQueryRequestDTO
  ): Promise<ApiResponse<PageResponse<AiClientResponseDTO[]>>> {
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
   * 根据ID删除客户端
   */
  async deleteClientById(id: string): Promise<ApiResponse<boolean>> {
    const response = await fetch(`${this.baseUrl}/delete/${id}`, {
      method: 'DELETE',
      headers: {
        ...getDefaultHeaders(),
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * 创建客户端
   */
  async createClient(request: AiClientRequestDTO): Promise<ApiResponse<boolean>> {
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
   * 更新客户端信息（根据ID）
   */
  async updateClientById(request: AiClientRequestDTO): Promise<ApiResponse<boolean>> {
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
}

// 导出服务实例
export const aiClientAdminService = new AiClientAdminService();
