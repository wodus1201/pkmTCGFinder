import { summaries } from "@/lib/covers";
import DexList from "./dex-list";

export const dynamic = "force-dynamic";

export default async function Page() {
  const sets = await summaries();
  return <DexList sets={sets} />;
}
