"use client";

import { useEffect, useState } from "react";
import type { Post } from "@/lib/db";
import { loginUrl, useMe } from "@/lib/collection";
import { Search, Underline } from "../ui";
import { img } from "@/lib/img";

type Item = Omit<Post, "owner"> & { mine: boolean };
type Hit = { id: string; name: string; image: string; number: string; setName: string };

const won = (n: number | null) => (n == null ? "가격 제안" : `${n.toLocaleString()}원`);
const ago = (t: number) => {
  const m = Math.floor((Date.now() - t) / 60000);
  return m < 60 ? `${Math.max(m, 1)}분 전` : m < 1440 ? `${Math.floor(m / 60)}시간 전` : `${Math.floor(m / 1440)}일 전`;
};

export default function MarketPage() {
  const [tab, setTab] = useState<"전체" | "팝니다" | "삽니다">("전체");
  const [q, setQ] = useState("");
  const [list, setList] = useState<Item[]>([]);
  const [writing, setWriting] = useState(false);
  const [open, setOpen] = useState<Item | null>(null);
  const { user } = useMe();

  const load = () => fetch("/api/market").then((r) => r.json()).then((d) => setList(d.posts));
  useEffect(() => {
    load();
  }, []);

  async function remove(id: string) {
    await fetch("/api/market", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setOpen(null);
    load();
  }

  const words = q.trim().toLowerCase();
  const shown = list.filter(
    (p) =>
      (tab === "전체" || p.kind === (tab === "팝니다" ? "sell" : "buy")) &&
      (!words || `${p.title} ${p.card?.name ?? ""}`.toLowerCase().includes(words)),
  );

  return (
    <main className="px-5 pt-5">
      <div className="flex gap-2">
        <div className="flex-1">
          <Search value={q} onChange={setQ} placeholder="카드 이름으로 찾기" />
        </div>
        <button onClick={() => (user ? setWriting(true) : (location.href = loginUrl()))} className="rounded-xl bg-brand px-5 text-[15px] font-bold text-white">
          팔기
        </button>
      </div>
      <div className="mt-5">
        <Underline items={["전체", "팝니다", "삽니다"] as const} value={tab} onChange={setTab} right={shown.length} />
      </div>

      {shown.length === 0 && <p className="mt-6 rounded-xl bg-soft p-4 text-sm text-sub">아직 글이 없어요. 첫 글을 올려 보세요.</p>}
      <ul className="mt-4 grid grid-cols-2 overflow-hidden rounded-xl border border-line [&>li:nth-child(odd)]:border-r [&>li]:border-b [&>li]:border-line">
        {shown.map((p) => (
          <li key={p.id}>
            <button onClick={() => setOpen(p)} className="block w-full p-3 text-left">
              <span className="flex items-center justify-between text-[13px]">
                <span className="truncate text-ink2">{p.mine ? "내 글" : (p.author ?? "") + " · " + ago(p.createdAt)}</span>
                <span className={`font-bold ${p.kind === "sell" ? "text-brand" : "text-orange-500"}`}>{p.kind === "sell" ? "판매" : "구매"}</span>
              </span>
              <span className="mt-2 flex h-36 items-center justify-center rounded-lg bg-soft">
                {p.card?.image ? <img src={img(p.card.image, 240)} alt="" className="h-32 rounded" /> : <span className="text-xs text-faint">이미지 없음</span>}
              </span>
              <span className="mt-2 block truncate text-[14px] font-medium">{p.title}</span>
              <span className="block truncate text-[13px] text-sub">{p.card?.name ?? "카드 미지정"}</span>
              <span className="block text-[13px] text-sub">
                {p.grade ?? "A급"} {p.qty ?? 1}장
              </span>
              <span className="mt-1 flex items-center justify-between">
                <span className="truncate text-[16px] font-extrabold">{won(p.price)}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      <div className="h-6" />

      {open && (
        <div className="fixed inset-0 z-[1100] flex items-end justify-center bg-black/40" onClick={() => setOpen(null)}>
          <div className="w-full max-w-md rounded-t-3xl bg-white p-5 pb-[calc(20px+env(safe-area-inset-bottom))]" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line" />
            <div className="flex gap-4">
              {open.card?.image && <img src={img(open.card.image, 300)} alt="" className="w-28 rounded-lg" />}
              <div className="min-w-0">
                <p className={`text-[13px] font-bold ${open.kind === "sell" ? "text-brand" : "text-orange-500"}`}>{open.kind === "sell" ? "팝니다" : "삽니다"}</p>
                <p className="text-[18px] font-bold">{open.title}</p>
                {open.card && <p className="text-[13px] text-sub">{open.card.name}</p>}
                <p className="text-[13px] text-sub">
                  {open.grade ?? "A급"} {open.qty ?? 1}장 · {ago(open.createdAt)}
                </p>
                <p className="mt-2 text-[22px] font-extrabold">{won(open.price)}</p>
              </div>
            </div>
            {open.body && <p className="mt-4 whitespace-pre-wrap rounded-xl bg-soft p-4 text-[14px]">{open.body}</p>}
            {open.contact && (
              <p className="mt-3 text-[14px]">
                <span className="text-sub">연락 방법 </span>
                <span className="select-all font-semibold">{open.contact}</span>
              </p>
            )}
            {open.mine && (
              <button onClick={() => remove(open.id)} className="mt-4 w-full rounded-xl bg-soft py-3 text-[15px] font-semibold text-red-500">
                글 삭제
              </button>
            )}
          </div>
        </div>
      )}

      {writing && (
        <Compose
          onClose={() => setWriting(false)}
          onDone={() => {
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
  const [grade, setGrade] = useState("A급");
  const [qty, setQty] = useState("1");
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
        grade,
        qty: Number(qty),
        body,
        contact,
        card: card && { id: card.id, name: `${card.name} (${card.setName} ${card.number})`, image: card.image },
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
            <img src={img(card.image, 120)} alt="" className="h-14 w-10 rounded object-cover" />
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
                      <img src={img(h.image, 200)} alt={h.name} className="aspect-[63/88] w-full rounded-md object-cover" />
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
        <div className="flex gap-2">
          <select value={grade} onChange={(e) => setGrade(e.target.value)} className={input}>
            {["S급", "A급", "B급", "C급", "PSA 10", "PSA 9", "BRG 10", "BRG 9"].map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
          <input value={qty} onChange={(e) => setQty(e.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="수량" className={`${input} w-28`} />
        </div>
        <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="상태, 거래 방법 등" rows={3} className={input} />
        <input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="연락 방법 (예: 오픈채팅 링크)" className={input} />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="w-full rounded-xl bg-brand py-3 text-sm font-semibold text-white">올리기</button>
      </form>
    </div>
  );
}
