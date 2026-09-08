"use client";

import * as React from "react";
import { z } from "zod";
import {
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuthStore } from "@/store/auth-store";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const DEMO_EMAIL = "alex@devflow.ai";
const DEMO_PASSWORD = "password";

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

interface LoginViewProps {
  onSwitchToRegister?: () => void;
}

export default function LoginView({ onSwitchToRegister }: LoginViewProps) {
  const { toast } = useToast();
  const login = useAuthStore((s) => s.login);

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [remember, setRemember] = React.useState(true);
  const [showPassword, setShowPassword] = React.useState(false);
  const [errors, setErrors] = React.useState<{ email?: string; password?: string; form?: string }>({});
  const [loading, setLoading] = React.useState(false);

  const validate = () => {
    const result = loginSchema.safeParse({ email, password });
    if (result.success) {
      setErrors({});
      return true;
    }
    const next: { email?: string; password?: string } = {};
    for (const issue of result.error.issues) {
      const key = issue.path[0] as "email" | "password";
      if (!next[key]) next[key] = issue.message;
    }
    setErrors(next);
    return false;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!validate()) return;

    setLoading(true);
    setErrors((p) => ({ ...p, form: undefined }));
    const res = await login(email.trim(), password);
    setLoading(false);

    if (res.ok) {
      const user = useAuthStore.getState().user;
      toast({
        title: "Welcome back",
        description: user?.name ?? "Signed in to DevFlow AI",
      });
    } else {
      const message = res.error ?? "Sign in failed.";
      setErrors((p) => ({ ...p, form: message }));
      toast({ title: "Sign in failed", description: message, variant: "destructive" });
    }
  };

  const fillDemo = () => {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    setErrors({});
  };

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="login-email" className="text-sm font-medium">
          Email
        </Label>
        <div className="relative">
          <Mail
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors((p) => ({ ...p, email: undefined }));
              if (errors.form) setErrors((p) => ({ ...p, form: undefined }));
            }}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "login-email-error" : undefined}
            className="h-10 pl-9"
          />
        </div>
        {errors.email && (
          <p id="login-email-error" className="text-xs text-destructive" role="alert">
            {errors.email}
          </p>
        )}
      </div>

      {/* Password */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="login-password" className="text-sm font-medium">
            Password
          </Label>
          <button
            type="button"
            onClick={() =>
              toast({ title: "Coming soon", description: "Password reset isn't enabled in the demo." })
            }
            className="text-xs font-medium text-muted-foreground transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 rounded"
          >
            Forgot password?
          </button>
        </div>
        <div className="relative">
          <Lock
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            id="login-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors((p) => ({ ...p, password: undefined }));
              if (errors.form) setErrors((p) => ({ ...p, form: undefined }));
            }}
            aria-invalid={!!errors.password || !!errors.form}
            aria-describedby={errors.password ? "login-password-error" : errors.form ? "login-form-error" : undefined}
            className="h-10 pl-9 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            className="absolute right-1.5 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && (
          <p id="login-password-error" className="text-xs text-destructive" role="alert">
            {errors.password}
          </p>
        )}
      </div>

      {/* Remember me + (forgot handled above) */}
      <div className="flex items-center gap-2">
        <Checkbox
          id="login-remember"
          checked={remember}
          onCheckedChange={(v) => setRemember(v === true)}
        />
        <Label htmlFor="login-remember" className="text-sm text-muted-foreground cursor-pointer">
          Remember me for 30 days
        </Label>
      </div>

      {/* Form-level error */}
      {errors.form && (
        <div
          id="login-form-error"
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
        >
          <span className="mt-0.5 font-medium">!</span>
          <span>{errors.form}</span>
        </div>
      )}

      {/* Submit */}
      <Button
        type="submit"
        disabled={loading}
        className={cn(
          "h-10 w-full bg-brand text-brand-foreground shadow-brand hover:bg-brand/90",
        )}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Signing in…
          </>
        ) : (
          <>
            Sign in
            <ArrowRight className="h-4 w-4" aria-hidden />
          </>
        )}
      </Button>

      {/* Demo credentials hint */}
      <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 px-3 py-2.5">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Demo credentials
          </p>
          <p className="truncate text-xs text-foreground/80">
            {DEMO_EMAIL} · {DEMO_PASSWORD}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={fillDemo}
          className="h-8 shrink-0"
        >
          Use demo
        </Button>
      </div>

      {/* Switch to register */}
      {onSwitchToRegister && (
        <p className="pt-1 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="font-medium text-brand transition-colors hover:text-brand/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 rounded"
          >
            Create one
          </button>
        </p>
      )}
    </form>
  );
}
