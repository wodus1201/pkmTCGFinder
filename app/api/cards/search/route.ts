import { allSets, search, setMeta } from "@/lib/cards";

/** ?q=검색어 또는 ?ids=카드ID,카드ID */
export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const sets = await allSets();
  const ids = params.get("ids");
  if (ids) {
    const want = new Set(ids.split(",").slice(0, 500));
    const cards = sets.flatMap((s) => s.cards.filter((c) => want.has(c.id)).map((c) => ({ ...c, setName: setMeta(s).short })));
    return Response.json({ cards });
  }
  return Response.json({ cards: search(sets, params.get("q") ?? "") });
}
