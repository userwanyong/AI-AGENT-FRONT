import { API_CONFIG, getDefaultHeaders } from '../config';

// 请求和响应接口定义
export interface AiClientAdvisorRequestDTO {
  id?: string;
  name?: string;
  type?: string;
  orderNum?: number;
  extParam?: string;
  status?: number;
}

export interface AiClientAdvisorQueryRequestDTO {
  id?: string;
  name?: string;
  type?: string;
  status?: number;
  pageNum?: number;
  pageSize?: number;
}

export interface AiClientAdvisorResponseDTO {
  id: string;
  name: string;
  type: string;
  orderNum?: number;
  extParam?: string;
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

export class AiAdvisorAdminService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_CONFIG.BASE_DOMAIN}/api/v1/admin/advisor`;
  }

  /**
   * 创建顾问配置
   */
  async createAdvisor(request: AiClientAdvisorRequestDTO): Promise<ApiResponse<boolean>> {
    const response = await fetch(`${this.baseUrl}/create`, {
      method: 'POST',
      headers: {
        ...getDefaultHeaders(),
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * 根据顾问ID更新顾问配置
   */
  async updateAdvisorById(request: AiClientAdvisorRequestDTO): Promise<ApiResponse<boolean>> {
    const response = await fetch(`${this.baseUrl}/update`, {
      method: 'PUT',
      headers: {
        ...getDefaultHeaders(),
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * 根据顾问ID删除顾问配置
   */
  async deleteAdvisorById(advisorId: string): Promise<ApiResponse<boolean>> {
    const response = await fetch(`${this.baseUrl}/delete/${advisorId}`, {
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
   * 根据条件查询顾问配置列表
   */
  async queryAdvisorList(
    request: AiClientAdvisorQueryRequestDTO
  ): Promise<ApiResponse<PageResponse<AiClientAdvisorResponseDTO[]>>> {
    const response = await fetch(`${this.baseUrl}/query-all`, {
      method: 'POST',
      headers: {
        ...getDefaultHeaders(),
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }
}

// 导出服务实例
export const aiClientAdvisorAdminService = new AiAdvisorAdminService();
