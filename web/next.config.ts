import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Скрыть индикатор Next.js Dev Tools (кружок «N») в режиме разработки.
  devIndicators: false,
  experimental: {
    // Разрешаем загрузку фото/PDF (в т.ч. с телефона) до 25 МБ через server actions.
    // allowedOrigins — чтобы server actions не отклонялись при заходе по www/IP или
    // когда прокси не передаёт Origin (иначе на части устройств — ошибка сервера).
    serverActions: {
      bodySizeLimit: "25mb",
      allowedOrigins: ["farmati.ru", "www.farmati.ru", "194.226.163.20"],
    },
  },
};

export default nextConfig;
