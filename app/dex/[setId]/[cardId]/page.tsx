import { notFound } from "next/navigation";
import { allSets, setMeta } from "@/lib/cards";
import CardView from "./card-view";

export const dynamic = "force-dynamic";

export default async function Page({ params }: PageProps<"/dex/[setId]/[cardId]">) {
  const { setId, cardId } = await params;
  const set = (await allSets()).find((s) => s.id === setId);
  const card = set?.cards.find((c) => c.id === cardId);
  if (!set || !card) notFound();
  const i = set.cards.indexOf(card);
  const others = [...set.cards.slice(i + 1), ...set.cards.slice(0, i)].slice(0, 12);
  return <CardView card={card} setId={set.id} meta={setMeta(set)} others={others} order={set.cards.map((c) => c.id)} />;
}
