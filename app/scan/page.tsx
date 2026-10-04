"use client";

import { useEffect, useRef, useState } from "react";
import type { Card } from "@/lib/cards";
import { useCollection, usePrices, won } from "@/lib/collection";
import CardSheet from "../card-sheet";
import { CardTile, Search } from "../ui";

type Hit = Card & { setName: string };

export default function ScanPage() {
  const { owned, setCount } = useCollection();
  const fileRef = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState("");
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");
  const [guesses, setGuesses] = useState<Hit[]>([]);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [open, setOpen] = useState<Hit | null>(null);
  const prices = usePrices([...guesses, ...hits].map((h) => h.setId));

  useEffect(() => {
    if (!q.trim()) return setHits([]);
    const t = setTimeout(() => {
      fetch(`/api/cards/search?q=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((d) => setHits(d.cards));
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  async function scan(file: File) {
    setPhoto(URL.createObjectURL(file));
    setScanning(true);
    setError("");
    setGuesses([]);
    try {
      const body = new FormData();
      body.append("image", file);
      const r = await fetch("/api/scan", { method: "POST", body });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setGuesses(d.cards);
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : "인식에 실패했어요. 다시 찍어 주세요.");
    } finally {
      setScanning(false);
    }
  }

  const tile = (c: Hit) => (
    <li key={c.id}>
      <CardTile
        image={c.image}
        name={c.name}
        sub={`${c.setName} ${c.number.split("/")[0]}${prices[c.id] ? ` · ${won(prices[c.id])}` : ""}`}
        onClick={() => setOpen(c)}
        badge={owned[c.id] > 0 && <span className="absolute right-1 top-1 rounded-full bg-brand px-1.5 text-[10px] font-bold text-white">보유 {owned[c.id]}</span>}
      />
    </li>
  );

  return (
    <main className="px-5 pt-5">
      <h1 className="text-[22px] font-bold">카드 스캔</h1>
      <p className="mt-1 text-[15px] text-ink2">카드를 단색 바닥에 놓고, 화면에 꽉 차게 위에서 찍어 주세요.</p>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) scan(f);
          e.target.value = "";
        }}
      />
      <button
        onClick={() => fileRef.current?.click()}
        className="mt-4 flex w-full items-center justify-center gap-3 rounded-2xl bg-brand py-4 text-[16px] font-bold text-white"
      >
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
        {photo ? "다시 찍기" : "카메라로 찍기"}
      </button>

      {photo && (
        <section className="mt-5">
          <div className="flex items-center gap-3">
            <img src={photo} alt="찍은 사진" className="h-20 rounded-lg object-cover" />
            <p className="text-[15px] font-semibold">{scanning ? "카드를 찾는 중이에요…" : error || (guesses.length ? "이 중에 있나요? 눌러서 추가하세요." : "")}</p>
          </div>
          {guesses.length > 0 && <ul className="mt-4 grid grid-cols-3 gap-x-3 gap-y-5">{guesses.map(tile)}</ul>}
          {guesses.length > 0 && <p className="mt-3 text-[13px] text-sub">없으면 아래에서 이름이나 번호로 찾아 주세요.</p>}
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-[17px] font-bold">이름·번호로 찾기</h2>
        <div className="mt-3">
          <Search value={q} onChange={setQ} placeholder="예: 피카츄, 001/081, 어비스아이 SAR" />
        </div>
        {q && hits.length === 0 && <p className="mt-4 text-sm text-sub">찾는 카드가 없어요.</p>}
        <ul className="mt-4 grid grid-cols-3 gap-x-3 gap-y-5 pb-6">{hits.map(tile)}</ul>
      </section>

      {open && (
        <CardSheet card={open} setName={open.setName} count={owned[open.id] ?? 0} price={prices[open.id]} onCount={(n) => setCount(open.id, n)} onClose={() => setOpen(null)} />
      )}
    </main>
  );
}
