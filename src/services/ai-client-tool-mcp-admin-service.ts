import {
  API_CONFIG,
  getDefaultHeaders,
  parseResponseJsonSafely,
  stringifySafely,
} from '../config/api';

// 请求和响应接口定义
export interface AiClientToolMcpRequestDTO {
  id?: string;
  name?: string;
  transportType?: string;
  transportConfig?: string;
  requestTimeout?: number;
  status?: number;
}

export interface AiClientToolMcpQueryRequestDTO {
  id?: string;
  name?: string;
  transportType?: string;
  status?: number;
  pageNum?: number;
  pageSize?: number;
}

export interface AiClientToolMcpResponseDTO {
  id?: string;
  name?: string;
  transportType?: string;
  transportConfig: string;
  requestTimeout?: number;
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

export class AiClientToolMcpAdminService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_CONFIG.BASE_DOMAIN}/api/v1/admin/tool`;
  }

  /**
   * 创建MCP客户端工具配置
   */
  async createAiClientToolMcp(request: AiClientToolMcpRequestDTO): Promise<ApiResponse<boolean>> {
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
   * 根据MCP ID更新MCP客户端工具配置
   */
  async updateAiClientToolMcpByMcpId(
    request: AiClientToolMcpRequestDTO
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
   * 根据ID删除MCP客户端工具配置
   */
  async deleteAiClientToolMcpById(id: string): Promise<ApiResponse<boolean>> {
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
   * 根据条件查询MCP客户端工具配置列表
   */
  async queryAiClientToolMcpList(
    request: AiClientToolMcpQueryRequestDTO
  ): Promise<ApiResponse<PageResponse<AiClientToolMcpResponseDTO[]>>> {
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
export const aiClientToolMcpAdminService = new AiClientToolMcpAdminService();
