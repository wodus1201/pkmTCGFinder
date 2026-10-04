"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { SetSummary } from "@/lib/cards";
import { useCollection } from "@/lib/collection";
import { Chips, Search } from "../ui";

export function ownedPerSet(owned: Record<string, number>) {
  const per: Record<string, number> = {};
  for (const id of Object.keys(owned)) per[id.slice(0, 9)] = (per[id.slice(0, 9)] ?? 0) + 1;
  return per;
}

export default function DexList({ sets }: { sets: SetSummary[] }) {
  const { owned } = useCollection();
  const per = useMemo(() => ownedPerSet(owned), [owned]);
  const [q, setQ] = useState("");
  const allSeries = [...new Set(sets.map((s) => s.series))];
  const [series, setSeries] = useState("전체");
  const words = q.trim().toLowerCase();
  const shown = sets.filter(
    (s) => (series === "전체" || s.series === series) && (!words || `${s.name} ${s.code}`.toLowerCase().includes(words)),
  );

  return (
    <main className="px-5 pt-5">
      <h1 className="text-[22px] font-bold">한글판 세트별 도감</h1>
      <p className="mt-1 text-[15px] text-ink2">시대별로 묶인 세트를 둘러보고, 세트마다 몇 장인지 확인해요.</p>
      <div className="mt-4">
        <Chips items={["전체", ...allSeries]} value={series} onChange={setSeries} />
      </div>
      <div className="mt-3">
        <Search value={q} onChange={setQ} placeholder="세트 이름·코드 검색" />
      </div>
      {sets.length === 0 && <p className="mt-6 rounded-xl bg-soft p-4 text-sm text-sub">카드 데이터를 아직 모으는 중이에요. 잠시 후 다시 열어 주세요.</p>}
      {allSeries
        .filter((s) => shown.some((x) => x.series === s))
        .map((s) => {
          const list = shown.filter((x) => x.series === s);
          return (
            <section key={s} className="mt-8">
              <div className="flex items-baseline justify-between">
                <h2 className="text-[17px] font-bold">{s}</h2>
                <span className="text-sm text-sub">{list.length}</span>
              </div>
              <ul className="mt-3 grid grid-cols-2 gap-3">
                {list.map((x) => (
                  <li key={x.id}>
                    <Link href={`/dex/${x.id}`} className="block overflow-hidden rounded-xl border border-line">
                      <div className="flex h-36 items-center justify-center overflow-hidden px-3 py-2">
                        {x.pack ? (
                          <img src={x.pack} alt="" className="max-h-full max-w-full object-contain" loading="lazy" />
                        ) : (
                          <img src={`${x.cover}?w=200`} alt="" className="h-full rounded-md object-contain" loading="lazy" />
                        )}
                      </div>
                      <div className="border-t border-line bg-soft px-4 py-3">
                        <p className="truncate text-[16px] font-bold">{x.short}</p>
                        <p className="text-[13px] text-sub">
                          {x.code} · {x.total}장{per[x.id] ? <span className="font-semibold text-brand"> · {per[x.id]}장 모음</span> : null}
                        </p>
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
