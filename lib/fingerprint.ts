// 무료 사진 인식: 카드 이미지마다 작은 "지문"(dHash + 일러스트 평균색)을 만들어 두고,
// 찍은 사진의 지문과 가장 가까운 카드를 고른다. 카드가 사진에 꽉 차게 찍혀야 잘 맞는다.
// ponytail: 해시 비교라 각도·반사에 약하다. 정확도가 부족하면 비전 API로 바꾼다.
import sharp, { type Sharp } from "sharp";

export type Print = { full: string; art: string; rgb: [number, number, number] };

// 카드(63×88) 안 일러스트 영역 비율
const ART = { left: 0.08, top: 0.11, width: 0.84, height: 0.4 };

async function dHash(img: Sharp): Promise<string> {
  const px = await img.grayscale().resize(9, 8, { fit: "fill" }).raw().toBuffer();
  let bits = "";
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) bits += px[y * 9 + x] < px[y * 9 + x + 1] ? "1" : "0";
  return BigInt("0b" + bits).toString(16).padStart(16, "0");
}

/** 카드 한 장이 화면을 채운 이미지에서 지문을 만든다. */
export async function fingerprint(input: Buffer, { photo = false } = {}): Promise<Print> {
  let img = sharp(input).rotate();
  // 사진은 카드 바깥 배경(책상 등)이 단색이면 잘라낸다.
  if (photo) img = sharp(await img.trim({ threshold: 30 }).toBuffer().catch(() => sharp(input).rotate().toBuffer()));
  const base = await img.resize(252, 352, { fit: "fill" }).removeAlpha().toBuffer();
  const art = { left: Math.round(252 * ART.left), top: Math.round(352 * ART.top), width: Math.round(252 * ART.width), height: Math.round(352 * ART.height) };
  const [full, artHash, mean] = await Promise.all([
    dHash(sharp(base)),
    dHash(sharp(base).extract(art)),
    sharp(base).extract(art).resize(1, 1).raw().toBuffer(),
  ]);
  return { full, art: artHash, rgb: [mean[0], mean[1], mean[2]] };
}

function hamming(a: string, b: string) {
  let n = 0;
  for (let i = 0; i < a.length; i++) {
    let x = parseInt(a[i], 16) ^ parseInt(b[i], 16);
    for (; x; x >>= 1) n += x & 1;
  }
  return n;
}

export function distance(a: Print, b: Print) {
  const color = Math.hypot(a.rgb[0] - b.rgb[0], a.rgb[1] - b.rgb[1], a.rgb[2] - b.rgb[2]);
  return hamming(a.full, b.full) + 1.5 * hamming(a.art, b.art) + color / 16;
}

export function closest(photo: Print, prints: Record<string, Print>, n = 6) {
  return Object.entries(prints)
    .map(([id, p]) => ({ id, d: distance(photo, p) }))
    .sort((x, y) => x.d - y.d)
    .slice(0, n);
}
