import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
export function BackToDashboardButton() {
  return (
    <Link href="/pm">
      <Button variant="outline" size="sm" className="gap-2 hover:bg-accent">
        <ArrowLeft className="h-4 w-4" />
        Panel PM
      </Button>
    </Link>
  );
}