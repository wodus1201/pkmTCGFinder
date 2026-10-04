// 포켓몬코리아 공식 자판기 지도(pokemonkorea.co.kr/card_vending_machine)가 쓰는 목록. 위치만 있고 재고는 없다.
const SOURCE = "https://calendar-1ut.pages.dev/scripts/venderlist.json";

export async function GET() {
  const res = await fetch(SOURCE, { next: { revalidate: 86400 } });
  if (!res.ok) return Response.json({ error: "자판기 목록을 못 불러왔어요" }, { status: 502 });
  const list: { id: string; name: string; addr: string; lat: number | null; lng: number | null }[] = await res.json();
  return Response.json({
    machines: list
      .filter((m) => Number.isFinite(m.lat) && Number.isFinite(m.lng)) // 좌표 없는 항목이 몇 개 섞여 있다
      .map(({ id, name, addr, lat, lng }) => ({ id, name, addr, lat, lng })),
  });
}
