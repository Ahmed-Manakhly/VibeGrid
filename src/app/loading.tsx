import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6 w-full max-w-2xl mt-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex flex-col gap-4 p-4 rounded-2xl border border-border/50 bg-card/50">
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 rounded-full" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-32 rounded-md" />
              <Skeleton className="h-3 w-20 rounded-md" />
            </div>
          </div>
          <Skeleton className="h-4 w-full rounded-md mt-2" />
          <Skeleton className="h-4 w-[90%] rounded-md" />
          <Skeleton className="h-4 w-[60%] rounded-md" />
          
          <div className="flex items-center gap-4 mt-4">
            <Skeleton className="h-8 w-16 rounded-full" />
            <Skeleton className="h-8 w-16 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
