"use client";

import type { Card } from "@/lib/cards";

export function Progress({ have, total }: { have: number; total: number }) {
  const pct = total ? Math.round((have / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
        <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-9 text-right text-xs font-semibold text-brand">{pct}%</span>
    </div>
  );
}

/** 카드를 누르면 아래에서 올라오는 상세 시트. 보유 장수를 바꿀 수 있다. */
export default function CardSheet({
  card,
  setName,
  count,
  price,
  onCount,
  onClose,
}: {
  card: Card;
  setName?: string;
  count: number;
  price?: number;
  onCount: (n: number) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[1100] flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-5 pb-[calc(20px+env(safe-area-inset-bottom))]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line" />
        <img src={`${card.image}?w=512`} alt={card.name} className="mx-auto w-56 rounded-xl shadow-lg" />
        <h2 className="mt-4 text-xl font-extrabold">{card.name}</h2>
        <p className="text-sm text-sub">
          {setName ? `${setName} · ` : ""}
          {card.number} · {card.rarity}
        </p>
        <p className="mt-2 text-2xl font-extrabold">{price ? `${price.toLocaleString()}원` : "시세 없음"}</p>
        {price ? <p className="text-xs text-sub">일본판 유유테이 판매가를 오늘 환율로 환산한 값이에요.</p> : null}
        <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-xl bg-soft p-3">
            <dt className="text-xs text-sub">카드 종류</dt>
            <dd className="font-semibold">{card.kind || "-"}</dd>
          </div>
          <div className="rounded-xl bg-soft p-3">
            <dt className="text-xs text-sub">일러스트</dt>
            <dd className="font-semibold">{card.illustrator || "-"}</dd>
          </div>
        </dl>
        <div className="mt-4 flex items-center justify-between rounded-2xl border border-line p-3">
          <span className="font-semibold">보유 장수</span>
          <div className="flex items-center gap-3">
            <button onClick={() => onCount(Math.max(0, count - 1))} className="size-9 rounded-full bg-soft text-lg font-bold" aria-label="한 장 빼기">
              −
            </button>
            <span className="w-6 text-center text-lg font-bold">{count}</span>
            <button onClick={() => onCount(count + 1)} className="size-9 rounded-full bg-brand text-lg font-bold text-white" aria-label="한 장 더하기">
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
