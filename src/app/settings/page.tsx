import { getCurrentSession } from "@/lib/auth/server";
import { getProfileUseCase } from "@/shared/infrastructure/di-container";
import { redirect } from "next/navigation";
import SettingsPageClient from "./SettingsPageClient";
import { generatePageMetadata } from "@/lib/seo";

export const metadata = generatePageMetadata({
  title: "Account Settings & Policy Center",
  description: "Manage developer account, notification preferences, security tokens, and view VibeGrid platform policies.",
  url: "/settings",
  noIndex: true,
});

export default async function SettingsPage() {
  const session = await getCurrentSession();
  if (!session.isAuthenticated || !session.user) {
    redirect("/login");
  }

  const dbUser = await getProfileUseCase.execute(session.user.username || session.user.id).catch(() => null);

  if (!dbUser) {
    redirect("/login");
  }

  return <SettingsPageClient user={dbUser} />;
}
