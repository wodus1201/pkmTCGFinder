"use client";

import { useEffect, useState } from "react";

// 보유 카드는 서버(/api/collection)가 원본이고, 브라우저에는 빨리 그리기 위한 사본만 둔다.
// 그래서 접속 주소가 바뀌어 브라우저 저장소가 비어도 서버에서 다시 받아온다.
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
    const local = read();
    // 서버 것을 받아오되, 예전에 이 브라우저에만 저장해 둔 카드가 있으면 서버로 합친다.
    const body = Object.keys(local).length ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ all: local }) } : undefined;
    fetch("/api/collection", body)
      .then((r) => r.json())
      .then((d) => save(d.owned))
      .catch(() => {});
    const sync = () => setOwned(read());
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  function save(next: Collection) {
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
    setOwned(next);
  }

  function setCount(id: string, count: number) {
    const next = { ...read() };
    if (count > 0) next[id] = count;
    else delete next[id];
    save(next);
    fetch("/api/collection", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, count }) }).catch(() => {});
  }

  return { owned, setCount };
}
