"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { SetSummary } from "@/lib/cards";
import { useCollection } from "@/lib/collection";

export function ownedPerSet(owned: Record<string, number>) {
  const per: Record<string, number> = {};
  for (const id of Object.keys(owned)) per[id.slice(0, 9)] = (per[id.slice(0, 9)] ?? 0) + 1;
  return per;
}

const chip = (on: boolean) => `shrink-0 rounded-full px-3.5 py-1.5 text-sm ${on ? "bg-soft font-bold text-ink" : "text-sub"}`;

export default function DexList({ sets }: { sets: SetSummary[] }) {
  const { owned } = useCollection();
  const per = useMemo(() => ownedPerSet(owned), [owned]);
  const [q, setQ] = useState("");
  const [series, setSeries] = useState("전체");
  const allSeries = [...new Set(sets.map((s) => s.series))];
  const words = q.trim().toLowerCase();
  const shown = sets.filter(
    (s) => (series === "전체" || s.series === series) && (!words || `${s.name} ${s.code}`.toLowerCase().includes(words)),
  );

  return (
    <main className="pt-5">
      <div className="px-5">
        <h1 className="text-2xl font-extrabold tracking-tight">한글판 세트별 도감</h1>
        <p className="mt-1 text-sm text-sub">시대별로 묶인 세트를 둘러보고, 세트마다 몇 장인지 확인해요.</p>
      </div>
      <div className="mt-4 flex gap-1 overflow-x-auto px-5">
        {["전체", ...allSeries].map((s) => (
          <button key={s} onClick={() => setSeries(s)} className={chip(series === s)}>
            {s}
          </button>
        ))}
      </div>
      <div className="mt-3 px-5">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="세트 이름·코드 검색"
          className="w-full rounded-xl border border-line px-4 py-3 text-sm outline-none focus:border-brand"
        />
      </div>
      {sets.length === 0 && (
        <p className="mx-5 mt-6 rounded-xl bg-soft p-4 text-sm text-sub">카드 데이터를 아직 모으는 중이에요. 잠시 후 다시 열어 주세요.</p>
      )}
      {allSeries
        .filter((s) => shown.some((x) => x.series === s))
        .map((s) => {
          const list = shown.filter((x) => x.series === s);
          return (
            <section key={s} className="mt-7 px-5">
              <div className="flex items-baseline justify-between">
                <h2 className="text-lg font-bold">{s}</h2>
                <span className="text-sm text-sub">{list.length}</span>
              </div>
              <ul className="mt-3 grid grid-cols-2 gap-3">
                {list.map((x) => (
                  <li key={x.id}>
                    <Link href={`/dex/${x.id}`} className="block overflow-hidden rounded-2xl border border-line">
                      <div className="flex h-28 items-center justify-center bg-soft">
                        <img src={`${x.cover}?w=160`} alt="" className="h-24 rounded shadow-sm" loading="lazy" />
                      </div>
                      <div className="p-3">
                        <p className="truncate font-bold">{x.short}</p>
                        <p className="text-xs text-sub">
                          {x.code} · {x.total}장
                        </p>
                        {per[x.id] ? (
                          <p className="mt-1 text-xs font-semibold text-brand">
                            {per[x.id]}/{x.total} 모음
                          </p>
                        ) : null}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      <div className="h-6" />
    </main>
  );
}
