import { Wallet } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/50 px-4">
      <div className="flex items-center gap-2 mb-8">
        <Wallet className="h-8 w-8 text-primary" />
        <h1 className="text-2xl font-bold">SimplyWise</h1>
      </div>
      {children}
    </div>
  );
}
