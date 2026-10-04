"use client";

import { useState } from "react";
import type { CardSet } from "@/lib/cards";
import { useCollection, usePrices, won } from "@/lib/collection";
import { Progress } from "../../card-sheet";
import { Back, CardTile, Chips, Search } from "../../ui";

const RARITY_ORDER = ["C", "U", "R", "RR", "RRR", "AR", "SR", "SAR", "UR", "MUR", "ACE", "PR"];

export default function SetView({ set, meta }: { set: CardSet; meta: { series: string; code: string; short: string } }) {
  const { owned } = useCollection();
  const prices = usePrices([set.id]);
  const rarities = [...new Set(set.cards.map((c) => c.rarity).filter(Boolean))].sort(
    (a, b) => ((RARITY_ORDER.indexOf(a) + 99) % 99) - ((RARITY_ORDER.indexOf(b) + 99) % 99),
  );
  const [rarity, setRarity] = useState("전체");
  const [q, setQ] = useState("");
  const have = set.cards.filter((c) => owned[c.id]).length;
  const value = set.cards.reduce((sum, c) => sum + (owned[c.id] ?? 0) * (prices[c.id] ?? 0), 0);
  const words = q.trim().toLowerCase();
  const cards = set.cards.filter(
    (c) => (rarity === "전체" || c.rarity === rarity) && (!words || `${c.name} ${c.number}`.toLowerCase().includes(words)),
  );

  return (
    <main className="px-5 pt-3">
      <Back href="/dex" />
      <div className="mt-2 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold">{meta.short}</h1>
          <p className="mt-1 text-[15px] text-ink2">
            {meta.series} · {meta.code} · {set.cards.length}장 · {set.year}년 · 한글판
          </p>
        </div>
        {set.symbol && <img src={set.symbol} alt="" className="mt-1 h-9" />}
      </div>

      <div className="mt-4 rounded-xl bg-soft px-4 py-3">
        <div className="flex items-baseline justify-between text-[14px]">
          <span>
            <b className="text-brand">{have}</b> / {set.cards.length}장 모음
          </span>
          {value > 0 && <span className="font-semibold">{won(value)}</span>}
        </div>
        <div className="mt-2">
          <Progress have={have} total={set.cards.length} />
        </div>
      </div>

      <div className="mt-4">
        <Search value={q} onChange={setQ} placeholder="카드 이름·번호 검색" />
      </div>
      <div className="mt-3">
        <Chips items={["전체", ...rarities]} value={rarity} onChange={setRarity} />
      </div>

      <div className="mt-6 flex items-baseline justify-between">
        <h2 className="text-[17px] font-bold">수록 카드</h2>
        <span className="text-sm text-sub">{cards.length}장</span>
      </div>
      <ul className="mt-3 grid grid-cols-3 gap-x-3 gap-y-5 pb-6">
        {cards.map((c) => (
          <li key={c.id}>
            <CardTile
              href={`/dex/${set.id}/${c.id}`}
              image={c.image}
              name={c.name}
              dim={!owned[c.id]}
              sub={prices[c.id] ? `${c.number.split("/")[0]} · ${won(prices[c.id])}` : c.number.split("/")[0]}
              badge={
                owned[c.id] > 1 && (
                  <span className="absolute right-1 top-1 rounded-full bg-brand px-1.5 text-[10px] font-bold text-white">×{owned[c.id]}</span>
                )
              }
            />
          </li>
        ))}
      </ul>
    </main>
  );
}
