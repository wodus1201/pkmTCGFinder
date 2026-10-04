"use client";

import Link from "next/link";
import { useState } from "react";
import type { Card, CardSet } from "@/lib/cards";
import { useCollection } from "@/lib/collection";
import CardSheet, { Progress } from "../../card-sheet";

const FILTERS = ["전체", "보유", "미보유"] as const;

export default function SetView({ set }: { set: CardSet }) {
  const { owned, setCount } = useCollection();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("전체");
  const [open, setOpen] = useState<Card | null>(null);
  const have = set.cards.filter((c) => owned[c.id]).length;
  const cards = set.cards.filter((c) => (filter === "전체" ? true : filter === "보유" ? owned[c.id] : !owned[c.id]));

  return (
    <main className="px-5 pt-4">
      <Link href="/dex" className="text-2xl leading-none text-ink" aria-label="뒤로">
        ‹
      </Link>
      <div className="mt-2 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight">{set.name}</h1>
          <p className="mt-1 text-sm text-sub">
            <span className="font-semibold text-brand">{have}</span> / {set.cards.length}장
          </p>
        </div>
        {set.symbol && <img src={set.symbol} alt="" className="h-8" />}
      </div>
      <div className="mt-3">
        <Progress have={have} total={set.cards.length} />
      </div>

      <div className="mt-5 flex gap-4 border-b border-line text-sm">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`-mb-px pb-2 ${filter === f ? "border-b-2 border-ink font-bold" : "text-sub"}`}>
            {f}
          </button>
        ))}
      </div>

      <ul className="mt-4 grid grid-cols-3 gap-2.5 pb-6">
        {cards.map((c) => (
          <li key={c.id}>
            <button onClick={() => setOpen(c)} className="relative block w-full">
              <img
                src={`${c.image}?w=300`}
                alt={c.name}
                loading="lazy"
                className={`aspect-[63/88] w-full rounded-lg object-cover ${owned[c.id] ? "" : "opacity-35 grayscale"}`}
              />
              {owned[c.id] > 1 && (
                <span className="absolute right-1 top-1 rounded-full bg-brand px-1.5 text-[10px] font-bold text-white">×{owned[c.id]}</span>
              )}
              <span className="mt-1 block truncate text-left text-[11px] text-sub">
                {c.number.split("/")[0]} {c.name}
              </span>
            </button>
          </li>
        ))}
      </ul>

      {open && (
        <CardSheet card={open} setName={set.name} count={owned[open.id] ?? 0} onCount={(n) => setCount(open.id, n)} onClose={() => setOpen(null)} />
      )}
    </main>
  );
}
