import { forwardRef } from "react";
import { Text, TextInput, View, type TextInputProps } from "react-native";
import { cn } from "@/lib/utils";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helper?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  {
    label,
    error,
    helper,
    leftIcon,
    rightIcon,
    containerClassName,
    className,
    ...rest
  },
  ref
) {
  return (
    <View className={cn("w-full", containerClassName)}>
      {label ? (
        <Text className="text-sm font-medium text-ink mb-1.5">{label}</Text>
      ) : null}
      <View
        className={cn(
          "flex-row items-center rounded-xl border px-3 bg-white",
          error ? "border-red-500" : "border-surface-border"
        )}
      >
        {leftIcon ? <View className="mr-2">{leftIcon}</View> : null}
        <TextInput
          ref={ref}
          className={cn("flex-1 py-3 text-base text-ink", className)}
          placeholderTextColor="#9ca3af"
          {...rest}
        />
        {rightIcon ? <View className="ml-2">{rightIcon}</View> : null}
      </View>
      {error ? (
        <Text className="text-xs text-red-600 mt-1">{error}</Text>
      ) : helper ? (
        <Text className="text-xs text-ink-muted mt-1">{helper}</Text>
      ) : null}
    </View>
  );
});
