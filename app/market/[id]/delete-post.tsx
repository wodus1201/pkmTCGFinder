"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { setNavDir } from "@/lib/nav";

export default function DeletePost({ id }: { id: string }) {
  const router = useRouter();
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);

  async function remove() {
    setBusy(true);
    await fetch("/api/market", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setNavDir("back");
    router.replace("/market");
    router.refresh();
  }

  return (
    <>
      <button onClick={() => setAsking(true)} className="mt-4 w-full rounded-xl border border-line py-3 text-[15px] font-semibold text-red-500">
        글 삭제
      </button>
      {asking && (
        <div className="fixed inset-0 z-[1100] grid place-items-center bg-black/40 px-8" onClick={() => !busy && setAsking(false)}>
          <div role="dialog" aria-modal="true" aria-labelledby="del-title" className="w-full max-w-xs rounded-2xl bg-white p-5 text-center" onClick={(e) => e.stopPropagation()}>
            <p id="del-title" className="text-[17px] font-bold">
              이 글을 삭제할까요?
            </p>
            <p className="mt-1 text-[14px] text-sub">삭제하면 되돌릴 수 없어요.</p>
            <div className="mt-5 flex gap-2">
              <button autoFocus disabled={busy} onClick={() => setAsking(false)} className="flex-1 rounded-xl bg-soft py-3 text-[15px] font-semibold text-ink2">
                취소
              </button>
              <button disabled={busy} onClick={remove} className="flex-1 rounded-xl bg-red-500 py-3 text-[15px] font-semibold text-white disabled:opacity-60">
                {busy ? "삭제 중…" : "삭제"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
