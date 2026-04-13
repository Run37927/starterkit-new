import MaxWidthWrapper from "@/components/MaxWidthWrapper";
import { FeedbackPop } from "@/components/ui/feedback-pop";
import { auth } from "@/auth";
import prisma from "@/lib/db";

export default async function Home() {
  const session = await auth();

  return (
    <MaxWidthWrapper className="mb-12 mt-8">
      <h1>insert body here</h1>

      <FeedbackPop />
    </MaxWidthWrapper>
  );
}