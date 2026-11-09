import { Skeleton } from "@/components/ui/skeleton";
import { AuthHeader } from "@/components/auth/AuthHeader";

export default function AuthLoading() {
  return (
    <div className="min-h-screen w-full flex flex-col bg-background relative selection:bg-accent selection:text-white">
      {/* Background Neon Ambient Glow Orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 size-[500px] rounded-full bg-accent/20 blur-[120px] animate-pulse" />
        <div className="absolute top-1/2 -right-40 size-[600px] rounded-full bg-primary/15 blur-[140px]" />
      </div>

      <AuthHeader />

      <main className="flex-1 w-full flex items-start justify-center pt-24 lg:pt-36 px-4 sm:px-8 lg:px-16 xl:px-32 pb-12 z-10">
        <div className="w-full max-w-6xl flex flex-col lg:grid lg:grid-cols-12 gap-6 lg:gap-10 items-stretch">
          
          {/* Left Hero Skeleton (Desktop) */}
          <div className="w-full lg:col-span-5 flex flex-col justify-between p-6 sm:p-8 rounded-3xl backdrop-blur-2xl bg-card/25 border border-white/10 shadow-sm relative overflow-hidden shrink-0 space-y-6">
            <div className="space-y-4">
              <Skeleton className="h-6 w-32 rounded-full" />
              <Skeleton className="h-10 w-3/4 rounded-xl" />
              <Skeleton className="h-4 w-full rounded-md" />
              <Skeleton className="h-4 w-2/3 rounded-md" />
            </div>

            <div className="space-y-3 my-6">
              <Skeleton className="h-14 w-full rounded-2xl" />
              <Skeleton className="h-14 w-full rounded-2xl" />
              <Skeleton className="h-14 w-full rounded-2xl" />
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center justify-between">
              <Skeleton className="h-4 w-20 rounded-md" />
              <Skeleton className="h-4 w-12 rounded-md" />
            </div>
          </div>

          {/* Right Form Card Skeleton */}
          <div className="w-full lg:col-span-7 flex flex-col justify-start shrink-0">
            <div className="w-full backdrop-blur-2xl bg-card/45 border border-accent/25 rounded-3xl p-6 sm:p-8 space-y-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-28 rounded-md" />
                <Skeleton className="h-7 w-48 rounded-lg" />
              </div>

              {/* Input Skeletons */}
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24 rounded-md" />
                  <Skeleton className="h-12 w-full rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24 rounded-md" />
                  <Skeleton className="h-12 w-full rounded-xl" />
                </div>
              </div>

              {/* Button Skeleton */}
              <Skeleton className="h-12 w-full rounded-xl mt-4" />

              {/* Divider & Social Buttons Skeletons */}
              <div className="space-y-3 pt-2">
                <Skeleton className="h-10 w-full rounded-xl" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
