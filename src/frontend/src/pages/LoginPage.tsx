import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Ed25519KeyIdentity } from "@dfinity/identity";
import {
  ArrowLeft,
  Bot,
  Briefcase,
  CheckSquare,
  Compass,
  Eye,
  EyeOff,
  Loader2,
  MessageSquare,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { UserProfile } from "../backend";
import { useAuth } from "../context/AuthContext";
import { useLoginMutation, useRegisterMutation } from "../hooks/useQueries";

interface LoginPageProps {
  onBack?: () => void;
}

const FEATURES = [
  { icon: MessageSquare, label: "Team Messenger", desc: "Collaboration hub" },
  {
    icon: CheckSquare,
    label: "5W Activities",
    desc: "Structured task tracking",
  },
  {
    icon: Briefcase,
    label: "Business Suite",
    desc: "GST invoices & estimates",
  },
  { icon: Bot, label: "AI Assistant", desc: "Smart productivity" },
];

export default function LoginPage({ onBack }: LoginPageProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);

  const lastUsername =
    typeof window !== "undefined"
      ? localStorage.getItem("saarathi_last_username") || ""
      : "";

  const [form, setForm] = useState({
    username: lastUsername,
    password: "",
    displayName: "",
    businessName: "",
  });

  const { login } = useAuth();
  const loginMutation = useLoginMutation();
  const registerMutation = useRegisterMutation();

  const isPending = loginMutation.isPending || registerMutation.isPending;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      let profile: UserProfile;
      let identity: Ed25519KeyIdentity;

      if (mode === "login") {
        const result = await loginMutation.mutateAsync({
          username: form.username,
          password: form.password,
        });
        profile = result.profile;
        identity = result.identity;
      } else {
        const result = await registerMutation.mutateAsync({
          username: form.username,
          password: form.password,
          displayName: form.displayName,
          businessName: form.businessName,
        });
        profile = result.profile;
        identity = result.identity;
      }

      localStorage.setItem(
        "saarathi_last_username",
        form.username.toLowerCase(),
      );
      login(profile, identity);
      toast.success(
        mode === "login" ? "Welcome back!" : "Account created successfully!",
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      toast.error(msg);
    }
  }

  function switchMode() {
    setMode((m) => (m === "login" ? "register" : "login"));
    setForm({ username: "", password: "", displayName: "", businessName: "" });
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div
        className="hidden lg:flex flex-col justify-between w-1/2 px-12 py-10"
        style={{
          background:
            "linear-gradient(145deg, #b45309 0%, #92400e 45%, #78350f 100%)",
        }}
      >
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex-1 flex flex-col justify-center"
        >
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center border border-white/20">
              <Compass className="w-7 h-7 text-white" />
            </div>
            <div>
              <span className="font-black text-3xl text-white tracking-widest">
                SAARATHI
              </span>
              <div className="text-xs text-white/60 tracking-wider">
                AI-Powered Business Platform
              </div>
            </div>
          </div>

          <h1 className="text-4xl font-black text-white leading-snug mb-4">
            Your Business,
            <br />
            <span className="text-amber-200">Guided Forward.</span>
          </h1>
          <p className="text-base text-white/70 leading-relaxed max-w-sm mb-10">
            The all-in-one productivity platform built for Indian small
            businesses. Manage teams, track activities, create GST invoices, and
            get AI-powered guidance.
          </p>

          <div className="grid grid-cols-2 gap-3">
            {FEATURES.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="rounded-xl p-3 bg-white/10 border border-white/15 backdrop-blur"
                >
                  <Icon className="w-5 h-5 text-amber-200 mb-1.5" />
                  <div className="text-sm font-bold text-white">
                    {item.label}
                  </div>
                  <div className="text-xs text-white/50 mt-0.5">
                    {item.desc}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        <div className="text-xs text-white/40 mt-8">
          Created by{" "}
          <span className="text-white/70 font-semibold">Tattva Innovation</span>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 bg-[#0f0f0f]">
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-1.5 text-sm text-amber-400/70 hover:text-amber-400 transition-colors mb-6"
              data-ocid="auth.link"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </button>
          )}

          <div className="flex lg:hidden items-center gap-2 mb-8 justify-center">
            <div className="w-9 h-9 rounded-xl bg-amber-600 flex items-center justify-center">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <span className="font-black text-2xl text-white tracking-widest">
              SAARATHI
            </span>
          </div>

          <Card className="shadow-2xl border border-white/10 bg-[#1a1a1a]">
            <CardHeader className="pb-4">
              <h2 className="text-2xl font-black text-white">
                {mode === "login" ? "Welcome Back" : "Create Account"}
              </h2>
              <p className="text-sm text-white/40 mt-1">
                {mode === "login"
                  ? "Sign in to your SAARATHI workspace"
                  : "Set up your business workspace"}
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === "register" && (
                  <>
                    <div className="space-y-1.5">
                      <Label htmlFor="displayName" className="text-white/70">
                        Full Name
                      </Label>
                      <Input
                        id="displayName"
                        name="displayName"
                        placeholder="Rajesh Kumar"
                        value={form.displayName}
                        onChange={handleChange}
                        required
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/25 h-11"
                        data-ocid="auth.input"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="businessName" className="text-white/70">
                        Business Name
                      </Label>
                      <Input
                        id="businessName"
                        name="businessName"
                        placeholder="Kumar Enterprises"
                        value={form.businessName}
                        onChange={handleChange}
                        required
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/25 h-11"
                        data-ocid="auth.input"
                      />
                    </div>
                  </>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="username" className="text-white/70">
                    Username
                  </Label>
                  <Input
                    id="username"
                    name="username"
                    placeholder="rajesh_kumar"
                    value={form.username}
                    onChange={handleChange}
                    required
                    autoComplete="username"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/25 h-11"
                    data-ocid="auth.input"
                  />
                  {mode === "login" && form.username && (
                    <p className="text-xs text-amber-400/60">
                      Last session remembered — just enter your password
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-white/70">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={form.password}
                      onChange={handleChange}
                      required
                      autoFocus={!!form.username}
                      autoComplete={
                        mode === "login" ? "current-password" : "new-password"
                      }
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/25 pr-10 h-11"
                      data-ocid="auth.input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold h-11 text-base tracking-wide mt-2"
                  disabled={isPending}
                  data-ocid="auth.submit_button"
                >
                  {isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {isPending
                    ? "Please wait..."
                    : mode === "login"
                      ? "Sign In"
                      : "Create Account"}
                </Button>
              </form>

              <div className="mt-5 text-center text-sm text-white/40">
                {mode === "login" ? (
                  <>
                    New to SAARATHI?{" "}
                    <button
                      type="button"
                      onClick={switchMode}
                      className="text-amber-400 font-semibold hover:underline"
                      data-ocid="auth.toggle"
                    >
                      Create an account
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={switchMode}
                      className="text-amber-400 font-semibold hover:underline"
                      data-ocid="auth.toggle"
                    >
                      Sign in
                    </button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <p className="mt-8 text-xs text-white/20 text-center">
          © {new Date().getFullYear()} SAARATHI. Created by{" "}
          <span className="text-white/40 font-semibold">Tattva Innovation</span>
        </p>
      </div>
    </div>
  );
}
