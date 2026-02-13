"use client";

import { Menu } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { getInitials } from "@/lib/utils";
import Link from "next/link";
import type { Profile } from "@/lib/types";

interface HeaderProps {
  profile: Profile | null;
  onMenuClick: () => void;
}

export function Header({ profile, onMenuClick }: HeaderProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="flex h-16 items-center justify-between border-b px-4 lg:px-6 bg-background">
      <button
        onClick={onMenuClick}
        className="lg:hidden rounded-md p-2 hover:bg-accent"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex-1" />

      <DropdownMenu>
        <DropdownMenuTrigger className="focus:outline-none">
          <Avatar
            src={profile?.avatar_url}
            alt={profile?.full_name || "User"}
            fallback={getInitials(profile?.full_name || profile?.email || "U")}
            size="sm"
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <div className="px-2 py-1.5">
            <p className="text-sm font-medium">{profile?.full_name || "User"}</p>
            <p className="text-xs text-muted-foreground">{profile?.email}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push("/settings")}>
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut}>
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
