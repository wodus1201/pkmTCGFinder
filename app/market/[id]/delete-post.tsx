"use client";

import { useRouter } from "next/navigation";
import { setNavDir } from "@/lib/nav";

export default function DeletePost({ id }: { id: string }) {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await fetch("/api/market", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
        setNavDir("back");
        router.replace("/market");
        router.refresh();
      }}
      className="mt-4 w-full rounded-xl border border-line py-3 text-[15px] font-semibold text-red-500"
    >
      글 삭제
    </button>
  );
}
