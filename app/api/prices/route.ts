import { allSets } from "@/lib/cards";
import { setPrices } from "@/lib/prices";

/** ?sets=BS2025001,BS2025005 → { prices: { 카드ID: 원 } } */
export async function GET(req: Request) {
  const ids = (new URL(req.url).searchParams.get("sets") ?? "").split(",").filter(Boolean).slice(0, 30);
  const sets = (await allSets()).filter((s) => ids.includes(s.id));
  const prices: Record<string, number> = {};
  for (const s of sets) {
    try {
      Object.assign(prices, await setPrices(s));
    } catch (e) {
      console.error("[prices]", s.id, e);
    }
  }
  return Response.json({ prices });
}
