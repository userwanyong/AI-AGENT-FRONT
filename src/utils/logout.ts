import { UserService } from '../services';

/**
 * 统一登出：调用后端登出（拉黑访问令牌 + 失效刷新令牌）并清理本地登录态
 */
export const logoutAndRedirect = async (): Promise<void> => {
  try {
    await UserService.logout();
  } catch {
    // 网络失败也要继续清理本地登录态
  }
  try {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userInfo');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('chatHistory');
  } catch (e) {
    console.error(e);
  }
  window.location.href = '/login';
};
