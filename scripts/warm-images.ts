// 서버가 켜진 상태에서 모든 카드 썸네일과 팩 이미지를 미리 WebP로 변환해 캐시에 넣는다.
// 실행: npx tsx scripts/warm-images.ts [서버주소=http://localhost:3000]
import { readFile } from "node:fs/promises";
import type { CardSet } from "./crawl-cards";

const base = process.argv[2] || "http://localhost:3000";

async function main() {
  const sets: CardSet[] = JSON.parse(await readFile("data/cards.json", "utf8"));
  let packs: string[] = [];
  try {
    packs = Object.values(JSON.parse(await readFile("data/covers.json", "utf8")).value);
  } catch {}
  const jobs = [...sets.flatMap((s) => s.cards.map((c) => [c.image, 256] as const)), ...packs.map((p) => [p, 384] as const)];
  let done = 0;
  for (let i = 0; i < jobs.length; i += 6) {
    await Promise.all(
      jobs.slice(i, i + 6).map(([src, w]) =>
        fetch(`${base}/_next/image?url=${encodeURIComponent(src)}&w=${w}&q=75`, { headers: { Accept: "image/webp" } })
          .then((r) => r.arrayBuffer())
          .catch(() => null),
      ),
    );
    done += Math.min(6, jobs.length - i);
    if (done % 300 < 6) console.log(`${done}/${jobs.length}`);
  }
  console.log("완료", jobs.length);
}

main();
