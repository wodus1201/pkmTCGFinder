"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { SetSummary } from "@/lib/cards";
import { useCollection } from "@/lib/collection";
import { Progress } from "../card-sheet";

export function ownedPerSet(owned: Record<string, number>) {
  const per: Record<string, number> = {};
  for (const id of Object.keys(owned)) per[id.slice(0, 9)] = (per[id.slice(0, 9)] ?? 0) + 1;
  return per;
}

export default function DexList({ sets }: { sets: SetSummary[] }) {
  const { owned } = useCollection();
  const per = useMemo(() => ownedPerSet(owned), [owned]);
  const [q, setQ] = useState("");
  const shown = sets.filter((s) => s.name.includes(q.trim()));
  const years = [...new Set(shown.map((s) => s.year))];

  return (
    <main className="px-5 pt-6">
      <h1 className="text-2xl font-extrabold tracking-tight">세트별 도감</h1>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="세트 이름 검색"
        className="mt-4 w-full rounded-xl bg-soft px-4 py-3 text-sm outline-none"
      />
      {sets.length === 0 && (
        <p className="mt-6 rounded-xl bg-soft p-4 text-sm text-sub">
          카드 데이터를 아직 모으는 중이에요. <code>npx tsx scripts/crawl-cards.ts</code>가 끝나면 세트가 나타나요.
        </p>
      )}
      {years.map((y) => (
        <section key={y} className="mt-6">
          <h2 className="text-sm font-semibold text-sub">{y}년</h2>
          <ul className="mt-2 divide-y divide-line">
            {shown
              .filter((s) => s.year === y)
              .map((s) => (
                <li key={s.id}>
                  <Link href={`/dex/${s.id}`} className="flex items-center gap-3 py-3">
                    <img src={`${s.cover}?w=120`} alt="" className="h-14 w-10 rounded object-cover" loading="lazy" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{s.name}</p>
                      <p className="text-xs text-sub">
                        {per[s.id] ?? 0}/{s.total}
                      </p>
                      <div className="mt-1">
                        <Progress have={per[s.id] ?? 0} total={s.total} />
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
