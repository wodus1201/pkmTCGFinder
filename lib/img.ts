// 원본 카드 PNG(장당 수백 KB)를 Next.js 이미지 최적화로 WebP·필요한 크기로 줄여 받는다. 한 번 변환되면 서버에 캐시된다.
const SIZES = [128, 256, 384, 640];

export function img(src: string, width: number) {
  if (!src || src.startsWith("blob:")) return src;
  const w = SIZES.find((s) => s >= width) ?? 640;
  return `/_next/image?url=${encodeURIComponent(src)}&w=${w}&q=75`;
}
