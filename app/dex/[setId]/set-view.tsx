"use client";

import { useState } from "react";
import type { CardSet } from "@/lib/cards";
import { useCollection, usePrices, won } from "@/lib/collection";
import { Progress } from "../../card-sheet";
import { Back, CardTile, Chips, Search } from "../../ui";

const RARITY_ORDER = ["C", "U", "R", "RR", "RRR", "AR", "SR", "SAR", "UR", "MUR", "ACE", "PR"];
const rank = (r: string) => (RARITY_ORDER.indexOf(r) + 99) % 99;
const SORTS = ["도감순", "가격 높은순", "가격 낮은순", "레어도 높은순", "이름순"] as const;

export default function SetView({ set, meta }: { set: CardSet; meta: { series: string; code: string; short: string } }) {
  const { owned } = useCollection();
  const prices = usePrices([set.id]);
  const rarities = [...new Set(set.cards.map((c) => c.rarity).filter(Boolean))].sort(
    (a, b) => rank(a) - rank(b),
  );
  const [rarity, setRarity] = useState("전체");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<(typeof SORTS)[number]>("도감순");
  const have = set.cards.filter((c) => owned[c.id]).length;
  const value = set.cards.reduce((sum, c) => sum + (owned[c.id] ?? 0) * (prices[c.id] ?? 0), 0);
  const words = q.trim().toLowerCase();
  const cards = set.cards
    .filter((c) => (rarity === "전체" || c.rarity === rarity) && (!words || `${c.name} ${c.number}`.toLowerCase().includes(words)))
    .sort((a, b) => {
      if (sort === "가격 높은순") return (prices[b.id] ?? -1) - (prices[a.id] ?? -1);
      if (sort === "가격 낮은순") return (prices[a.id] ?? Infinity) - (prices[b.id] ?? Infinity);
      if (sort === "레어도 높은순") return rank(b.rarity) - rank(a.rarity) || a.number.localeCompare(b.number);
      if (sort === "이름순") return a.name.localeCompare(b.name, "ko");
      return a.number.localeCompare(b.number);
    });
  // 카드 상세에서 좌우로 넘길 때 지금 보이는 순서를 따른다.
  const remember = () => {
    try {
      sessionStorage.setItem("cardOrder", JSON.stringify({ setId: set.id, ids: cards.map((c) => c.id) }));
    } catch {}
  };

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

      <div className="mt-6 flex items-center justify-between">
        <h2 className="text-[17px] font-bold">
          수록 카드 <span className="text-[15px] font-medium text-sub">{cards.length}장</span>
        </h2>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as (typeof SORTS)[number])}
          className="rounded-lg border border-line bg-white px-2 py-1.5 text-[14px] font-medium text-ink2 outline-none"
          aria-label="정렬"
        >
          {SORTS.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      </div>
      <ul className="mt-3 grid grid-cols-3 gap-x-3 gap-y-5 pb-6" onClickCapture={remember}>
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
