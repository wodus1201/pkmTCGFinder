import { readFile, stat } from "node:fs/promises";
import type { Card, CardSet } from "@/scripts/crawl-cards";

export type { Card, CardSet };
export type SetSummary = Omit<CardSet, "cards"> & { total: number; cover: string; pack: string; series: string; code: string; short: string };

const SERIES: Record<string, string> = { MEGA: "메가진화", SV: "스칼렛&바이올렛", S: "소드&실드", SM: "썬&문" };

/** 이미지 경로(.../wmimages/SV/SV9/...)에서 시리즈와 세트 코드를 읽는다. */
export function setMeta(s: CardSet) {
  const [, folder = "", code = ""] = s.cards[0]?.image.match(/wmimages\/([^/]+)\/([^/]+)\//) ?? [];
  return {
    series: SERIES[folder] ?? folder,
    code,
    short: s.name.match(/「(.+)」/)?.[1] ?? s.name, // "스칼렛&바이올렛 확장팩 「배틀파트너즈」" → "배틀파트너즈"
  };
}

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

const SHOWY = ["MUR", "UR", "SAR", "SR", "AR", "RR"];
/** 세트를 대표할 카드: 가장 화려한 레어도의 첫 카드 */
const showcase = (s: CardSet) =>
  (SHOWY.map((r) => s.cards.find((c) => c.rarity === r)).find(Boolean) ?? s.cards[0])?.image ?? "";

/** packs: lib/covers.ts의 「이름」 → 한글판 패키지 이미지 */
export function summarize(s: CardSet, packs: Record<string, string> = {}): SetSummary {
  const meta = setMeta(s);
  return { id: s.id, name: s.name, year: s.year, symbol: s.symbol, total: s.cards.length, cover: showcase(s), pack: packs[meta.short] ?? "", ...meta };
}

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
