import { type ReactNode } from "react";
import { ScrollView, View, type ScrollViewProps } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { cn } from "@/lib/utils";

interface ScreenProps {
  children: ReactNode;
  scrollable?: boolean;
  className?: string;
  contentClassName?: string;
  edges?: Array<"top" | "bottom" | "left" | "right">;
  refreshControl?: ScrollViewProps["refreshControl"];
}

export function Screen({
  children,
  scrollable = false,
  className,
  contentClassName,
  edges = ["top", "left", "right"],
  refreshControl,
}: ScreenProps) {
  const Body = scrollable ? ScrollView : View;
  return (
    <SafeAreaView
      edges={edges}
      className={cn("flex-1 bg-surface-subtle", className)}
    >
      <Body
        refreshControl={scrollable ? refreshControl : undefined}
        className={cn(scrollable ? "flex-1" : "flex-1", contentClassName)}
        contentContainerStyle={
          scrollable ? { paddingBottom: 32, flexGrow: 1 } : undefined
        }
        keyboardShouldPersistTaps={scrollable ? "handled" : undefined}
      >
        {children}
      </Body>
    </SafeAreaView>
  );
}
