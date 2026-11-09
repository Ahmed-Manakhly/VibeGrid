import { PageHeader } from "@/components/PageHeader";
import { Users, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Communities | VibeGrid",
  description: "Developer hubs, tech circles, and builder ecosystems on VibeGrid",
};

export default function CommunitiesPage() {
  return (
    <div className="w-full max-w-4xl py-2 px-0 space-y-6">
      <PageHeader
        eyebrow="BUILDER NETWORKS"
        title="Communities"
        subtitle="Developer hubs, tech circles, and collective spaces designed for high-signal engineering collaboration."
        icon={Users}
      />

      <div className="text-center py-20 bg-card/60 rounded-2xl border border-border/50 p-8 shadow-sm">
        <div className="flex justify-center mb-4 text-primary">
          <div className="p-4 rounded-full bg-primary/10 border border-primary/20">
            <Users className="size-12 opacity-80" />
          </div>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-mono font-medium mb-4">
          <Sparkles className="size-3.5" />
          <span>Coming Soon</span>
        </div>
        <h3 className="text-2xl font-bold text-foreground mb-2">Developer Communities are Loading</h3>
        <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
          We are building dedicated developer guilds, framework circles, and open-source tribes. Stay tuned as we launch in the next iteration.
        </p>
        <Button asChild className="btn-gradient">
          <Link href="/explore">Explore Vibes Across the Grid</Link>
        </Button>
      </div>
    </div>
  );
}
