import { summaries } from "@/lib/covers";
import DexList from "./dex-list";
import { Slide } from "../ui";

export const dynamic = "force-dynamic";

export default async function Page() {
  const sets = await summaries();
  return (
    <Slide>
      <DexList sets={sets} />
    </Slide>
  );
}
