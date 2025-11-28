/**
 * AI Agent 服务
 */
import {API_ENDPOINTS, getDefaultHeaders} from '../config';

export interface ArmoryAgentRequestDTO {
  agentId: string;
}

export interface ArmoryApiRequestDTO {
  apiId: string;
}


export interface ApiResponse<T> {
  code: string;
  msg: string;
  data: T;
}

export class AiAgentService {
  private static readonly BASE_URL = API_ENDPOINTS.AI_AGENT.BASE;

  /**
   * 装配智能体
   * @param agentId 智能体ID
   */
  static async armoryAgent(agentId: string): Promise<ApiResponse<void>> {
    try {
      const payload: ArmoryAgentRequestDTO = {
        agentId,
      };

      const response = await fetch(`${this.BASE_URL}${API_ENDPOINTS.AI_AGENT.ARMORY_AGENT}`, {
        method: 'POST',
        headers: getDefaultHeaders(),
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    } catch (error) {
      console.error('装配智能体失败:', error);
      throw error;
    }
  }

  /**
   * 对话
   */
  static async chat(agentId: string, message: string, sessionId: string, selectedMaxStep: number, input: string): Promise<Response> {
      const response = await fetch(`${this.BASE_URL}${API_ENDPOINTS.AI_AGENT.AUTO_AGENT}`, {
        method: 'POST',
        headers: getDefaultHeaders(),
        body: JSON.stringify({
          sessionId,
          userId: JSON.parse(localStorage.getItem('userInfo') || '{}')?.id || '',
          agentId,
          message,
          maxStep: selectedMaxStep,
          query: input
        })
      });
      
      if (!response.ok) {
        throw new Error('网络请求失败: ' + response.status);
      }

       // 处理流式响应
      if (!response.body) {
        throw new Error('响应流为空');
      }

      return response;
    }

}
