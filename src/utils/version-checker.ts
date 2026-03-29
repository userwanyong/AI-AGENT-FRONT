/**
 * 前端版本检测器
 * - 定时轮询 version.json 检测版本变化
 * - 监听页面可见性变化（切回标签页时立即检测）
 */

declare const __APP_VERSION__: string;
declare const __BUILD_TIME__: string;

export interface VersionInfo {
  version: string;
  buildTime: string;
  hash: string;
}

type OnUpdateCallback = (
  currentVersion: string,
  newVersion: VersionInfo
) => void;

class VersionChecker {
  private currentVersion: string;
  private timer: ReturnType<typeof setInterval> | null = null;
  private onUpdate: OnUpdateCallback;
  private interval: number;
  private isChecking = false;

  constructor(options: {
    interval?: number;
    onUpdate: OnUpdateCallback;
  }) {
    this.currentVersion = __APP_VERSION__;
    this.interval = options.interval ?? 10 * 60 * 1000;
    this.onUpdate = options.onUpdate;
  }

  init(): void {
    // 存储当前版本到 localStorage
    localStorage.setItem('app_version', this.currentVersion);

    // 启动定时轮询
    this.timer = setInterval(() => this.check(), this.interval);

    // 监听页面可见性变化：切回标签页时立即检测
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  private handleVisibilityChange = (): void => {
    if (!document.hidden) {
      this.check();
    }
  };

  async check(): Promise<void> {
    if (this.isChecking) return;
    this.isChecking = true;

    try {
      const res = await fetch(`/version.json?t=${Date.now()}`);
      if (!res.ok) return;

      const serverVersion: VersionInfo = await res.json();
      if (serverVersion.version !== this.currentVersion) {
        this.onUpdate(this.currentVersion, serverVersion);
        // 更新当前版本号，避免重复触发
        this.currentVersion = serverVersion.version;
      }
    } catch {
      // 静默失败，不影响用户体验
    } finally {
      this.isChecking = false;
    }
  }

  destroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  }
}

export default VersionChecker;

// 导出获取版本号的方法（避免直接 export 被 define 替换的全局常量）
export const getAppVersion = (): string => __APP_VERSION__;
export const getBuildTime = (): string => __BUILD_TIME__;
