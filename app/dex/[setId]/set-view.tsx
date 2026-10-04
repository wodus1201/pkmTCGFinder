"use client";

import Link from "next/link";
import { useState } from "react";
import type { CardSet } from "@/lib/cards";
import { useCollection, usePrices, won } from "@/lib/collection";
import { Progress } from "../../card-sheet";

const RARITY_ORDER = ["C", "U", "R", "RR", "RRR", "AR", "SR", "SAR", "UR", "MUR", "ACE", "PR"];

export default function SetView({ set, meta }: { set: CardSet; meta: { series: string; code: string; short: string } }) {
  const { owned } = useCollection();
  const prices = usePrices([set.id]);
  const rarities = [...new Set(set.cards.map((c) => c.rarity).filter(Boolean))].sort(
    (a, b) => (RARITY_ORDER.indexOf(a) + 99) % 99 - ((RARITY_ORDER.indexOf(b) + 99) % 99),
  );
  const [rarity, setRarity] = useState("전체");
  const [mine, setMine] = useState<"전체" | "보유" | "미보유">("전체");
  const have = set.cards.filter((c) => owned[c.id]).length;
  const value = set.cards.reduce((sum, c) => sum + (owned[c.id] ?? 0) * (prices[c.id] ?? 0), 0);
  const cards = set.cards.filter(
    (c) => (rarity === "전체" || c.rarity === rarity) && (mine === "전체" || (mine === "보유" ? owned[c.id] : !owned[c.id])),
  );

  return (
    <main className="pt-4">
      <div className="px-5">
        <Link href="/dex" className="text-2xl leading-none" aria-label="뒤로">
          ‹
        </Link>
        <div className="mt-2 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">{meta.short}</h1>
            <p className="mt-1 text-sm text-sub">
              {meta.series} · {meta.code} · {set.cards.length}장 · {set.year}년 · 한글판
            </p>
          </div>
          {set.symbol && <img src={set.symbol} alt="" className="h-8" />}
        </div>
        <div className="mt-4 rounded-2xl bg-soft p-4">
          <div className="flex items-baseline justify-between text-sm">
            <span>
              <b className="text-brand">{have}</b> / {set.cards.length}장 모음
            </span>
            {value > 0 && <span className="font-semibold">{won(value)}</span>}
          </div>
          <div className="mt-2">
            <Progress have={have} total={set.cards.length} />
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-1 overflow-x-auto px-5">
        {["전체", ...rarities].map((r) => (
          <button
            key={r}
            onClick={() => setRarity(r)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-sm ${rarity === r ? "bg-ink font-bold text-white" : "bg-soft text-sub"}`}
          >
            {r}
          </button>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between px-5">
        <p className="font-bold">
          수록 카드 <span className="text-sub">{cards.length}장</span>
        </p>
        <div className="flex gap-2 text-xs">
          {(["전체", "보유", "미보유"] as const).map((m) => (
            <button key={m} onClick={() => setMine(m)} className={mine === m ? "font-bold" : "text-sub"}>
              {m}
            </button>
          ))}
        </div>
      </div>

      <ul className="mt-3 grid grid-cols-3 gap-x-2.5 gap-y-4 px-5 pb-6">
        {cards.map((c) => (
          <li key={c.id}>
            <Link href={`/dex/${set.id}/${c.id}`} className="relative block">
              <img
                src={`${c.image}?w=300`}
                alt={c.name}
                loading="lazy"
                className={`aspect-[63/88] w-full rounded-lg object-cover ${owned[c.id] ? "" : "opacity-35 grayscale"}`}
              />
              {owned[c.id] > 1 && (
                <span className="absolute right-1 top-1 rounded-full bg-brand px-1.5 text-[10px] font-bold text-white">×{owned[c.id]}</span>
              )}
              <span className="mt-1.5 block truncate text-xs font-semibold">{c.name}</span>
              <span className="flex justify-between text-[11px] text-sub">
                <span>{c.number.split("/")[0]}</span>
                {prices[c.id] && <span className="font-semibold text-ink">{won(prices[c.id])}</span>}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
