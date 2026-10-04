import { readFile, stat } from "node:fs/promises";
import type { Card, CardSet } from "@/scripts/crawl-cards";

export type { Card, CardSet };
export type SetSummary = Omit<CardSet, "cards"> & { total: number; cover: string };

const FILE = "data/cards.json";
let cache: { mtime: number; sets: CardSet[] } | null = null;

/** scripts/crawl-cards.ts가 모은 카드. 수집 중에도 파일이 바뀌면 다시 읽는다. */
export async function allSets(): Promise<CardSet[]> {
  try {
    const { mtimeMs } = await stat(FILE);
    if (cache?.mtime !== mtimeMs) {
      const sets: CardSet[] = JSON.parse(await readFile(FILE, "utf8"));
      sets.sort((a, b) => b.id.localeCompare(a.id)); // 최신 세트 먼저
      cache = { mtime: mtimeMs, sets };
    }
    return cache.sets;
  } catch {
    return [];
  }
}

export const summarize = (s: CardSet): SetSummary => ({
  id: s.id,
  name: s.name,
  year: s.year,
  symbol: s.symbol,
  total: s.cards.length,
  cover: s.cards[0]?.image ?? "",
});

export const thumb = (image: string, w = 300) => `${image}?w=${w}`;

/** 이름, 번호(001 또는 001/081), 세트 이름으로 찾는다. */
export function search(sets: CardSet[], q: string, limit = 60) {
  const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const out: (Card & { setName: string })[] = [];
  for (const s of sets) {
    for (const c of s.cards) {
      const hay = `${c.name} ${c.number} ${c.rarity} ${s.name} ${c.illustrator}`.toLowerCase();
      if (words.every((w) => hay.includes(w))) out.push({ ...c, setName: s.name });
      if (out.length >= limit) return out;
    }
  }
  return out;
}
