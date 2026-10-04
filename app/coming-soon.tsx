import Link from "next/link";

export default function ComingSoon({ title }: { title: string }) {
  return (
    <main className="px-5 pt-6">
      <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
      <div className="mt-10 rounded-2xl bg-soft p-6 text-center">
        <p className="font-semibold">준비 중인 탭이에요</p>
        <p className="mt-1 text-sm text-sub">지금은 재고 탭에서 내 주변 포켓몬 카드 재고를 확인할 수 있어요.</p>
        <Link href="/stock" className="mt-4 inline-block rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white">
          재고 보러 가기
        </Link>
      </div>
    </main>
  );
}
