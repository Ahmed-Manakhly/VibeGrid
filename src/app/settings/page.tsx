import { getCurrentSession } from "@/lib/auth/server";
import { prisma } from "@/shared/infrastructure/prisma";
import { redirect } from "next/navigation";
import SettingsPageClient from "./SettingsPageClient";

export default async function SettingsPage() {
  const session = await getCurrentSession();
  if (!session.isAuthenticated || !session.user) {
    redirect("/login");
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      username: true,
      bio: true,
      location: true,
      website: true,
      image: true,
      role: true,
      createdAt: true,
    },
  });

  if (!dbUser) {
    redirect("/login");
  }

  return <SettingsPageClient user={dbUser} />;
}
