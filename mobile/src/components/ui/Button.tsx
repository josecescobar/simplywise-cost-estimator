import {
  ActivityIndicator,
  Pressable,
  Text,
  type PressableProps,
} from "react-native";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "destructive";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends PressableProps {
  title: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
  textClassName?: string;
  fullWidth?: boolean;
}

const variantStyles: Record<Variant, string> = {
  primary: "bg-brand-600 active:bg-brand-700",
  secondary: "bg-surface-muted active:bg-surface-border",
  outline: "bg-white border border-surface-border active:bg-surface-subtle",
  ghost: "bg-transparent active:bg-surface-muted",
  destructive: "bg-red-600 active:bg-red-700",
};

const variantTextStyles: Record<Variant, string> = {
  primary: "text-white",
  secondary: "text-ink",
  outline: "text-ink",
  ghost: "text-ink",
  destructive: "text-white",
};

const sizeStyles: Record<Size, string> = {
  sm: "px-3 py-2 rounded-lg",
  md: "px-4 py-3 rounded-xl",
  lg: "px-5 py-4 rounded-2xl",
};

const sizeTextStyles: Record<Size, string> = {
  sm: "text-sm font-medium",
  md: "text-base font-semibold",
  lg: "text-lg font-semibold",
};

export function Button({
  title,
  variant = "primary",
  size = "md",
  loading,
  disabled,
  leftIcon,
  rightIcon,
  className,
  textClassName,
  fullWidth,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      className={cn(
        "flex-row items-center justify-center",
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && "w-full",
        isDisabled && "opacity-50",
        className
      )}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" || variant === "destructive" ? "#fff" : "#111"}
          size="small"
        />
      ) : (
        <>
          {leftIcon ? <>{leftIcon}</> : null}
          <Text
            className={cn(
              variantTextStyles[variant],
              sizeTextStyles[size],
              leftIcon ? "ml-2" : null,
              rightIcon ? "mr-2" : null,
              textClassName
            )}
          >
            {title}
          </Text>
          {rightIcon ? <>{rightIcon}</> : null}
        </>
      )}
    </Pressable>
  );
}
