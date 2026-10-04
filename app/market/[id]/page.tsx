import Link from "next/link";
import { notFound } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { posts } from "@/lib/db";
import { img } from "@/lib/img";
import { Back } from "../../ui";
import DeletePost from "./delete-post";

export const dynamic = "force-dynamic";

const won = (n: number | null) => (n == null ? "가격 제안" : `${n.toLocaleString()}원`);

// 도감 앱 거래소 상세 화면 구성: 큰 카드 이미지 → 글쓴이 → 세트·번호 → 제목 → 가격·시세 보기 → 등록일 → 설명
export default async function Page({ params }: PageProps<"/market/[id]">) {
  const { id } = await params;
  const post = (await posts()).find((p) => p.id === id);
  if (!post) notFound();
  const user = await currentUser();
  const mine = Boolean(user && user.id === post.owner);
  const cardId = post.card?.id;
  const [cardName, setInfo] = (post.card?.name ?? "").split(/ \((.*)\)$/);
  const sell = post.kind === "sell";

  return (
    <main className="pt-3">
      <div className="px-5">
        <Back href="/market" />
        <div className="mt-2 flex h-80 items-center justify-center rounded-2xl bg-soft">
          {post.card?.image ? (
            <img src={img(post.card.image, 640)} alt={cardName} className="h-72 rounded-xl shadow-lg" />
          ) : (
            <span className="text-sm text-faint">이미지 없음</span>
          )}
        </div>
      </div>

      <div className="mt-5 flex items-center gap-3 bg-soft px-5 py-4">
        {post.authorImage ? <img src={post.authorImage} alt="" className="size-9 rounded-full object-cover" /> : <span className="size-9 rounded-full bg-line" />}
        <span className="flex-1 text-[16px] font-semibold">{post.author ?? "트레이너"}</span>
        {mine && <span className="text-[13px] text-sub">내 글</span>}
      </div>

      <div className="px-5">
        {setInfo && <p className="mt-5 text-[14px] text-sub">{setInfo}</p>}
        <h1 className="mt-1 text-[22px] font-bold">
          {post.title}
          <span className="ml-2 align-middle text-[15px] font-medium text-sub">
            {post.grade ?? "A급"} {post.qty ?? 1}장
          </span>
        </h1>

        <div className="mt-5 flex items-end justify-between">
          <div>
            <p className="text-[14px] text-sub">{sell ? "판매가" : "구매 희망가"}</p>
            <p className="text-[28px] font-extrabold">{won(post.price)}</p>
          </div>
          {cardId && (
            <Link href={`/dex/${cardId.slice(0, 9)}/${cardId}`} className="rounded-lg bg-soft px-3 py-2 text-[14px] font-semibold text-ink2">
              시세 보기
            </Link>
          )}
        </div>
        <p className="mt-3 text-[13px] text-sub">{new Date(post.createdAt).toLocaleString("ko-KR", { dateStyle: "long", timeStyle: "short" })} 등록</p>

        {post.contact && (
          <div className="mt-5 rounded-xl border border-line p-4">
            <p className="text-[13px] text-sub">{sell ? "구매 문의" : "판매 문의"}</p>
            <p className="mt-1 select-all break-all text-[15px] font-semibold">{post.contact}</p>
          </div>
        )}

        {post.body && (
          <>
            <h2 className="mt-8 text-[17px] font-bold">{sell ? "판매자 설명" : "구매자 설명"}</h2>
            <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed text-ink2">{post.body}</p>
          </>
        )}

        <p className="mt-8 rounded-xl bg-soft p-4 text-[12px] leading-relaxed text-sub">
          거래는 글쓴이와 직접 진행돼요. 포카파인더는 거래 당사자가 아니며, 입금 전에 상대 정보를 꼭 확인하세요.
        </p>
        {mine && <DeletePost id={post.id} />}
        <div className="h-6" />
      </div>
    </main>
  );
}
