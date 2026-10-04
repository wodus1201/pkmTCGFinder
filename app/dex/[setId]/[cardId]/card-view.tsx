"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Card } from "@/lib/cards";
import { useCollection, usePrices, won } from "@/lib/collection";

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
  const router = useRouter();
  const { owned, setCount } = useCollection();
  const price = usePrices([setId])[card.id];
  const count = owned[card.id] ?? 0;
  const rows: [string, string][] = [
    ["세트", `${meta.short} · ${meta.code}`],
    ["언어", "한글판"],
    ["카드 번호", card.number],
    ["레어도", RARITY[card.rarity] ? `${RARITY[card.rarity]} (${card.rarity})` : card.rarity || "-"],
    ["카드 종류", card.kind || "-"],
    ...(card.hp ? [["HP", String(card.hp)] as [string, string]] : []),
    ["일러스트", card.illustrator || "-"],
  ];

  return (
    <main className="pt-4">
      <div className="px-5">
        <button onClick={() => router.back()} className="text-2xl leading-none" aria-label="뒤로">
          ‹
        </button>
      </div>
      <div className="mt-2 bg-soft py-6">
        <img src={`${card.image}?w=512`} alt={card.name} className={`mx-auto w-60 rounded-xl shadow-xl ${count ? "" : "opacity-60 grayscale"}`} />
      </div>
      <div className="px-5">
        <h1 className="mt-4 text-2xl font-extrabold tracking-tight">{card.name} 한글판</h1>
        <p className="text-sm text-sub">
          {card.number} · {RARITY[card.rarity] ?? card.rarity} ({card.rarity})
        </p>

        <div className="mt-4 flex items-center justify-between rounded-2xl border border-line p-4">
          <div>
            <p className="text-xs text-sub">시세</p>
            <p className="text-xl font-extrabold">{price ? won(price) : "정보 없음"}</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setCount(card.id, Math.max(0, count - 1))} className="size-9 rounded-full bg-soft text-lg font-bold" aria-label="한 장 빼기">
              −
            </button>
            <span className="w-6 text-center text-lg font-bold">{count}</span>
            <button onClick={() => setCount(card.id, count + 1)} className="size-9 rounded-full bg-brand text-lg font-bold text-white" aria-label="한 장 더하기">
              +
            </button>
          </div>
        </div>
        {price ? <p className="mt-1 text-xs text-sub">일본판 유유테이 판매가를 오늘 환율로 환산한 값이에요.</p> : null}

        <h2 className="mt-6 font-bold">카드정보</h2>
        <dl className="mt-2 divide-y divide-line text-sm">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between py-2.5">
              <dt className="text-sub">{k}</dt>
              <dd className="font-semibold">{v}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-6 flex items-baseline justify-between">
          <h2 className="font-bold">같은 세트의 다른 카드</h2>
          <Link href={`/dex/${setId}`} className="text-sm text-sub">
            전체 보기 →
          </Link>
        </div>
      </div>
      <ul className="mt-3 flex gap-2.5 overflow-x-auto px-5 pb-8">
        {others.map((c) => (
          <li key={c.id} className="w-24 shrink-0">
            <Link href={`/dex/${setId}/${c.id}`} replace>
              <img src={`${c.image}?w=200`} alt={c.name} className="aspect-[63/88] w-full rounded-md object-cover" loading="lazy" />
              <span className="mt-1 block truncate text-xs font-semibold">{c.name}</span>
              <span className="block text-[11px] text-sub">{c.number.split("/")[0]}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
