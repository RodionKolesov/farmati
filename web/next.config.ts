import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Скрыть индикатор Next.js Dev Tools (кружок «N») в режиме разработки.
  devIndicators: false,
  experimental: {
    // Разрешаем загрузку фото товаров до 10 МБ через server actions.
    serverActions: { bodySizeLimit: "10mb" },
  },
};

export default nextConfig;
