"use client"
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { ArrowLeftIcon } from "lucide-react";

export function BackButton() {
  const router = useRouter();

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      className="mb-4 text-muted-foreground hover:text-foreground pl-0 group hover:bg-transparent"
      onClick={() => router.back()}
    >
      <ArrowLeftIcon className="mr-2 size-4 transition-transform group-hover:-translate-x-1" />
      Back
    </Button>
  );
}
