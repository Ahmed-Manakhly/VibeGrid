import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-muted-foreground">
      <Loader2 className="size-8 animate-spin text-primary" />
      <p className="font-mono text-sm">Loading the grid...</p>
    </div>
  );
}
