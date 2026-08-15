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
      className="mb-4 text-primary hover:text-foreground pl-0 group hover:bg-transparent transition-colors text-sm font-medium"
      onClick={() => router.back()}
    >
      <ArrowLeftIcon className="mr-1 size-4 transition-transform group-hover:-translate-x-1" />
      <span className="group-hover:underline">Back</span>
    </Button>
  );
}
