import { notFound } from "next/navigation";
import { allSets, setMeta } from "@/lib/cards";
import SetView from "./set-view";

export const dynamic = "force-dynamic";

export default async function Page({ params }: PageProps<"/dex/[setId]">) {
  const { setId } = await params;
  const set = (await allSets()).find((s) => s.id === setId);
  if (!set) notFound();
  return <SetView set={set} meta={setMeta(set)} />;
}
