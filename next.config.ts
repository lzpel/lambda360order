import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js 16ではTurbopackがデフォルト。webpackカスタム設定と併用するため空のturbopack設定を追加
  turbopack: {},
  webpack: (config) => {
    // OpenCascade.js docs: Webpack5(=Next.js) では fallback に fs 等を false
    config.resolve.fallback = {
      ...(config.resolve.fallback || {}),
      fs: false,
      perf_hooks: false,
      os: false,
      worker_threads: false,
      crypto: false,
      stream: false,
      path: false,
    };

    // .wasm を URL(=asset) として扱う
    config.module.rules.push({
      test: /\.wasm$/,
      type: "asset/resource",
    });

    return config;
  },
};

export default nextConfig;
