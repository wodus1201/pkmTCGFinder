"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Card } from "@/lib/cards";
import { useCollection, usePrices, won } from "@/lib/collection";
import { Back, CardTile, Chevron, Underline } from "../../../ui";
import { img } from "@/lib/img";
import { setNavDir } from "@/lib/nav";

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
  order: initialOrder,
}: {
  card: Card;
  setId: string;
  meta: { series: string; code: string; short: string };
  others: Card[];
  order: string[];
}) {
  const router = useRouter();
  const [order, setOrder] = useState(initialOrder);
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem("cardOrder") || "null");
      if (saved?.setId === setId && saved.ids.includes(card.id)) setOrder(saved.ids);
    } catch {}
  }, [setId, card.id]);
  const at = order.indexOf(card.id);
  const prev = at > 0 ? order[at - 1] : null;
  const next = at >= 0 && at < order.length - 1 ? order[at + 1] : null;
  const go = (id: string | null) => {
    if (!id) return;
    setNavDir(id === next ? "forward" : "back");
    router.replace(`/dex/${setId}/${id}`, { scroll: false });
  };
  useEffect(() => {
    for (const id of [prev, next]) if (id) router.prefetch(`/dex/${setId}/${id}`);
  }, [prev, next, setId, router]);

  // 카드 이미지를 좌우로 밀면 이전/다음 카드
  const touch = useRef<{ x: number; y: number } | null>(null);
  const [drag, setDrag] = useState(0);
  const swipe = {
    onTouchStart: (e: React.TouchEvent) => {
      touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    },
    onTouchMove: (e: React.TouchEvent) => {
      if (!touch.current) return;
      const dx = e.touches[0].clientX - touch.current.x;
      if (Math.abs(dx) > Math.abs(e.touches[0].clientY - touch.current.y)) setDrag(dx);
    },
    onTouchEnd: () => {
      if (drag < -60) go(next);
      else if (drag > 60) go(prev);
      setDrag(0);
      touch.current = null;
    },
  };
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
        <img src={img(card.image, 120)} alt="" className="h-[60px] rounded" />
        <div>
          <h1 className="text-[22px] font-bold">{card.name} 한글판</h1>
          <p className="text-[15px] text-sub">
            {card.number}
            {card.rarity && ` · ${rarityLabel(card.rarity)}`}
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
          <div className="relative mt-6 select-none" {...swipe}>
            <img
              src={img(card.image, 640)}
              alt={card.name}
              draggable={false}
              style={{ transform: `translateX(${drag}px) rotate(${drag / 40}deg)`, transition: drag ? "none" : "transform .2s" }}
              className="mx-auto w-[78%] rounded-2xl shadow-lg"
            />
            {prev && (
              <button onClick={() => go(prev)} aria-label="이전 카드" className="absolute left-0 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 shadow">
                <Chevron />
              </button>
            )}
            {next && (
              <button onClick={() => go(next)} aria-label="다음 카드" className="absolute right-0 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 shadow">
                <Chevron right />
              </button>
            )}
          </div>
          <p className="mt-3 text-center text-[13px] text-faint">
            {at + 1} / {order.length} · 옆으로 밀어서 넘기기
          </p>
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
        <Link href={`/dex/${setId}`} onClick={() => setNavDir("back")} className="text-sm text-sub">
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
