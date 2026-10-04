"use client";

import { useEffect, useState } from "react";

// ponytail: 혼자 쓰는 앱이라 보유 카드는 이 기기 브라우저에만 저장한다. 기기를 바꾸려면 서버 저장으로 옮긴다.
const KEY = "collection";
type Collection = Record<string, number>; // 카드 ID → 보유 장수

function read(): Collection {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

/** 세트들의 카드별 원화 시세(일본판 유유테이 기준). */
export function usePrices(setIds: string[]) {
  const [prices, setPrices] = useState<Record<string, number>>({});
  const key = [...new Set(setIds)].sort().join(",");
  useEffect(() => {
    if (!key) return;
    fetch(`/api/prices?sets=${key}`)
      .then((r) => r.json())
      .then((d) => setPrices(d.prices ?? {}))
      .catch(() => {});
  }, [key]);
  return prices;
}

export const won = (n: number) => `${n.toLocaleString()}원`;

export function useCollection() {
  const [owned, setOwned] = useState<Collection>({});
  useEffect(() => {
    setOwned(read());
    const sync = () => setOwned(read());
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  function setCount(id: string, count: number) {
    const next = { ...read() };
    if (count > 0) next[id] = count;
    else delete next[id];
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
    setOwned(next);
  }

  return { owned, setCount };
}
