import { currentUser } from "@/lib/auth";
import { collectionOf, update } from "@/lib/db";

// 보유 카드는 카카오 계정별로 서버(data/db.json)에 저장한다. 로그인하지 않으면 401.
export async function GET() {
  const user = await currentUser();
  if (!user) return Response.json({ error: "login" }, { status: 401 });
  return Response.json({ owned: await collectionOf(user.id) });
}

/** { id, count } 한 장 바꾸기, 또는 { all } 통째로 합치기(로그인 전 브라우저 저장분 옮길 때) */
export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return Response.json({ error: "login" }, { status: 401 });
  const b = await req.json();
  const owned = await update((db) => {
    const c = ((db.collections ??= {})[user.id] ??= {});
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
