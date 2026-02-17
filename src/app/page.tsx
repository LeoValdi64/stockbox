import { auth } from "@clerk/nextjs/server";
import { LandingContent } from "@/components/landing-content";

export default async function LandingPage() {
  let isSignedIn = false;
  try {
    const { userId } = await auth();
    isSignedIn = !!userId;
  } catch {
    isSignedIn = false;
  }

  return <LandingContent isSignedIn={isSignedIn} />;
}
