import { readFile } from "node:fs/promises";
import { allSets, setMeta } from "@/lib/cards";
import { closest, fingerprint, type Print } from "@/lib/fingerprint";

let prints: Record<string, Print> | null = null;

/** 사진(form-data "image")과 가장 비슷한 카드 후보 6장 */
export async function POST(req: Request) {
  const file = (await req.formData()).get("image");
  if (!(file instanceof Blob) || file.size > 15_000_000) return Response.json({ error: "사진을 다시 찍어 주세요" }, { status: 400 });
  try {
    prints ??= JSON.parse(await readFile("data/prints.json", "utf8"));
  } catch {
    return Response.json({ error: "카드 지문이 아직 없어요. scripts/hash-cards.ts를 실행해 주세요." }, { status: 503 });
  }
  const hits = closest(await fingerprint(Buffer.from(await file.arrayBuffer()), { photo: true }), prints!);
  const sets = await allSets();
  const cards = hits.flatMap(({ id }) => {
    const s = sets.find((x) => x.id === id.slice(0, 9));
    const c = s?.cards.find((x) => x.id === id);
    return s && c ? [{ ...c, setName: setMeta(s).short }] : [];
  });
  return Response.json({ cards });
}
