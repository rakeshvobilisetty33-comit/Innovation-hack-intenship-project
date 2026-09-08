"use client";

import * as React from "react";
import { z } from "zod";
import {
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  User,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuthStore } from "@/store/auth-store";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().min(1, "Email is required").email("Enter a valid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirm: z.string().min(1, "Please confirm your password"),
    terms: z.literal(true, {
      message: "You must accept the Terms to continue",
    }),
  })
  .refine((d) => d.password === d.confirm, {
    path: ["confirm"],
    message: "Passwords do not match",
  });

type RegisterErrors = Partial<
  Record<keyof z.infer<typeof registerSchema>, string> & { form?: string }
>;

/** Visual-only password strength meter. Returns 0-4 score. */
function passwordScore(pw: string): number {
  let score = 0;
  if (pw.length >= 6) score += 1;
  if (pw.length >= 10) score += 1;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score += 1;
  if (/\d/.test(pw) || /[^a-zA-Z0-9]/.test(pw)) score += 1;
  return Math.min(score, 4);
}

const STRENGTH_META = [
  { label: "Too short", bar: "bg-muted-foreground/40", text: "text-muted-foreground" },
  { label: "Weak", bar: "bg-destructive", text: "text-destructive" },
  { label: "Fair", bar: "bg-chart-3", text: "text-chart-3" },
  { label: "Good", bar: "bg-chart-2", text: "text-chart-2" },
  { label: "Strong", bar: "bg-brand", text: "text-brand" },
];

interface RegisterViewProps {
  onSwitchToLogin?: () => void;
}

export default function RegisterView({ onSwitchToLogin }: RegisterViewProps) {
  const { toast } = useToast();
  const register = useAuthStore((s) => s.register);

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [terms, setTerms] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [errors, setErrors] = React.useState<RegisterErrors>({});
  const [loading, setLoading] = React.useState(false);

  const score = passwordScore(password);
  const strength = STRENGTH_META[score];

  const validate = () => {
    const result = registerSchema.safeParse({
      name,
      email,
      password,
      confirm,
      terms: terms ? (true as const) : (undefined as never),
    });
    if (result.success) {
      setErrors({});
      return true;
    }
    const next: RegisterErrors = {};
    for (const issue of result.error.issues) {
      const key = issue.path[0] as keyof RegisterErrors;
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
    const res = await register(name.trim(), email.trim(), password);
    setLoading(false);

    if (res.ok) {
      toast({
        title: "Account created",
        description: "Welcome to DevFlow AI",
      });
    } else {
      const message = res.error ?? "Registration failed.";
      setErrors((p) => ({ ...p, form: message }));
      toast({ title: "Registration failed", description: message, variant: "destructive" });
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {/* Full name */}
      <div className="space-y-2">
        <Label htmlFor="register-name" className="text-sm font-medium">
          Full name
        </Label>
        <div className="relative">
          <User
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            id="register-name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="Alex Rivera"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors((p) => ({ ...p, name: undefined }));
            }}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "register-name-error" : undefined}
            className="h-10 pl-9"
          />
        </div>
        {errors.name && (
          <p id="register-name-error" className="text-xs text-destructive" role="alert">
            {errors.name}
          </p>
        )}
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="register-email" className="text-sm font-medium">
          Email
        </Label>
        <div className="relative">
          <Mail
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            id="register-email"
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
            aria-invalid={!!errors.email || !!errors.form}
            aria-describedby={
              errors.email
                ? "register-email-error"
                : errors.form
                  ? "register-form-error"
                  : undefined
            }
            className="h-10 pl-9"
          />
        </div>
        {errors.email ? (
          <p id="register-email-error" className="text-xs text-destructive" role="alert">
            {errors.email}
          </p>
        ) : null}
      </div>

      {/* Password */}
      <div className="space-y-2">
        <Label htmlFor="register-password" className="text-sm font-medium">
          Password
        </Label>
        <div className="relative">
          <Lock
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            id="register-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors((p) => ({ ...p, password: undefined }));
            }}
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "register-password-error" : "register-strength"}
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
        {/* Strength meter (visual only) */}
        <div
          id="register-strength"
          className="flex items-center gap-2"
          aria-hidden={!!errors.password}
        >
          <div className="grid flex-1 grid-cols-4 gap-1">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={cn(
                  "h-1 rounded-full transition-colors",
                  i < score ? strength.bar : "bg-muted",
                )}
              />
            ))}
          </div>
          {password.length > 0 && (
            <span className={cn("text-[11px] font-medium tabular-nums", strength.text)}>
              {strength.label}
            </span>
          )}
        </div>
        {errors.password && (
          <p id="register-password-error" className="text-xs text-destructive" role="alert">
            {errors.password}
          </p>
        )}
      </div>

      {/* Confirm password */}
      <div className="space-y-2">
        <Label htmlFor="register-confirm" className="text-sm font-medium">
          Confirm password
        </Label>
        <div className="relative">
          <Lock
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            id="register-confirm"
            name="confirm"
            type={showConfirm ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Re-enter your password"
            value={confirm}
            onChange={(e) => {
              setConfirm(e.target.value);
              if (errors.confirm) setErrors((p) => ({ ...p, confirm: undefined }));
            }}
            aria-invalid={!!errors.confirm}
            aria-describedby={errors.confirm ? "register-confirm-error" : undefined}
            className="h-10 pl-9 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowConfirm((v) => !v)}
            aria-label={showConfirm ? "Hide password" : "Show password"}
            aria-pressed={showConfirm}
            className="absolute right-1.5 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.confirm && (
          <p id="register-confirm-error" className="text-xs text-destructive" role="alert">
            {errors.confirm}
          </p>
        )}
      </div>

      {/* Terms checkbox */}
      <div className="space-y-2">
        <div className="flex items-start gap-2.5">
          <Checkbox
            id="register-terms"
            checked={terms}
            onCheckedChange={(v) => {
              setTerms(v === true);
              if (errors.terms) setErrors((p) => ({ ...p, terms: undefined }));
            }}
            aria-invalid={!!errors.terms}
            aria-describedby={errors.terms ? "register-terms-error" : undefined}
            className="mt-0.5"
          />
          <Label
            htmlFor="register-terms"
            className="text-sm leading-relaxed text-muted-foreground cursor-pointer"
          >
            I agree to the{" "}
            <span className="font-medium text-foreground/80">Terms of Service</span> and{" "}
            <span className="font-medium text-foreground/80">Privacy Policy</span>.
          </Label>
        </div>
        {errors.terms && (
          <p id="register-terms-error" className="text-xs text-destructive" role="alert">
            {errors.terms}
          </p>
        )}
      </div>

      {/* Form-level error */}
      {errors.form && (
        <div
          id="register-form-error"
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
        className="h-10 w-full bg-brand text-brand-foreground shadow-brand hover:bg-brand/90"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Creating account…
          </>
        ) : (
          <>
            <ShieldCheck className="h-4 w-4" aria-hidden />
            Create account
            <ArrowRight className="h-4 w-4" aria-hidden />
          </>
        )}
      </Button>

      {/* Switch to login */}
      {onSwitchToLogin && (
        <p className="pt-1 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="font-medium text-brand transition-colors hover:text-brand/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 rounded"
          >
            Sign in
          </button>
        </p>
      )}
    </form>
  );
}
