import { View, type ViewProps } from "react-native";
import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
  ...rest
}: ViewProps & { className?: string }) {
  return (
    <View
      className={cn(
        "bg-white rounded-2xl border border-surface-border p-4",
        className
      )}
      {...rest}
    >
      {children}
    </View>
  );
}
