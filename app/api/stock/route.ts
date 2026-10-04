import { BlockedError, nearbyStock } from "@/lib/emart24";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const lat = Number(q.get("lat"));
  const lng = Number(q.get("lng"));
  const radius = Math.min(Number(q.get("radius")) || 1500, 5000);
  if (!lat || !lng) return Response.json({ error: "lat, lng가 필요해요" }, { status: 400 });
  try {
    return Response.json({ stores: await nearbyStock(lat, lng, radius) });
  } catch (e) {
    if (e instanceof BlockedError) return Response.json({ error: e.message }, { status: 503 });
    console.error("[stock]", e);
    return Response.json({ error: "이마트24 재고 조회에 실패했어요" }, { status: 502 });
  }
}
