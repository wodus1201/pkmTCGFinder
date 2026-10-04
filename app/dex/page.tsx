import { allSets, summarize } from "@/lib/cards";
import DexList from "./dex-list";

export const dynamic = "force-dynamic";

export default async function Page() {
  const sets = (await allSets()).map(summarize);
  return <DexList sets={sets} />;
}
