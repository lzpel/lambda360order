import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // GitHub Pagesへの静的エクスポート
  output: "export",
	basePath: process.env.NEXT_PUBLIC_REPO ? `/${process.env.NEXT_PUBLIC_REPO}` : undefined,
	assetPrefix: process.env.NEXT_PUBLIC_REPO ? `/${process.env.NEXT_PUBLIC_REPO}/` : undefined,
	env: {
		NEXT_PUBLIC_PREFIX: process.env.NEXT_PUBLIC_REPO ? `/${process.env.NEXT_PUBLIC_REPO}` : "",
	},
  // 画像最適化は静的エクスポートでは使用不可
  images: {
    unoptimized: true,
  },
  // TurbopackはWASM対応が不完全なため無効化（experimental.turboを削除）
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
      child_process: false,
      ws: false,
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
