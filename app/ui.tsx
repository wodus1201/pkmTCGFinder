"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { setNavDir } from "@/lib/nav";
import { img } from "@/lib/img";

// dogam.app 화면에서 반복되는 조각들

/** 좌상단 뒤로 버튼과 같은 꺾쇠 화살표 */
export function Chevron({ right = false }: { right?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={right ? "m9 18 6-6-6-6" : "m15 18-6-6 6-6"} />
    </svg>
  );
}

/** 수량 −/+ 버튼 아이콘 */
export function PlusMinus({ plus = false }: { plus?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden>
      <path d={plus ? "M12 5v14M5 12h14" : "M5 12h14"} />
    </svg>
  );
}

export function Back({ href }: { href?: string }) {
  const router = useRouter();
  const arrow = <Chevron />;
  return href ? (
    <Link href={href} onClick={() => setNavDir("back")} aria-label="뒤로" className="-ml-1 inline-block py-2">
      {arrow}
    </Link>
  ) : (
    <button onClick={() => (setNavDir("back"), router.back())} aria-label="뒤로" className="-ml-1 py-2">
      {arrow}
    </button>
  );
}

export function Chips<T extends string>({ items, value, onChange }: { items: readonly T[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="-mx-5 flex gap-1 overflow-x-auto px-5">
      {items.map((it) => (
        <button
          key={it}
          onClick={() => onChange(it)}
          className={`shrink-0 rounded-[10px] px-3 py-2 text-[15px] font-medium ${value === it ? "bg-soft font-bold text-ink" : "text-ink2"}`}
        >
          {it}
        </button>
      ))}
    </div>
  );
}

export function Underline<T extends string>({ items, value, onChange, right }: { items: readonly T[]; value: T; onChange: (v: T) => void; right?: React.ReactNode }) {
  return (
    <div className="flex items-end border-b border-line">
      {items.map((it) => (
        <button key={it} onClick={() => onChange(it)} className={`-mb-px mr-5 pb-2.5 text-[17px] ${value === it ? "border-b-2 border-ink font-bold" : "font-medium text-sub"}`}>
          {it}
        </button>
      ))}
      <span className="ml-auto pb-2.5 text-sm text-sub">{right}</span>
    </div>
  );
}

export function Search({ value, onChange, placeholder, autoFocus }: { value: string; onChange: (v: string) => void; placeholder: string; autoFocus?: boolean }) {
  return (
    <label className="flex items-center gap-2 rounded-xl border border-line px-4 py-3 focus-within:border-brand">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#4e5968" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input autoFocus={autoFocus} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full text-[15px] outline-none placeholder:text-faint" />
    </label>
  );
}

/** 3열 카드 그리드의 한 칸: 이미지 + 가운데 정렬 이름/번호 */
export function CardTile({
  href,
  image,
  name,
  sub,
  dim,
  badge,
  onClick,
}: {
  href?: string;
  image: string;
  name: string;
  sub: React.ReactNode;
  dim?: boolean;
  badge?: React.ReactNode;
  onClick?: () => void;
}) {
  const body = (
    <>
      <span className="relative block">
        <img src={img(image, 256)} alt={name} loading="lazy" className={`aspect-[63/88] w-full rounded-lg bg-soft object-cover ${dim ? "opacity-35 grayscale" : ""}`} />
        {badge}
      </span>
      <span className="mt-2 block truncate text-center text-[15px] font-semibold">{name}</span>
      <span className="block text-center text-[13px] text-faint">{sub}</span>
    </>
  );
  return href ? (
    <Link href={href} onClick={() => setNavDir("forward")} className="block">
      {body}
    </Link>
  ) : (
    <button onClick={onClick} className="block w-full">
      {body}
    </button>
  );
}

