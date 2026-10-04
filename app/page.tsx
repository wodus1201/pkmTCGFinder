import { summaries } from "@/lib/covers";
import Home from "./home";
import { Slide } from "./ui";

export const dynamic = "force-dynamic";

export default async function Page() {
  return (
    <Slide>
      <Home sets={await summaries()} />
    </Slide>
  );
}
