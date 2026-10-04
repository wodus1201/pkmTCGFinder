// 일본 카드샵 유유테이(yuyu-tei.jp)의 일본판 싱글카드 판매가를 한글판 카드에 붙인다.
// 한글판은 일본판과 세트 코드·카드 번호가 같아서(이미지 경로의 SV9, M5 등) 번호로 매칭한다.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import type { CardSet } from "./cards";

const HALF_DAY = 12 * 60 * 60 * 1000;

async function cached<T>(file: string, load: () => Promise<T>): Promise<T> {
  try {
    const c = JSON.parse(await readFile(file, "utf8"));
    if (Date.now() - c.at < HALF_DAY) return c.value;
  } catch {}
  const value = await load();
  await mkdir("data/prices", { recursive: true });
  await writeFile(file, JSON.stringify({ at: Date.now(), value }));
  return value;
}

/** 이미지 경로의 세트 코드(SV9, SV11B, M5)를 유유테이 주소 코드(sv09, sv11b, m05)로 바꾼다. */
export function yuyuteiCode(image: string): string | null {
  const code = image.match(/wmimages\/[^/]+\/([^/]+)\//)?.[1];
  const m = code?.match(/^([A-Za-z]+)(\d+)([A-Za-z]*)$/);
  return m ? `${m[1]}${m[2].padStart(2, "0")}${m[3]}`.toLowerCase() : null;
}

/** 카드 번호("130/100") → 엔화 최저 판매가. 같은 번호에 여러 버전이 있으면 가장 싼 값. */
export function parseYuyutei(html: string): Record<string, number> {
  const prices: Record<string, number> = {};
  for (const block of html.split("card-product position-relative").slice(1)) {
    const t = block.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
    const m = t.match(/(\d{3}\/\d{3})\s.*?([\d,]+) 円/);
    if (!m) continue;
    const yen = Number(m[2].replace(/,/g, ""));
    if (!(m[1] in prices) || yen < prices[m[1]]) prices[m[1]] = yen;
  }
  return prices;
}

function jpPrices(code: string) {
  return cached(`data/prices/${code}.json`, async () => {
    const res = await fetch(`https://yuyu-tei.jp/sell/poc/s/${code}`, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(20000),
    });
    return res.ok ? parseYuyutei(await res.text()) : {};
  });
}

export function yenToWon() {
  return cached("data/prices/jpy-krw.json", async () => {
    const d = await fetch("https://open.er-api.com/v6/latest/JPY", { signal: AbortSignal.timeout(10000) }).then((r) => r.json());
    return Number(d.rates?.KRW) || 9;
  });
}

/** 세트의 카드 ID → 원화 가격. 일본판에 대응하는 세트가 없으면 빈 객체. */
export async function setPrices(set: CardSet): Promise<Record<string, number>> {
  const code = set.cards[0] && yuyuteiCode(set.cards[0].image);
  if (!code) return {};
  const [yen, rate] = await Promise.all([jpPrices(code), yenToWon()]);
  const out: Record<string, number> = {};
  for (const c of set.cards) {
    const p = yen[c.number];
    if (p) out[c.id] = Math.round((p * rate) / 10) * 10;
  }
  return out;
}
