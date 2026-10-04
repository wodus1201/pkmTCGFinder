import { posts, update, type Post } from "@/lib/db";

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function GET() {
  const list = (await posts()).sort((a, b) => b.createdAt - a.createdAt);
  return Response.json({ posts: list.map(({ owner: _o, ...p }) => p) });
}

export async function POST(req: Request) {
  const b = await req.json();
  const kind = b.kind === "buy" ? "buy" : "sell";
  const title = str(b.title, 80);
  const owner = str(b.owner, 64);
  if (!title || !owner) return Response.json({ error: "제목을 입력해 주세요" }, { status: 400 });
  const price = Number(b.price);
  const card =
    b.card && typeof b.card.id === "string"
      ? { id: str(b.card.id, 20), name: str(b.card.name, 60), image: str(b.card.image, 300) }
      : null;
  if (card && !card.image.startsWith("https://cards.image.pokemonkorea.co.kr/")) card.image = "";

  const post: Post = {
    id: crypto.randomUUID(),
    kind,
    title,
    price: Number.isFinite(price) && price >= 0 ? Math.round(price) : null,
    grade: str(b.grade, 20) || "A급",
    qty: Math.min(Math.max(Math.round(Number(b.qty)) || 1, 1), 999),
    body: str(b.body, 2000),
    contact: str(b.contact, 100),
    card,
    createdAt: Date.now(),
    owner,
  };
  await update((db) => {
    db.posts = [...(db.posts ?? []), post];
  });
  return Response.json({ id: post.id });
}

export async function DELETE(req: Request) {
  const { id, owner } = await req.json();
  const removed = await update((db) => {
    const before = db.posts?.length ?? 0;
    db.posts = (db.posts ?? []).filter((p) => !(p.id === id && p.owner === owner));
    return before !== db.posts.length;
  });
  return removed ? Response.json({ ok: true }) : Response.json({ error: "내가 쓴 글만 지울 수 있어요" }, { status: 403 });
}
