"use client";

import { useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import type { Tag } from "@/lib/types";
import { toast } from "sonner";

interface TagManagerProps {
  tags: Tag[];
}

export function TagManager({ tags: initialTags }: TagManagerProps) {
  const [tags, setTags] = useState(initialTags);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#3b82f6");
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, color: newColor }),
      });
      if (!res.ok) throw new Error("Failed to create tag");
      const data = await res.json();
      setTags([...tags, data]);
      setNewName("");
      setNewColor("#3b82f6");
      setShowAdd(false);
      toast.success("Tag created!");
    } catch {
      toast.error("Failed to create tag");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (tagId: string) => {
    try {
      await fetch(`/api/tags`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: tagId }),
      });
      setTags(tags.filter((t) => t.id !== tagId));
      toast.success("Tag deleted!");
    } catch {
      toast.error("Failed to delete tag");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Tags</CardTitle>
            <CardDescription>Create tags to organize your expenses</CardDescription>
          </div>
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {tags.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-4">
            No tags yet. Create your first one!
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <div
                key={tag.id}
                className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm text-white"
                style={{ backgroundColor: tag.color }}
              >
                {tag.name}
                <button
                  onClick={() => handleDelete(tag.id)}
                  className="ml-1 rounded-full p-0.5 hover:bg-white/20 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Tag</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Tag name"
                />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer"
                  />
                  <Input
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button onClick={handleAdd} disabled={loading || !newName.trim()}>
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
