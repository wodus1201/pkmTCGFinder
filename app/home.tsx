"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { SetSummary } from "@/lib/cards";
import { useCollection, usePrices, won } from "@/lib/collection";
import { Progress } from "./card-sheet";
import { ownedPerSet } from "./dex/dex-list";

export default function Home({ sets }: { sets: SetSummary[] }) {
  const { owned } = useCollection();
  const per = useMemo(() => ownedPerSet(owned), [owned]);
  const total = Object.values(owned).reduce((a, b) => a + b, 0);
  const kinds = Object.keys(owned).length;
  const started = sets.filter((s) => per[s.id]).sort((a, b) => per[b.id] / b.total - per[a.id] / a.total);
  const fresh = sets.slice(0, 4);
  const prices = usePrices(started.map((s) => s.id));
  const value = Object.entries(owned).reduce((sum, [id, n]) => sum + n * (prices[id] ?? 0), 0);

  return (
    <main className="px-5 pt-5">
      <header className="flex items-center justify-between">
        <span className="text-2xl font-black italic tracking-tight text-brand">포카파인더</span>
        <Link href="/scan" aria-label="카드 찾기" className="text-ink">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-6" aria-hidden>
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
        </Link>
      </header>

      <section className="mt-4 rounded-3xl bg-soft p-5">
        <p className="text-sm text-sub">내 카드 가치</p>
        <p className="mt-1 text-3xl font-extrabold tracking-tight">{won(value)}</p>
        <p className="mt-1 text-sm text-sub">
          {total.toLocaleString()}장 · {kinds}종 · 세트 {started.length}개 수집 중
        </p>
        <p className="mt-2 text-xs text-sub">일본판 유유테이 판매가를 오늘 환율로 환산한 값이에요.</p>
      </section>

      <section className="mt-6">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-bold">채우는 중인 세트</h2>
          <Link href="/dex" className="text-sm text-sub">
            전체 보기
          </Link>
        </div>
        {started.length === 0 ? (
          <p className="mt-2 rounded-xl bg-soft p-4 text-sm text-sub">도감에서 가진 카드를 체크하면 여기에 진행률이 보여요.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {started.slice(0, 6).map((s) => (
              <SetRow key={s.id} set={s} have={per[s.id]} />
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6 pb-6">
        <h2 className="text-lg font-bold">최신 세트</h2>
        <ul className="mt-2 space-y-2">
          {fresh.map((s) => (
            <SetRow key={s.id} set={s} have={per[s.id] ?? 0} />
          ))}
        </ul>
      </section>
    </main>
  );
}

function SetRow({ set, have }: { set: SetSummary; have: number }) {
  return (
    <li>
      <Link href={`/dex/${set.id}`} className="flex items-center gap-3 rounded-2xl border border-line p-3">
        <img src={`${set.cover}?w=120`} alt="" className="h-14 w-10 rounded object-cover" loading="lazy" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{set.name}</p>
          <p className="text-xs text-sub">
            {have}/{set.total}
          </p>
          <div className="mt-1">
            <Progress have={have} total={set.total} />
          </div>
        </div>
        <span className="rounded-lg bg-soft px-2.5 py-1.5 text-xs font-semibold">채우기</span>
      </Link>
    </li>
  );
}
