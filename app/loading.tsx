// 서버 응답을 기다리는 동안 바로 보여주는 뼈대 화면 (도감·세트·카드 화면 공용)
export default function Loading() {
  return (
    <main className="animate-pulse px-5 pt-5" aria-label="불러오는 중">
      <div className="h-6 w-40 rounded-md bg-soft" />
      <div className="mt-2 h-4 w-64 rounded-md bg-soft" />
      <div className="mt-5 h-12 rounded-xl bg-soft" />
      <ul className="mt-6 grid grid-cols-3 gap-x-3 gap-y-5">
        {Array.from({ length: 9 }, (_, i) => (
          <li key={i}>
            <div className="aspect-[63/88] rounded-lg bg-soft" />
            <div className="mx-auto mt-2 h-3.5 w-16 rounded bg-soft" />
          </li>
        ))}
      </ul>
    </main>
  );
}
