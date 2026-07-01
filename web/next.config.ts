import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Скрыть индикатор Next.js Dev Tools (кружок «N») в режиме разработки.
  devIndicators: false,
  experimental: {
    // Разрешаем загрузку фото/PDF (в т.ч. с телефона) до 25 МБ через server actions.
    serverActions: { bodySizeLimit: "25mb" },
  },
};

export default nextConfig;
