"use client";

import Link from "next/link";
import { useState } from "react";
import type { Card } from "@/lib/cards";
import { useCollection, usePrices, won } from "@/lib/collection";
import { Back, CardTile, Underline } from "../../../ui";

const RARITY: Record<string, string> = {
  C: "커먼",
  U: "언커먼",
  R: "레어",
  RR: "더블 레어",
  RRR: "트리플 레어",
  AR: "아트 레어",
  SR: "슈퍼 레어",
  SAR: "스페셜 아트 레어",
  UR: "울트라 레어",
  MUR: "메가 울트라 레어",
};
const rarityLabel = (r: string) => (RARITY[r] ? `${RARITY[r]} (${r})` : r || "-");

export default function CardView({
  card,
  setId,
  meta,
  others,
}: {
  card: Card;
  setId: string;
  meta: { series: string; code: string; short: string };
  others: Card[];
}) {
  const { owned, setCount } = useCollection();
  const price = usePrices([setId])[card.id];
  const count = owned[card.id] ?? 0;
  const [tab, setTab] = useState<"카드정보" | "시세">("카드정보");
  const rows: [string, React.ReactNode][] = [
    [
      "세트",
      <Link key="s" href={`/dex/${setId}`} className="font-bold text-brand">
        {meta.short} <span className="font-medium text-sub">{meta.code}</span> ›
      </Link>,
    ],
    ["언어", "한글판"],
    ["카드 번호", card.number],
    ["레어도", rarityLabel(card.rarity)],
    ["카드 종류", card.kind || "-"],
    ...(card.hp ? [["HP", String(card.hp)] as [string, string]] : []),
    ["일러스트", <span key="i" className="font-bold text-brand">{card.illustrator || "-"}</span>],
  ];

  return (
    <main className="px-5 pt-3">
      <Back />
      <div className="mt-2 flex items-center gap-4">
        <img src={`${card.image}?w=120`} alt="" className="h-[60px] rounded" />
        <div>
          <h1 className="text-[22px] font-bold">{card.name} 한글판</h1>
          <p className="text-[15px] text-sub">
            {card.number} · {rarityLabel(card.rarity)}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-xl bg-soft px-4 py-3">
        <span className="text-[15px] font-semibold">{count ? `${count}장 보유 중` : "아직 없어요"}</span>
        <div className="flex items-center gap-3">
          <button onClick={() => setCount(card.id, Math.max(0, count - 1))} className="size-8 rounded-full bg-white text-lg font-bold" aria-label="한 장 빼기">
            −
          </button>
          <span className="w-5 text-center font-bold">{count}</span>
          <button onClick={() => setCount(card.id, count + 1)} className="size-8 rounded-full bg-brand text-lg font-bold text-white" aria-label="한 장 더하기">
            +
          </button>
        </div>
      </div>

      <div className="mt-5">
        <Underline items={["카드정보", "시세"] as const} value={tab} onChange={setTab} />
      </div>

      {tab === "카드정보" ? (
        <>
          <img src={`${card.image}?w=640`} alt={card.name} className="mx-auto mt-6 w-[78%] rounded-2xl shadow-lg" />
          <dl className="mt-6 border-t border-line">
            {rows.map(([k, v]) => (
              <div key={k} className="flex items-center justify-between border-b border-line py-4 text-[15px]">
                <dt className="text-sub">{k}</dt>
                <dd className="font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
        </>
      ) : (
        <div className="mt-6 rounded-xl border border-line p-5">
          <p className="text-[13px] text-sub">일본판 기준 시세</p>
          <p className="mt-1 text-[28px] font-extrabold">{price ? won(price) : "정보 없음"}</p>
          <p className="mt-2 text-[13px] text-sub">
            {price ? "일본 카드샵 유유테이의 판매가를 오늘 환율로 원화로 바꾼 값이에요." : "일본판에 대응하는 카드가 없어서 시세를 찾지 못했어요."}
          </p>
          {count > 0 && price ? <p className="mt-3 text-[15px] font-semibold">내 카드 {count}장 · {won(price * count)}</p> : null}
        </div>
      )}

      <div className="mt-10 flex items-baseline justify-between">
        <h2 className="text-[17px] font-bold">같은 세트의 다른 카드</h2>
        <Link href={`/dex/${setId}`} className="text-sm text-sub">
          전체 보기 →
        </Link>
      </div>
      <ul className="mt-3 grid grid-cols-3 gap-x-3 gap-y-5 pb-6">
        {others.map((c) => (
          <li key={c.id}>
            <CardTile href={`/dex/${setId}/${c.id}`} image={c.image} name={c.name} sub={c.number.split("/")[0]} dim={!owned[c.id]} />
          </li>
        ))}
      </ul>
    </main>
  );
}
