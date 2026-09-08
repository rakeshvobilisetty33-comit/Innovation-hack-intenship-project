"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Bell,
  ChevronRight,
  KeyRound,
  MonitorCog,
  ShieldCheck,
  Trash2,
  User as UserIcon,
  Check,
  Eye,
  EyeOff,
} from "lucide-react";

import { AppearanceSettings } from "@/components/settings/appearance-settings";
import { ConfirmDialog } from "@/components/common/confirm-dialog";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import { useAuthStore } from "@/store/auth-store";
import { useUIStore } from "@/store/ui-store";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// Tiny localStorage hook (kept inline per contract — no new store created).
function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = React.useState<T>(() => {
    if (typeof window === "undefined") return initial;
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });

  React.useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore
    }
  }, [key, value]);

  return [value, setValue] as const;
}

type SettingsTab = "appearance" | "profile" | "notifications" | "account";

interface NavItem {
  id: SettingsTab;
  label: string;
  description: string;
  Icon: React.ComponentType<{ className?: string }>;
}

const NAV: NavItem[] = [
  { id: "appearance", label: "Appearance", description: "Theme & visuals", Icon: MonitorCog },
  { id: "profile", label: "Profile", description: "Your public info", Icon: UserIcon },
  { id: "notifications", label: "Notifications", description: "Channels & cadence", Icon: Bell },
  { id: "account", label: "Account", description: "Security & danger zone", Icon: ShieldCheck },
];

const NOTIFICATION_KEYS = [
  "email",
  "push",
  "inApp",
  "weeklyDigest",
  "taskReminders",
] as const;
type NotificationKey = (typeof NOTIFICATION_KEYS)[number];

const NOTIFICATION_LABELS: Record<NotificationKey, { title: string; description: string }> = {
  email: { title: "Email notifications", description: "Receive updates and digests by email." },
  push: { title: "Push notifications", description: "Get real-time alerts on your devices." },
  inApp: { title: "In-app notifications", description: "Show notifications inside DevFlow AI." },
  weeklyDigest: { title: "Weekly digest", description: "A Monday summary of your work." },
  taskReminders: { title: "Task reminders", description: "Nudges for upcoming and overdue tasks." },
};

