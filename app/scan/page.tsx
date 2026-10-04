"use client";

import { useEffect, useState } from "react";
import type { Card } from "@/lib/cards";
import { useCollection, usePrices, won } from "@/lib/collection";
import CardSheet from "../card-sheet";

type Hit = Card & { setName: string };

// ponytail: 사진 인식 대신 이름·번호 검색. 카드 사진 인식은 별도 이미지 인식 서비스가 필요해서 나중에 붙인다.
export default function ScanPage() {
  const { owned, setCount } = useCollection();
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [open, setOpen] = useState<Hit | null>(null);
  const prices = usePrices(hits.map((h) => h.setId));

  useEffect(() => {
    if (!q.trim()) return setHits([]);
    const t = setTimeout(() => {
      fetch(`/api/cards/search?q=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((d) => setHits(d.cards));
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <main className="px-5 pt-6">
      <h1 className="text-2xl font-extrabold tracking-tight">카드 찾기</h1>
      <p className="mt-1 text-sm text-sub">카드 왼쪽 아래 번호(예: 001/081)나 이름으로 찾아서 내 도감에 추가하세요.</p>
      <input
        autoFocus
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="예: 피카츄, 001/081, 어비스아이 SAR"
        className="mt-4 w-full rounded-xl bg-soft px-4 py-3 text-sm outline-none"
      />
      {q && hits.length === 0 && <p className="mt-4 text-sm text-sub">찾는 카드가 없어요.</p>}
      <ul className="mt-4 grid grid-cols-3 gap-2.5 pb-6">
        {hits.map((c) => (
          <li key={c.id}>
            <button onClick={() => setOpen(c)} className="relative block w-full text-left">
              <img src={`${c.image}?w=300`} alt={c.name} loading="lazy" className="aspect-[63/88] w-full rounded-lg object-cover" />
              {owned[c.id] > 0 && (
                <span className="absolute right-1 top-1 rounded-full bg-brand px-1.5 text-[10px] font-bold text-white">보유 {owned[c.id]}</span>
              )}
              <span className="mt-1 block truncate text-[11px] font-semibold">{c.name}</span>
              <span className="block truncate text-[10px] text-sub">
                {c.number} · {c.setName}
              </span>
              {prices[c.id] && <span className="block text-[11px] font-semibold">{won(prices[c.id])}</span>}
            </button>
          </li>
        ))}
      </ul>
      {open && (
        <CardSheet card={open} setName={open.setName} count={owned[open.id] ?? 0} price={prices[open.id]} onCount={(n) => setCount(open.id, n)} onClose={() => setOpen(null)} />
      )}
    </main>
  );
}
