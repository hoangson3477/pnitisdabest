import type { Metadata } from "next";

import QuizFlow from "@/components/quiz-flow";
import { endingStage } from "@/content/story";
import { getSiteContent } from "@/lib/content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Chơi story",
};

export default async function PlayPage() {
  const { club, stages } = await getSiteContent();

  return <QuizFlow club={club} stages={stages} ending={endingStage} />;
}
