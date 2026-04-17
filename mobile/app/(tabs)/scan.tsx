import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Image as ImageIcon,
  RotateCcw,
  Zap,
  ZapOff,
} from "lucide-react-native";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  createReceiptRecord,
  extractReceipt,
  signedReceiptUrl,
  updateReceiptRecord,
  uploadReceiptImage,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

type ScanPhase = "idle" | "uploading" | "extracting";

export default function ScanScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [flash, setFlash] = useState<"off" | "on">("off");
  const [phase, setPhase] = useState<ScanPhase>("idle");
  const cameraRef = useRef<CameraView>(null);

  if (!permission) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator color="white" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView className="flex-1 bg-black">
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-white text-xl font-semibold text-center">
            Allow camera access to scan receipts
          </Text>
          <Text className="text-white/70 text-sm text-center mt-2">
            SimplyWise uses the camera to capture receipts and extract expense
            details automatically.
          </Text>
          <Pressable
            onPress={requestPermission}
            className="mt-6 bg-brand-600 rounded-full px-6 py-3"
          >
            <Text className="text-white font-semibold">Grant access</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  async function processReceipt(uri: string) {
    if (!user) return;
    try {
      setPhase("uploading");
      const compressed = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1600 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );
      const { path } = await uploadReceiptImage(
        user.id,
        compressed.uri,
        "image/jpeg"
      );
      const receipt = await createReceiptRecord(path);

      setPhase("extracting");
      const signed = await signedReceiptUrl(path);
      if (!signed) throw new Error("Couldn't retrieve receipt URL");

      const ocr = await extractReceipt(signed);
      await updateReceiptRecord(receipt.id, {
        status: "completed",
        raw_ocr_text: ocr.raw_text ?? null,
        confidence: ocr.confidence ?? null,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push({
        pathname: "/expense/new",
        params: {
          receipt_id: receipt.id,
          vendor: ocr.vendor,
          date: ocr.date,
          total: String(ocr.total ?? 0),
          subtotal: ocr.subtotal != null ? String(ocr.subtotal) : "",
          tax: ocr.tax != null ? String(ocr.tax) : "",
          tip: ocr.tip != null ? String(ocr.tip) : "",
          suggested_category: ocr.suggested_category ?? "Other",
          items: JSON.stringify(ocr.items ?? []),
        },
      });
    } catch (err: unknown) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = err instanceof Error ? err.message : "Scan failed";
      Alert.alert("Couldn't scan receipt", msg);
    } finally {
      setPhase("idle");
    }
  }

  async function capture() {
    if (!cameraRef.current || phase !== "idle") return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const photo = await cameraRef.current.takePictureAsync({
      quality: 0.9,
      skipProcessing: false,
    });
    if (photo?.uri) await processReceipt(photo.uri);
  }

  async function pickFromGallery() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.9,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      await processReceipt(result.assets[0].uri);
    }
  }

  return (
    <View className="flex-1 bg-black">
      <CameraView
        ref={cameraRef}
        style={{ flex: 1 }}
        facing="back"
        flash={flash}
      />

      <SafeAreaView className="absolute inset-0" edges={["top", "bottom"]}>
        <View className="flex-row items-center justify-between px-4 pt-2">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-black/40 items-center justify-center"
          >
            <ArrowLeft size={20} color="white" />
          </Pressable>
          <Pressable
            onPress={() => setFlash(flash === "on" ? "off" : "on")}
            className="w-10 h-10 rounded-full bg-black/40 items-center justify-center"
          >
            {flash === "on" ? (
              <Zap size={20} color="#fbbf24" />
            ) : (
              <ZapOff size={20} color="white" />
            )}
          </Pressable>
        </View>

        <View className="flex-1 items-center justify-center pointer-events-none">
          <View className="w-72 h-96 border-2 border-white/60 rounded-3xl" />
          <Text className="text-white/80 text-sm mt-4">
            Line up the receipt inside the frame
          </Text>
        </View>

        <View className="px-8 pb-4 flex-row items-center justify-between">
          <Pressable
            onPress={pickFromGallery}
            disabled={phase !== "idle"}
            className="w-14 h-14 rounded-full bg-black/40 items-center justify-center"
          >
            <ImageIcon size={22} color="white" />
          </Pressable>

          <Pressable
            onPress={capture}
            disabled={phase !== "idle"}
            className="w-20 h-20 rounded-full bg-white items-center justify-center border-4 border-white/40 active:scale-95"
          >
            {phase !== "idle" ? (
              <ActivityIndicator color="#7c3aed" />
            ) : (
              <View className="w-16 h-16 rounded-full bg-white" />
            )}
          </Pressable>

          <Pressable
            onPress={() => router.push("/expense/new")}
            className="w-14 h-14 rounded-full bg-black/40 items-center justify-center"
          >
            <RotateCcw size={22} color="white" />
          </Pressable>
        </View>

        {phase !== "idle" ? (
          <View className="absolute inset-0 bg-black/60 items-center justify-center">
            <ActivityIndicator size="large" color="white" />
            <Text className="text-white mt-4 text-base">
              {phase === "uploading" ? "Uploading receipt…" : "Reading receipt…"}
            </Text>
          </View>
        ) : null}
      </SafeAreaView>
    </View>
  );
}
