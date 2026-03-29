/**
 * 版本更新处理策略
 * - 根据版本变化程度采取不同策略
 * - major: 强制清除认证 + 重新登录
 * - minor: Modal 提示刷新
 * - patch: Toast 轻提示
 */

import { Modal, Toast } from '@douyinfe/semi-ui';
import VersionChecker, { getAppVersion, type VersionInfo } from './version-checker';

type VersionLevel = 'major' | 'minor' | 'patch';

/**
 * 判断版本变化程度
 */
function getVersionChangeLevel(
  oldVersion: string,
  newVersion: string
): VersionLevel {
  const oldParts = oldVersion.split('.').map(Number);
  const newParts = newVersion.split('.').map(Number);

  if (newParts[0] !== oldParts[0]) return 'major';
  if (newParts[1] !== oldParts[1]) return 'minor';
  return 'patch';
}

/**
 * 处理版本更新
 */
function handleVersionUpdate(
  currentVersion: string,
  newVersionInfo: VersionInfo
): void {
  const level = getVersionChangeLevel(currentVersion, newVersionInfo.version);

  switch (level) {
    case 'major':
      handleMajorUpdate(newVersionInfo);
      break;
    case 'minor':
      handleMinorUpdate(newVersionInfo);
      break;
    case 'patch':
      handlePatchUpdate(newVersionInfo);
      break;
  }
}

/**
 * 重大更新：清除认证数据 + 强制刷新
 */
function handleMajorUpdate(info: VersionInfo): void {
  Modal.warning({
    title: '发现重大版本更新',
    content: `检测到新版本 v${info.version}，为了您的账户安全，需要重新加载页面。`,
    okText: '立即刷新',
    maskClosable: false,
    closable: false,
    onOk: () => {
      clearAuthData();
      // 强制刷新（绕过缓存）
      window.location.reload();
    },
  });
}

/**
 * 一般更新：Modal 提示刷新
 */
function handleMinorUpdate(info: VersionInfo): void {
  Modal.info({
    title: '发现新版本',
    content: `检测到新版本 v${info.version}，建议刷新获取最新体验。`,
    okText: '立即刷新',
    cancelText: '稍后再说',
    maskClosable: true,
    onOk: () => {
      window.location.reload();
    },
  });
}

/**
 * 轻微更新：Toast 轻提示
 */
function handlePatchUpdate(info: VersionInfo): void {
  Toast.info({
    content: `已更新到 v${info.version}，点击刷新获取最新版本`,
    duration: 10,
    closable: true,
    onClick: () => {
      window.location.reload();
    },
  });
}

/**
 * 清除认证相关数据（保留用户偏好）
 */
function clearAuthData(): void {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('userInfo');
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('app_version');
}

/**
 * 启动后台版本轮询检测
 */
export function initVersionCheck(): void {
  // 开发环境不检测
  if (process.env.NODE_ENV === 'development') return;

  const checker = new VersionChecker({
    interval: 10 * 60 * 1000,
    onUpdate: handleVersionUpdate,
  });

  checker.init();
}

/**
 * 启动时检查认证数据与当前版本是否兼容
 * 解决"用户在 v1 登录后，v2 发布了登录变更"的问题
 */
export function checkAuthVersionCompatibility(): void {
  const storedVersion = localStorage.getItem('app_version');
  const currentVersion = getAppVersion();

  if (!storedVersion) {
    // 首次使用版本控制，记录当前版本
    localStorage.setItem('app_version', currentVersion);
    return;
  }

  if (storedVersion === currentVersion) return;

  const level = getVersionChangeLevel(storedVersion, currentVersion);

  if (level === 'major') {
    // 主版本变更 → 清除旧认证，强制重新登录
    clearAuthData();
  }

  // 更新版本记录
  localStorage.setItem('app_version', currentVersion);
}
