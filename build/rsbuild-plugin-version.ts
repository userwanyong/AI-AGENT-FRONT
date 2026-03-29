import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';
import type { RsbuildPlugin } from '@rsbuild/core';

/**
 * Rsbuild 版本注入插件
 *
 * 版本号来源（优先级从高到低）：
 * 1. 环境变量 VERSION（本地手动指定）
 * 2. package.json 的 version 字段（Vercel CI / 本地 fallback）
 * 3. 以上都没有或格式不对 → 终止构建
 *
 * 版本号格式: 主版本号.次版本号.修订号（如 0.2.0）
 *
 * 用法:
 *   方式一: VERSION=0.2.0 npm run build
 *   方式二: 修改 package.json 的 version 字段 → npm run build（Vercel 自动使用此方式）
 */

const SEMVER_REGEXP = /^\d+\.\d+\.\d+$/;

function resolveVersion(): string {
  // 1. 环境变量 VERSION 优先
  const envVersion = process.env.VERSION;
  if (envVersion) {
    if (!SEMVER_REGEXP.test(envVersion)) {
      console.error(
        `\n[plugin-version] 构建失败：VERSION 环境变量格式不正确！\n` +
        `当前值: "${envVersion}"\n` +
        `要求格式: 主版本号.次版本号.修订号（如 0.2.0）\n`
      );
      process.exit(1);
    }
    return envVersion;
  }

  // 2. 从 package.json 读取
  try {
    const pkgPath = join(process.cwd(), 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    const pkgVersion = pkg.version;
    if (pkgVersion && SEMVER_REGEXP.test(pkgVersion)) {
      return pkgVersion;
    }
    console.error(
      `\n[plugin-version] 构建失败：package.json 中 version 格式不正确！\n` +
      `当前值: "${pkgVersion}"\n` +
      `要求格式: 主版本号.次版本号.修订号（如 0.2.0）\n`
    );
    process.exit(1);
  } catch {
    // package.json 不存在或无法读取
  }

  // 3. 都没有 → 报错
  console.error(
    '\n[plugin-version] 构建失败：未找到版本号！\n' +
    '请通过以下任一方式指定版本号：\n' +
    '  方式一: 设置环境变量 VERSION=0.2.0 npm run build\n' +
    '  方式二: 修改 package.json 中的 version 字段\n'
  );
  process.exit(1);
}

export function pluginVersion(): RsbuildPlugin {
  const version = resolveVersion();

  return {
    name: 'plugin-version',
    setup(api) {
      api.modifyRsbuildConfig((config) => {
        config.source = config.source || {};
        config.source.define = {
          ...(config.source.define || {}),
          __APP_VERSION__: JSON.stringify(version),
          __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
        };
        return config;
      });

      api.onAfterBuild(() => {
        const outDir = api.context.distPath;
        const html = readFileSync(join(outDir, 'index.html'), 'utf-8');
        const hash = createHash('md5').update(html).digest('hex').slice(0, 12);

        const versionInfo = {
          version,
          buildTime: new Date().toISOString(),
          hash,
        };

        writeFileSync(
          join(outDir, 'version.json'),
          JSON.stringify(versionInfo, null, 2)
        );

        console.log(
          `[plugin-version] version.json generated: v${version} (${hash})`
        );
      });
    },
  };
}
