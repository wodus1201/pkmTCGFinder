// 모아 둔 카드 이미지의 지문을 data/prints.json에 만든다. 이미 만든 카드는 건너뛴다.
// 실행: npx tsx scripts/hash-cards.ts   (카드를 새로 모은 뒤 다시 실행)
import { readFile, writeFile } from "node:fs/promises";
import type { CardSet } from "./crawl-cards";
import { fingerprint, type Print } from "../lib/fingerprint";

const FILE = "data/prints.json";

async function main() {
  const sets: CardSet[] = JSON.parse(await readFile("data/cards.json", "utf8"));
  let prints: Record<string, Print> = {};
  try {
    prints = JSON.parse(await readFile(FILE, "utf8"));
  } catch {}
  const todo = sets.flatMap((s) => s.cards).filter((c) => !prints[c.id]);
  console.log(`지문 만들 카드 ${todo.length}장`);

  for (let i = 0; i < todo.length; i += 4) {
    await Promise.all(
      todo.slice(i, i + 4).map(async (c) => {
        try {
          const res = await fetch(`${c.image}?w=300`, { signal: AbortSignal.timeout(15000) });
          if (res.ok) prints[c.id] = await fingerprint(Buffer.from(await res.arrayBuffer()));
        } catch {}
      }),
    );
    if (i % 100 === 0) {
      await writeFile(FILE, JSON.stringify(prints));
      console.log(`${Math.min(i + 4, todo.length)}/${todo.length}`);
    }
  }
  await writeFile(FILE, JSON.stringify(prints));
  console.log("완료", Object.keys(prints).length);
}

main();
