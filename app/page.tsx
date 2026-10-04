import { allSets, summarize } from "@/lib/cards";
import Home from "./home";

export const dynamic = "force-dynamic";

export default async function Page() {
  return <Home sets={(await allSets()).map(summarize)} />;
}
