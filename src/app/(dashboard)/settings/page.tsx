"use client";

import { useState, useEffect } from "react";
import { ProfileForm } from "@/components/settings/profile-form";
import { CategoryManager } from "@/components/settings/category-manager";
import { TagManager } from "@/components/settings/tag-manager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import type { Profile, Category, Tag } from "@/lib/types";

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return;

        const [profileRes, catRes, tagRes] = await Promise.all([
          supabase.from("profiles").select("*").eq("id", user.id).single(),
          fetch("/api/categories").then((r) => r.json()),
          fetch("/api/tags").then((r) => r.json()),
        ]);

        setProfile(profileRes.data);
        setCategories(catRes);
        setTags(tagRes);
      } catch (error) {
        console.error("Failed to fetch settings data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <Skeleton className="h-[400px] max-w-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Tabs defaultValue="profile" className="max-w-2xl">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="tags">Tags</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          {profile && <ProfileForm profile={profile} />}
        </TabsContent>

        <TabsContent value="categories">
          <CategoryManager categories={categories} />
        </TabsContent>

        <TabsContent value="tags">
          <TagManager tags={tags} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
