import { summaries } from "@/lib/covers";
import Home from "./home";

export const dynamic = "force-dynamic";

export default async function Page() {
  return <Home sets={await summaries()} />;
}
