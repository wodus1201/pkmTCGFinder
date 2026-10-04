import { collection, update } from "@/lib/db";

// 보유 카드를 서버(data/db.json)에 저장해서 접속 주소·기기가 바뀌어도 유지한다. 혼자 쓰는 앱이라 사용자 구분은 없다.
export async function GET() {
  return Response.json({ owned: await collection() });
}

/** { id, count } 한 장 바꾸기, 또는 { all } 통째로 합치기(기존 브라우저 저장분 옮길 때) */
export async function POST(req: Request) {
  const b = await req.json();
  const owned = await update((db) => {
    const c = (db.collection ??= {});
    const apply = (id: unknown, n: unknown) => {
      const count = Math.min(Math.max(Math.round(Number(n)) || 0, 0), 999);
      if (typeof id !== "string" || !/^BS\d{9,}$/.test(id)) return;
      if (count > 0) c[id] = count;
      else delete c[id];
    };
    if (b.all && typeof b.all === "object") {
      for (const [id, n] of Object.entries(b.all)) if (!c[id]) apply(id, n);
    } else {
      apply(b.id, b.count);
    }
    return { ...c };
  });
  return Response.json({ owned });
}
