import { currentUser } from "@/lib/auth";

export async function GET() {
  return Response.json({ user: await currentUser(), kakao: Boolean(process.env.KAKAO_REST_API_KEY) });
}
