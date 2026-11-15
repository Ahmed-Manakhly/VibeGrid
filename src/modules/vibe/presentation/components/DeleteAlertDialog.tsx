"use client";

import { Loader2Icon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface DeleteAlertDialogProps {
    isDeleting: boolean;
    onDelete: () => Promise<void>;
    title?: string;
    description?: string;
}

export function DeleteAlertDialog({
        isDeleting,
        onDelete,
        title = "Delete Post",
        description = "This action cannot be undone.",
    }: DeleteAlertDialogProps) {
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:bg-transparent hover:text-destructive -mr-2">
                    {isDeleting ? (
                        <Loader2Icon className="size-4 animate-spin" />
                    ) : (
                        <Trash2Icon className="size-4" />
                    )}
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>{description}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel className="text-muted-foreground hover:bg-transparent hover:text-foreground sm:mt-0 bg-transparent border-none shadow-none">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onDelete}
                        className="bg-red-600 hover:bg-red-700 text-white font-semibold shadow-md border-none rounded-xl px-4 py-2 transition-colors disabled:opacity-50"
                        disabled={isDeleting}
                    >
                        {isDeleting ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}