import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 폰에서 cloudflared 터널 주소로 개발 서버를 열 수 있게 허용
  allowedDevOrigins: ["*.trycloudflare.com"],
  // 한 번 본 페이지는 5분 동안 다시 받지 않는다 (뒤로 가기 때 뼈대 화면·이미지 깜빡임 방지)
  experimental: { staleTimes: { dynamic: 300, static: 300 } },
  images: {
    formats: ["image/webp"],
    imageSizes: [128, 256, 384],
    deviceSizes: [640],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      { protocol: "https", hostname: "cards.image.pokemonkorea.co.kr" },
      { protocol: "https", hostname: "data1.pokemonkorea.co.kr" },
    ],
  },
};

export default nextConfig;
