import { cookies } from "next/headers";
import { SESSION } from "@/lib/auth";

export async function POST() {
  (await cookies()).delete(SESSION);
  return Response.json({ ok: true });
}
