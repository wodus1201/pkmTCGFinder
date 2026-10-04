"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Card, SetSummary } from "@/lib/cards";
import { loginUrl, useCollection, useMe, usePrices, won } from "@/lib/collection";
import { ownedPerSet } from "./dex/dex-list";
import { img } from "@/lib/img";

type Owned = Card & { setName: string };

export default function Home({ sets }: { sets: SetSummary[] }) {
  const { owned } = useCollection();
  const me = useMe();
  const per = useMemo(() => ownedPerSet(owned), [owned]);
  const ids = Object.keys(owned);
  const total = Object.values(owned).reduce((a, b) => a + b, 0);
  const started = sets.filter((s) => per[s.id]).sort((a, b) => per[b.id] / b.total - per[a.id] / a.total);
  const prices = usePrices(started.map((s) => s.id));
  const value = ids.reduce((sum, id) => sum + owned[id] * (prices[id] ?? 0), 0);

  const [cards, setCards] = useState<Owned[]>([]);
  const idKey = ids.sort().join(",");
  useEffect(() => {
    if (!idKey) return setCards([]);
    fetch(`/api/cards/search?ids=${idKey}`)
      .then((r) => r.json())
      .then((d) => setCards(d.cards));
  }, [idKey]);
  const top = [...cards].sort((a, b) => (prices[b.id] ?? 0) - (prices[a.id] ?? 0)).slice(0, 3);
  const suggest = sets.filter((s) => !per[s.id]).slice(0, Math.max(0, 4 - started.length));

  return (
    <main className="space-y-3 bg-soft px-4 py-4">
      {me.ready && !me.user && (
        <section className="flex items-center justify-between gap-3 rounded-3xl bg-white p-5">
          <p className="text-[14px] text-ink2">
            <b className="text-ink">카카오로 로그인</b>하면 내 도감이 계정에 저장돼서 어디서든 그대로 볼 수 있어요.
          </p>
          <a href="/api/auth/kakao" onClick={(e) => (e.currentTarget.href = loginUrl())} className="shrink-0 rounded-xl bg-[#FEE500] px-4 py-2.5 text-[14px] font-bold text-[#191919]">
            로그인
          </a>
        </section>
      )}
      <section className="rounded-3xl bg-white p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[15px] font-semibold text-ink2">내 카드 가치</p>
            <p className="mt-1 text-[28px] font-extrabold tracking-tight">{won(value)}</p>
            <p className="text-[13px] text-sub">
              {total.toLocaleString()}장 · {ids.length}종
            </p>
          </div>
          <Link href="/dex" className="rounded-lg bg-soft px-3 py-2 text-[13px] font-semibold text-ink2">
            전체 보기
          </Link>
        </div>
        {top.length > 0 ? (
          <>
            <p className="mt-5 text-[13px] text-sub">가치 순</p>
            <ul className="mt-2 space-y-3">
              {top.map((c) => (
                <li key={c.id}>
                  <Link href={`/dex/${c.setId}/${c.id}`} transitionTypes={["nav-forward"]} className="flex items-center gap-3">
                    <img src={img(c.image, 120)} alt="" className="h-14 w-10 rounded object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-bold">
                        {c.name} <span className="text-brand">한글판</span>
                      </p>
                      <p className="truncate text-[13px] text-sub">
                        {owned[c.id]}장 · {c.setName}
                      </p>
                    </div>
                    <span className="text-[15px] font-bold">{prices[c.id] ? won(prices[c.id] * owned[c.id]) : "-"}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="mt-4 rounded-xl bg-soft p-4 text-[13px] text-sub">도감에서 가진 카드를 채우거나 가운데 스캔 버튼으로 카드를 찍어 보세요.</p>
        )}
      </section>

      {[...started, ...suggest].map((s) => {
        const have = per[s.id] ?? 0;
        const pct = Math.round((have / s.total) * 100);
        return (
          <Link key={s.id} href={`/dex/${s.id}`} transitionTypes={["nav-forward"]} className="flex items-center gap-3 rounded-3xl bg-white p-4">
            <img src={img(s.pack || s.cover, 128)} alt="" className="h-14 w-10 rounded object-contain" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-bold">{s.short}</p>
              <p className="text-[13px] text-sub">
                {have}/{s.total}
              </p>
              <div className="mt-1.5 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-soft">
                  <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-[12px] font-bold text-brand">{pct}%</span>
              </div>
            </div>
            <span className="rounded-lg border border-line px-3 py-2 text-[13px] font-semibold">채우기</span>
          </Link>
        );
      })}
    </main>
  );
}
