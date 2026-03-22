import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Compass, Eye, EyeOff, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { UserProfile } from "../backend";
import { useAuth } from "../context/AuthContext";
import { useLoginMutation, useRegisterMutation } from "../hooks/useQueries";

interface LoginPageProps {
  onShowLanding?: () => void;
}

export default function LoginPage({ onShowLanding }: LoginPageProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    username: "",
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
      if (mode === "login") {
        profile = await loginMutation.mutateAsync({
          username: form.username,
          password: form.password,
        });
      } else {
        profile = await registerMutation.mutateAsync({
          username: form.username,
          password: form.password,
          displayName: form.displayName,
          businessName: form.businessName,
        });
      }
      login(profile);
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
      {/* Left panel — brand */}
      <div
        className="hidden lg:flex flex-col justify-center items-start w-1/2 px-16 py-12"
        style={{
          background:
            "linear-gradient(145deg, oklch(0.20 0.06 258) 0%, oklch(0.26 0.08 258) 100%)",
        }}
      >
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
              <Compass className="w-7 h-7 text-primary-foreground" />
            </div>
            <span className="font-display text-3xl font-bold text-white tracking-wide">
              SAARATHI
            </span>
          </div>
          <h1 className="font-display text-5xl font-bold text-white leading-tight mb-4">
            Your Business,
            <br />
            <span className="text-primary">Guided Forward.</span>
          </h1>
          <p className="text-lg text-white/70 leading-relaxed max-w-sm">
            The all-in-one productivity platform built for Indian small
            businesses. Manage teams, track activities, create GST invoices, and
            get AI-powered guidance.
          </p>
          <div className="mt-12 grid grid-cols-2 gap-4">
            {[
              { label: "Messenger", desc: "Team collaboration" },
              { label: "5W Activities", desc: "Structured task tracking" },
              { label: "Business Suite", desc: "GST invoices & estimates" },
              { label: "AI Assistant", desc: "Smart productivity tips" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl p-3 bg-white/5 border border-white/10"
              >
                <div className="text-sm font-semibold text-white">
                  {item.label}
                </div>
                <div className="text-xs text-white/50 mt-0.5">{item.desc}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 bg-background">
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          {/* Mobile brand */}
          <div className="flex lg:hidden items-center gap-2 mb-8 justify-center">
            <div className="w-9 h-9 rounded-lg bg-sidebar flex items-center justify-center">
              <Compass className="w-5 h-5 text-primary" />
            </div>
            <span className="font-display text-2xl font-bold text-foreground">
              SAARATHI
            </span>
          </div>

          <Card className="shadow-card border-border">
            <CardHeader className="pb-4">
              <h2 className="font-display text-2xl font-bold text-foreground">
                {mode === "login" ? "Welcome Back" : "Create Account"}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
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
                      <Label htmlFor="displayName">Full Name</Label>
                      <Input
                        id="displayName"
                        name="displayName"
                        placeholder="Rajesh Kumar"
                        value={form.displayName}
                        onChange={handleChange}
                        required
                        data-ocid="auth.input"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="businessName">Business Name</Label>
                      <Input
                        id="businessName"
                        name="businessName"
                        placeholder="Kumar Enterprises"
                        value={form.businessName}
                        onChange={handleChange}
                        required
                        data-ocid="auth.input"
                      />
                    </div>
                  </>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    name="username"
                    placeholder="rajesh_kumar"
                    value={form.username}
                    onChange={handleChange}
                    required
                    autoComplete="username"
                    data-ocid="auth.input"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={form.password}
                      onChange={handleChange}
                      required
                      autoComplete={
                        mode === "login" ? "current-password" : "new-password"
                      }
                      className="pr-10"
                      data-ocid="auth.input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
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

              <div className="mt-5 text-center text-sm text-muted-foreground">
                {mode === "login" ? (
                  <>
                    New to SAARATHI?{" "}
                    <button
                      type="button"
                      onClick={switchMode}
                      className="text-primary font-semibold hover:underline"
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
                      className="text-primary font-semibold hover:underline"
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

        {onShowLanding && (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={onShowLanding}
              className="text-sm text-primary/70 hover:text-primary font-medium transition-colors inline-flex items-center gap-1"
              data-ocid="auth.link"
            >
              See how SAARATHI works →
            </button>
          </div>
        )}

        <p className="mt-8 text-xs text-muted-foreground text-center">
          © {new Date().getFullYear()}. Built with ♥ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline text-primary"
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </div>
  );
}
