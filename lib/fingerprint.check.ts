// 실행: npx tsx lib/fingerprint.check.ts  (scripts/hash-cards.ts를 먼저 실행해 둘 것)
// 카드 이미지를 "사진처럼" 망가뜨린 뒤(밝기·흐림·회전·여백) 원래 카드를 맞히는지 본다.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import sharp from "sharp";
import { closest, fingerprint, type Print } from "./fingerprint";

async function main() {
  const prints: Record<string, Print> = JSON.parse(await readFile("data/prints.json", "utf8"));
  const sets = JSON.parse(await readFile("data/cards.json", "utf8"));
  const cards = sets.flatMap((s: { cards: { id: string; image: string }[] }) => s.cards);
  const sample = cards.filter((_: unknown, i: number) => i % Math.ceil(cards.length / 30) === 0);

  let top1 = 0, top6 = 0;
  for (const c of sample) {
    const img = Buffer.from(await (await fetch(`${c.image}?w=512`)).arrayBuffer());
    const photo = await sharp(img)
      .rotate(4, { background: "#8a7a66" })
      .extend({ top: 18, bottom: 18, left: 14, right: 14, background: "#8a7a66" })
      .modulate({ brightness: 1.15, saturation: 0.9 })
      .blur(1.2)
      .jpeg({ quality: 70 })
      .toBuffer();
    const hits = closest(await fingerprint(photo, { photo: true }), prints);
    if (hits[0].id === c.id) top1++;
    if (hits.some((h) => h.id === c.id)) top6++;
  }
  console.log(`${sample.length}장 중 1순위 정답 ${top1}, 후보 6장 안 ${top6}`);
  assert.ok(top6 / sample.length >= 0.7, "후보 6장 안 정답률이 70% 미만");
}
main();
