import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 폰에서 cloudflared 터널 주소로 개발 서버를 열 수 있게 허용
  allowedDevOrigins: ["*.trycloudflare.com"],
};

export default nextConfig;
