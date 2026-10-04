import { allSets, search } from "@/lib/cards";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q") ?? "";
  return Response.json({ cards: search(await allSets(), q) });
}
