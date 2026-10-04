"use client";

import { useEffect, useState } from "react";
import type { Post } from "@/lib/db";

type Item = Omit<Post, "owner">;
type Hit = { id: string; name: string; image: string; number: string; setName: string };

function ownerToken() {
  try {
    let t = localStorage.getItem("owner");
    if (!t) localStorage.setItem("owner", (t = crypto.randomUUID()));
    const mine: string[] = JSON.parse(localStorage.getItem("myPosts") || "[]");
    return { token: t, mine };
  } catch {
    return { token: "", mine: [] as string[] };
  }
}

const won = (n: number | null) => (n == null ? "가격 제안" : `${n.toLocaleString()}원`);
const ago = (t: number) => {
  const m = Math.floor((Date.now() - t) / 60000);
  return m < 60 ? `${Math.max(m, 1)}분 전` : m < 1440 ? `${Math.floor(m / 60)}시간 전` : `${Math.floor(m / 1440)}일 전`;
};

export default function MarketPage() {
  const [tab, setTab] = useState<"all" | "sell" | "buy">("all");
  const [list, setList] = useState<Item[]>([]);
  const [writing, setWriting] = useState(false);
  const [mine, setMine] = useState<string[]>([]);

  const load = () => fetch("/api/market").then((r) => r.json()).then((d) => setList(d.posts));
  useEffect(() => {
    load();
    setMine(ownerToken().mine);
  }, []);

  async function remove(id: string) {
    await fetch("/api/market", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, owner: ownerToken().token }) });
    load();
  }

  const shown = list.filter((p) => tab === "all" || p.kind === tab);

  return (
    <main className="px-5 pt-6">
      <header className="flex items-end justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight">거래소</h1>
        <button onClick={() => setWriting(true)} className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white">
          글쓰기
        </button>
      </header>
      <div className="mt-4 flex gap-4 border-b border-line text-sm">
        {(
          [
            ["all", "전체"],
            ["sell", "판매"],
            ["buy", "구매"],
          ] as const
        ).map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} className={`-mb-px pb-2 ${tab === k ? "border-b-2 border-ink font-bold" : "text-sub"}`}>
            {label}
          </button>
        ))}
      </div>

      {shown.length === 0 && <p className="mt-6 rounded-xl bg-soft p-4 text-sm text-sub">아직 글이 없어요. 첫 글을 올려 보세요.</p>}
      <ul className="divide-y divide-line pb-6">
        {shown.map((p) => (
          <li key={p.id} className="flex gap-3 py-4">
            {p.card?.image ? (
              <img src={`${p.card.image}?w=200`} alt="" className="h-20 w-14 shrink-0 rounded-md object-cover" />
            ) : (
              <div className="h-20 w-14 shrink-0 rounded-md bg-soft" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs">
                <span className={`font-semibold ${p.kind === "sell" ? "text-brand" : "text-orange-500"}`}>{p.kind === "sell" ? "판매" : "구매"}</span>
                <span className="text-sub"> · {ago(p.createdAt)}</span>
              </p>
              <p className="truncate font-semibold">{p.title}</p>
              {p.card && <p className="truncate text-xs text-sub">{p.card.name}</p>}
              <p className="mt-0.5 font-bold">{won(p.price)}</p>
              {p.body && <p className="mt-1 line-clamp-2 text-sm text-sub">{p.body}</p>}
              {p.contact && <p className="mt-1 text-xs text-sub">연락: {p.contact}</p>}
              {mine.includes(p.id) && (
                <button onClick={() => remove(p.id)} className="mt-1 text-xs text-red-500">
                  삭제
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      {writing && (
        <Compose
          onClose={() => setWriting(false)}
          onDone={(id) => {
            const next = [...ownerToken().mine, id];
            try {
              localStorage.setItem("myPosts", JSON.stringify(next));
            } catch {}
            setMine(next);
            setWriting(false);
            load();
          }}
        />
      )}
    </main>
  );
}

function Compose({ onClose, onDone }: { onClose: () => void; onDone: (id: string) => void }) {
  const [kind, setKind] = useState<"sell" | "buy">("sell");
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [body, setBody] = useState("");
  const [contact, setContact] = useState("");
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [card, setCard] = useState<Hit | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!q.trim() || card) return setHits([]);
    const t = setTimeout(() => {
      fetch(`/api/cards/search?q=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((d) => setHits(d.cards.slice(0, 9)));
    }, 250);
    return () => clearTimeout(t);
  }, [q, card]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const r = await fetch("/api/market", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind,
        title: title || card?.name,
        price: price === "" ? null : Number(price),
        body,
        contact,
        card: card && { id: card.id, name: `${card.name} (${card.setName} ${card.number})`, image: card.image },
        owner: ownerToken().token,
      }),
    });
    const d = await r.json();
    if (!r.ok) return setError(d.error);
    onDone(d.id);
  }

  const input = "w-full rounded-xl bg-soft px-4 py-3 text-sm outline-none";
  return (
    <div className="fixed inset-0 z-[1100] flex items-end justify-center bg-black/40" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90dvh] w-full max-w-md space-y-3 overflow-y-auto rounded-t-3xl bg-white p-5 pb-[calc(20px+env(safe-area-inset-bottom))]"
      >
        <h2 className="text-lg font-bold">거래 글쓰기</h2>
        <div className="flex gap-2">
          {(["sell", "buy"] as const).map((k) => (
            <button type="button" key={k} onClick={() => setKind(k)} className={`flex-1 rounded-xl py-2.5 text-sm font-semibold ${kind === k ? "bg-ink text-white" : "bg-soft"}`}>
              {k === "sell" ? "팝니다" : "삽니다"}
            </button>
          ))}
        </div>
        {card ? (
          <div className="flex items-center gap-3 rounded-xl border border-line p-2">
            <img src={`${card.image}?w=120`} alt="" className="h-14 w-10 rounded object-cover" />
            <p className="flex-1 text-sm font-semibold">
              {card.name}
              <span className="block text-xs font-normal text-sub">
                {card.setName} {card.number}
              </span>
            </p>
            <button type="button" onClick={() => setCard(null)} className="px-2 text-sm text-sub">
              변경
            </button>
          </div>
        ) : (
          <div>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="카드 연결 (선택): 이름이나 번호로 검색" className={input} />
            {hits.length > 0 && (
              <ul className="mt-2 grid grid-cols-3 gap-2">
                {hits.map((h) => (
                  <li key={h.id}>
                    <button type="button" onClick={() => setCard(h)} className="w-full text-left">
                      <img src={`${h.image}?w=200`} alt={h.name} className="aspect-[63/88] w-full rounded-md object-cover" />
                      <span className="block truncate text-[10px] text-sub">{h.number} {h.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={card ? `제목 (비우면 ${card.name})` : "제목"} className={input} />
        <input value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="가격 (원, 비우면 가격 제안)" className={input} />
        <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="상태, 거래 방법 등" rows={3} className={input} />
        <input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="연락 방법 (예: 오픈채팅 링크)" className={input} />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="w-full rounded-xl bg-brand py-3 text-sm font-semibold text-white">올리기</button>
      </form>
    </div>
  );
}