export default function SettingsView() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const setView = useUIStore((s) => s.setView);
  const { toast } = useToast();

  const [tab, setTab] = React.useState<SettingsTab>("appearance");

  // Notification prefs persisted to localStorage (no new store).
  const [prefs, setPrefs] = useLocalStorage<Record<NotificationKey, boolean>>(
    "devflow-notif-prefs",
    {
      email: true,
      push: false,
      inApp: true,
      weeklyDigest: true,
      taskReminders: true,
    },
  );

  function updatePref(key: NotificationKey, value: boolean) {
    setPrefs((p) => ({ ...p, [key]: value }));
    toast({ title: "Preferences saved" });
  }

  // Password form (mock).
  const [current, setCurrent] = React.useState("");
  const [next, setNext] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [showPw, setShowPw] = React.useState(false);
  const [pwTouched, setPwTouched] = React.useState(false);

  const pwValid =
    current.length >= 1 &&
    next.length >= 8 &&
    next === confirm &&
    next !== current;

  function submitPassword(e: React.FormEvent) {
    e.preventDefault();
    setPwTouched(true);
    if (!pwValid) return;
    toast({ title: "Password changed (demo)", description: "Your password has been updated." });
    setCurrent("");
    setNext("");
    setConfirm("");
    setPwTouched(false);
  }

  // Delete account
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  function handleDelete() {
    setConfirmOpen(false);
    logout();
    toast({ title: "Account deleted (demo)", description: "You have been signed out." });
  }

  return (
    <div className="flex min-h-full flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your appearance, profile, notifications and account.
        </p>
      </header>

      <Tabs value={tab} onValueChange={(v) => setTab(v as SettingsTab)} className="gap-6">
        {/* Desktop vertical nav / mobile horizontal scrollable tab list */}
        <div className="lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-8">
          <div className="mb-4 lg:mb-0">
            {/* Mobile: horizontal scroll */}
            <TabsList
              aria-label="Settings sections"
              className="flex w-full gap-1 overflow-x-auto p-1 lg:hidden scrollbar-thin"
            >
              {NAV.map(({ id, label, Icon }) => (
                <TabsTrigger key={id} value={id} className="gap-1.5 whitespace-nowrap">
                  <Icon className="h-4 w-4" aria-hidden />
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Desktop: vertical nav rendered as a button list (still within Tabs for state sync) */}
            <nav
              aria-label="Settings sections"
              className="hidden lg:block"
            >
              <ul className="flex flex-col gap-1">
                {NAV.map(({ id, label, description, Icon }) => {
                  const active = tab === id;
                  return (
                    <li key={id}>
                      <button
                        type="button"
                        onClick={() => setTab(id)}
                        aria-current={active ? "true" : undefined}
                        className={cn(
                          "group flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                          active
                            ? "border-brand/30 bg-brand/5 shadow-soft"
                            : "border-transparent hover:bg-accent/50",
                        )}
                      >
                        <span
                          className={cn(
                            "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors",
                            active ? "bg-brand text-brand-foreground" : "bg-muted text-muted-foreground",
                          )}
                          aria-hidden
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium">{label}</span>
                          <span className="block text-xs text-muted-foreground">{description}</span>
                        </span>
                        <ChevronRight
                          className={cn(
                            "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                            active && "text-brand",
                          )}
                          aria-hidden
                        />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>

          {/* Section content */}
          <div className="min-w-0">
            <TabsContent value="appearance" tabIndex={-1}>
              <SectionCard
                title="Appearance"
                description="Personalize how DevFlow AI looks on this device."
              >
                <AppearanceSettings />
              </SectionCard>
            </TabsContent>

            <TabsContent value="profile" tabIndex={-1}>
              <SectionCard
                title="Profile"
                description="Update your public profile information."
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-brand/10 text-brand">
                      <UserIcon className="h-5 w-5" aria-hidden />
                    </span>
                    <div>
                      <p className="text-sm font-medium">{user?.name ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">
                        {user?.role || "Member"} · {user?.email}
                      </p>
                    </div>
                  </div>
                  <Button onClick={() => setView("profile")} variant="outline">
                    Edit profile
                    <ChevronRight className="h-4 w-4" aria-hidden />
                  </Button>
                </div>
              </SectionCard>
            </TabsContent>

            <TabsContent value="notifications" tabIndex={-1}>
              <SectionCard
                title="Notifications"
                description="Choose which updates you want to receive."
              >
                <ul className="divide-y divide-border">
                  {NOTIFICATION_KEYS.map((key) => {
                    const { title, description } = NOTIFICATION_LABELS[key];
                    const id = `notif-${key}`;
                    return (
                      <li
                        key={key}
                        className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
                      >
                        <div className="min-w-0">
                          <Label htmlFor={id} className="text-sm font-medium">
                            {title}
                          </Label>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {description}
                          </p>
                        </div>
                        <Switch
                          id={id}
                          checked={prefs[key]}
                          onCheckedChange={(v) => updatePref(key, v)}
                          aria-label={title}
                        />
                      </li>
                    );
                  })}
                </ul>
              </SectionCard>
            </TabsContent>

            <TabsContent value="account" tabIndex={-1}>
              <div className="flex flex-col gap-6">
                <SectionCard
                  title="Account"
                  description="Your account email and security settings."
                >
                  <div className="grid gap-5">
                    <div className="grid gap-1.5">
                      <Label htmlFor="account-email">Email address</Label>
                      <Input
                        id="account-email"
                        type="email"
                        value={user?.email ?? ""}
                        readOnly
                        disabled
                        className="bg-muted/40"
                      />
                      <p className="text-xs text-muted-foreground">
                        Your email is read-only in this demo. Contact an admin to change it.
                      </p>
                    </div>

                    <Separator />

                    <form onSubmit={submitPassword} className="grid gap-4">
                      <div className="flex items-center gap-2">
                        <KeyRound className="h-4 w-4 text-muted-foreground" aria-hidden />
                        <h4 className="text-sm font-semibold">Change password</h4>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="grid gap-1.5">
                          <Label htmlFor="pw-current">Current password</Label>
                          <PasswordInput
                            id="pw-current"
                            value={current}
                            onChange={setCurrent}
                            show={showPw}
                            onToggleShow={() => setShowPw((s) => !s)}
                            placeholder="••••••••"
                            autoComplete="current-password"
                          />
                        </div>
                        <div className="grid gap-1.5">
                          <Label htmlFor="pw-new">New password</Label>
                          <PasswordInput
                            id="pw-new"
                            value={next}
                            onChange={setNext}
                            show={showPw}
                            onToggleShow={() => setShowPw((s) => !s)}
                            placeholder="At least 8 characters"
                            autoComplete="new-password"
                            ariaInvalid={pwTouched && next.length > 0 && next.length < 8}
                          />
                          {pwTouched && next.length > 0 && next.length < 8 ? (
                            <p className="text-xs text-destructive" role="alert">
                              Use 8 or more characters.
                            </p>
                          ) : null}
                        </div>
                        <div className="grid gap-1.5">
                          <Label htmlFor="pw-confirm">Confirm new</Label>
                          <PasswordInput
                            id="pw-confirm"
                            value={confirm}
                            onChange={setConfirm}
                            show={showPw}
                            onToggleShow={() => setShowPw((s) => !s)}
                            placeholder="Re-enter new password"
                            autoComplete="new-password"
                            ariaInvalid={pwTouched && confirm.length > 0 && confirm !== next}
                          />
                          {pwTouched && confirm.length > 0 && confirm !== next ? (
                            <p className="text-xs text-destructive" role="alert">
                              Passwords don&apos;t match.
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button type="submit" disabled={!pwValid}>
                          <Check className="h-4 w-4" aria-hidden />
                          Update password
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            setCurrent("");
                            setNext("");
                            setConfirm("");
                            setPwTouched(false);
                          }}
                        >
                          Reset
                        </Button>
                      </div>
                    </form>
                  </div>
                </SectionCard>

                {/* Danger zone */}
                <SectionCard
                  title="Danger zone"
                  description="Irreversible actions affecting your account."
                  destructive
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <span
                        className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-destructive/10 text-destructive"
                        aria-hidden
                      >
                        <Trash2 className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-sm font-medium">Delete account</p>
                        <p className="mt-0.5 max-w-md text-xs text-muted-foreground">
                          Permanently remove your account, projects and tasks. This action cannot be undone.
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      onClick={() => setConfirmOpen(true)}
                      className="sm:flex-none"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                      Delete account
                    </Button>
                  </div>
                </SectionCard>
              </div>
            </TabsContent>
          </div>
        </div>
      </Tabs>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete your account?"
        description="This is a demo action. Your local session will be cleared and you will be signed out. No server data is removed in Phase 1."
        confirmLabel="Yes, delete my account"
        cancelLabel="Cancel"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}

function SectionCard({
  title,
  description,
  children,
  destructive = false,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  destructive?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
    >
      <Card className={cn(destructive && "border-destructive/30")}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle
              className={cn(
                "text-base",
                destructive && "text-destructive",
              )}
            >
              {title}
            </CardTitle>
            {destructive ? (
              <Badge variant="outline" className="border-destructive/30 bg-destructive/10 text-destructive">
                Irreversible
              </Badge>
            ) : null}
          </div>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </motion.div>
  );
}

function PasswordInput({
  id,
  value,
  onChange,
  show,
  onToggleShow,
  placeholder,
  autoComplete,
  ariaInvalid = false,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggleShow: () => void;
  placeholder?: string;
  autoComplete?: string;
  ariaInvalid?: boolean;
}) {
  return (
    <div className="relative">
      <Input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={ariaInvalid}
        className="pr-9"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onToggleShow}
        aria-label={show ? "Hide password" : "Show password"}
        tabIndex={-1}
        className="absolute right-1 top-1 h-7 w-7 text-muted-foreground hover:text-foreground"
      >
        {show ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
      </Button>
    </div>
  );
}
