"use client";

import { useEffect, useState } from "react";

// 보유 카드는 카카오 계정별로 서버(/api/collection)에 저장하고, 브라우저에는 빨리 그리기 위한 사본만 둔다.
// 로그인 전에는 브라우저에만 임시로 두었다가, 로그인하면 계정으로 합친다.
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

/** 로그인 상태. /api/me 결과를 탭 사이에 한 번만 받아 공유한다. */
export type Me = { id: string; name: string; image: string } | null;
let meOnce: Promise<{ user: Me; kakao: boolean }> | null = null;
export function fetchMe(fresh = false) {
  if (fresh || !meOnce) meOnce = fetch("/api/me").then((r) => r.json()).catch(() => ({ user: null, kakao: false }));
  return meOnce;
}
export function useMe() {
  const [state, setState] = useState<{ user: Me; kakao: boolean; ready: boolean }>({ user: null, kakao: false, ready: false });
  useEffect(() => {
    fetchMe().then((d) => setState({ ...d, ready: true }));
  }, []);
  return state;
}

export async function logout() {
  await fetch("/api/auth/logout", { method: "POST" });
  try {
    localStorage.removeItem(KEY);
  } catch {}
  location.href = "/";
}

export function loginUrl() {
  return `/api/auth/kakao?next=${encodeURIComponent(location.pathname)}`;
}

export function useCollection() {
  const [owned, setOwned] = useState<Collection>({});
  const [loggedIn, setLoggedIn] = useState(false);
  useEffect(() => {
    setOwned(read());
    (async () => {
      const r = await fetch("/api/collection");
      if (r.status === 401) return; // 로그인 전: 이 브라우저에만 임시 저장
      setLoggedIn(true);
      let server: Collection = (await r.json()).owned;
      // 로그인 전에 이 브라우저에서 체크한 카드가 서버에 없으면 계정으로 합친다.
      const local = read();
      if (Object.keys(local).some((id) => !(id in server))) {
        server = (
          await fetch("/api/collection", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ all: local }) }).then((x) => x.json())
        ).owned;
      }
      save(server);
    })().catch(() => {});
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
    if (loggedIn) fetch("/api/collection", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, count }) }).catch(() => {});
  }

  return { owned, setCount, loggedIn };
}
