// 포켓몬코리아 카드 검색(pokemoncard.co.kr)에서 한글판 카드를 모아 data/cards.json에 저장한다.
// 상세 페이지 ID 규칙: BS{연도}{세트순번 3자리}{카드번호 3자리}. 사이트 부담을 줄이려고 1초에 한 장씩 받는다.
// 실행: npx tsx scripts/crawl-cards.ts [시작연도=2023] [끝연도=올해]
// 중간에 멈춰도 이미 받은 세트는 건너뛰고 이어서 받는다.
import { mkdir, readFile, writeFile } from "node:fs/promises";

export type Card = {
  id: string;
  setId: string;
  number: string; // "001/081"
  rarity: string;
  name: string;
  hp: number | null;
  kind: string; // 카드 종류
  illustrator: string;
  image: string;
};
export type CardSet = { id: string; name: string; year: number; symbol: string; cards: Card[] };

const FILE = "data/cards.json";
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const text = (s = "") => s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

export function parse(id: string, html: string): (Card & { setName: string; symbol: string }) | null {
  const image = html.match(/<img src="([^"?]+\/wmimages\/[^"?]+)[^"]*" class="feature_image"/)?.[1];
  if (!image) return null;
  const pnum = html.match(/<span class="p_num">([^<]*)<span[^>]*>([^<]*)<\/span>/);
  return {
    id,
    setId: id.slice(0, 9),
    number: text(pnum?.[1]),
    rarity: text(pnum?.[2]),
    name: text(html.match(/<span class="card-hp title">([\s\S]*?)<\/span>/)?.[1]),
    hp: Number(html.match(/<span class="hp_num">HP(\d+)/)?.[1]) || null,
    kind: text(html.match(/<div class="pokemon-info">\s*카드 종류 :([\s\S]*?)<\/div>/)?.[1]),
    illustrator: text(html.match(/<p class="illustrator">일러스트<br \/>([\s\S]*?)<\/p>/)?.[1]),
    image,
    setName: text(html.match(/class="search_href">([\s\S]*?)<\/a>/)?.[1]),
    symbol: html.match(/<img src="([^"]+\/images\/symbol\/[^"]+)"/)?.[1] ?? "",
  };
}

async function fetchCard(id: string) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(`https://pokemoncard.co.kr/cards/detail/${id}`, {
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(15000),
      });
      await wait(1000);
      if (res.status === 404) return null;
      if (res.ok) return parse(id, await res.text());
    } catch {}
    await wait(5000);
  }
  return null;
}

async function main() {
  const from = Number(process.argv[2]) || 2023;
  const to = Number(process.argv[3]) || new Date().getFullYear();
  let sets: CardSet[] = [];
  try {
    sets = JSON.parse(await readFile(FILE, "utf8"));
  } catch {}
  const done = new Set(sets.map((s) => s.id));
  await mkdir("data", { recursive: true });

  for (let year = from; year <= to; year++) {
    let missing = 0;
    for (let seq = 1; missing < 3; seq++) {
      const setId = `BS${year}${String(seq).padStart(3, "0")}`;
      if (done.has(setId)) continue;
      const first = await fetchCard(`${setId}001`);
      if (!first) {
        missing++;
        continue;
      }
      missing = 0;
      const cards: Card[] = [];
      let card: Awaited<ReturnType<typeof fetchCard>> = first;
      let gaps = 0;
      for (let n = 2; card || gaps < 3; n++) {
        if (card) {
          const { setName: _s, symbol: _y, ...c } = card;
          cards.push(c);
          gaps = 0;
        } else gaps++;
        card = await fetchCard(`${setId}${String(n).padStart(3, "0")}`);
      }
      sets.push({ id: setId, name: first.setName, year, symbol: first.symbol, cards });
      await writeFile(FILE, JSON.stringify(sets));
      console.log(`${setId} ${first.setName}: ${cards.length}장`);
    }
  }
}

if (process.argv[1]?.endsWith("crawl-cards.ts")) main();
