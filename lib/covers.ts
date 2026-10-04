// 포켓몬코리아 카드게임 "제품정보"(확장팩·구축덱·특별제품)의 한글판 패키지 이미지를 세트 대표 이미지로 쓴다.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { allSets, summarize } from "./cards";

const FILE = "data/covers.json";
const WEEK = 7 * 24 * 60 * 60 * 1000;
let mem: Promise<Record<string, string>> | null = null;

/** 「」 안 이름 → 패키지 이미지 URL */
export function covers() {
  mem ??= (async () => {
    try {
      const c = JSON.parse(await readFile(FILE, "utf8"));
      if (Date.now() - c.at < WEEK) return c.value;
    } catch {}
    const value: Record<string, string> = {};
    for (const tab of ["info1", "info2", "info3"]) {
      const html = await fetch(`https://pokemoncard.co.kr/card/category/${tab}`, {
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(20000),
      }).then((r) => (r.ok ? r.text() : ""));
      for (const [, src, alt] of html.matchAll(/<div class="white-panel-img"><img src="([^"]+)" alt="([^"]+)"/g)) {
        const key = alt.match(/「(.+)」/)?.[1] ?? alt;
        value[key] ??= src;
      }
    }
    await mkdir("data", { recursive: true });
    await writeFile(FILE, JSON.stringify({ at: Date.now(), value }));
    return value;
  })().catch((e) => {
    mem = null;
    throw e;
  });
  return mem;
}

/** 홈·도감 목록용 세트 요약 (패키지 이미지 포함) */
export async function summaries() {
  const packs = await covers().catch(() => ({}));
  return (await allSets()).map((s) => summarize(s, packs));
}
