"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Calendar, Pencil, Save, X, User as UserIcon } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/constants";
import type { User } from "@/lib/types";

function getInitials(name?: string | null): string {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface ProfileHeaderProps {
  user: User;
  onSave: (patch: Partial<Pick<User, "name" | "email" | "bio" | "role" | "avatar">>) => boolean;
  onCancel?: () => void;
}

export function ProfileHeader({ user, onSave }: ProfileHeaderProps) {
  const [editing, setEditing] = React.useState(false);
  const [name, setName] = React.useState(user.name);
  const [email, setEmail] = React.useState(user.email);
  const [role, setRole] = React.useState(user.role ?? "");
  const [bio, setBio] = React.useState(user.bio ?? "");
  const [avatar, setAvatar] = React.useState(user.avatar ?? "");
  const [touched, setTouched] = React.useState(false);

  // Re-sync if user prop changes (e.g. after a save).
  React.useEffect(() => {
    if (!editing) {
      setName(user.name);
      setEmail(user.email);
      setRole(user.role ?? "");
      setBio(user.bio ?? "");
      setAvatar(user.avatar ?? "");
    }
  }, [user, editing]);

  const nameError = touched && name.trim().length < 2 ? "Name must be at least 2 characters." : "";
  const emailError = touched && !EMAIL_RE.test(email.trim()) ? "Enter a valid email address." : "";
  const bioLen = bio.length;
  const BIO_MAX = 280;
  const formValid = name.trim().length >= 2 && EMAIL_RE.test(email.trim()) && bioLen <= BIO_MAX;

  function startEdit() {
    setTouched(false);
    setEditing(true);
  }

  function cancel() {
    setName(user.name);
    setEmail(user.email);
    setRole(user.role ?? "");
    setBio(user.bio ?? "");
    setAvatar(user.avatar ?? "");
    setTouched(false);
    setEditing(false);
  }

  function submit() {
    setTouched(true);
    if (!formValid) return;
    const ok = onSave({
      name: name.trim(),
      email: email.trim(),
      role: role.trim() || "Member",
      bio: bio.trim() || null,
      avatar: avatar.trim() || null,
    });
    if (ok) {
      setEditing(false);
      setTouched(false);
    }
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden rounded-xl border bg-card shadow-soft"
      aria-label="Profile header"
    >
      {/* Gradient banner */}
      <div
        aria-hidden
        className="relative h-28 w-full bg-gradient-to-r from-brand via-[color-mix(in_oklch,var(--brand)_65%,var(--chart-2))] to-[color-mix(in_oklch,var(--brand)_45%,var(--chart-4))] sm:h-32"
      >
        <div className="absolute inset-0 bg-grid opacity-30 mix-blend-soft-light" />
      </div>

      <div className="px-4 pb-6 sm:px-6">
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="-mt-12 flex items-end gap-4 sm:-mt-14">
            <Avatar
              className={cn(
                "h-20 w-20 rounded-2xl border-4 border-card bg-muted shadow-brand sm:h-24 sm:w-24",
              )}
            >
              {user.avatar ? <AvatarImage src={user.avatar} alt={user.name} /> : null}
              <AvatarFallback className="rounded-xl bg-brand/10 text-brand text-lg font-semibold">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>

            <div className="pb-1">
              <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
                {user.name}
              </h1>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <div className="flex w-full items-center gap-2 sm:w-auto">
            {!editing ? (
              <Button variant="outline" onClick={startEdit} className="w-full sm:w-auto">
                <Pencil className="h-4 w-4" aria-hidden />
                Edit profile
              </Button>
            ) : (
              <>
                <Button variant="ghost" onClick={cancel} className="flex-1 sm:flex-none">
                  <X className="h-4 w-4" aria-hidden />
                  Cancel
                </Button>
                <Button onClick={submit} disabled={!formValid} className="flex-1 sm:flex-none">
                  <Save className="h-4 w-4" aria-hidden />
                  Save changes
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Meta row: role badge + member since */}
        <div className="mt-5 flex flex-wrap items-center gap-2.5 text-sm">
          <Badge
            variant="outline"
            className="gap-1.5 border-brand/25 bg-brand/10 text-brand-accent dark:text-[color-mix(in_oklch,var(--brand)_65%,white)]"
          >
            <UserIcon className="h-3.5 w-3.5" aria-hidden />
            {user.role || "Member"}
          </Badge>
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" aria-hidden />
            Member since {formatDate(user.createdAt)}
          </span>
        </div>

        {/* Inline edit form */}
        {editing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="mt-6"
          >
            <div className="grid gap-4 rounded-lg border bg-muted/30 p-4 sm:grid-cols-2 sm:p-5">
              <div className="grid gap-1.5">
                <Label htmlFor="profile-name">Full name</Label>
                <Input
                  id="profile-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => setTouched(true)}
                  placeholder="Your name"
                  aria-invalid={!!nameError}
                  aria-describedby={nameError ? "profile-name-err" : undefined}
                />
                {nameError ? (
                  <p id="profile-name-err" className="text-xs text-destructive" role="alert">
                    {nameError}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="profile-email">Email</Label>
                <Input
                  id="profile-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setTouched(true)}
                  placeholder="you@example.com"
                  aria-invalid={!!emailError}
                  aria-describedby={emailError ? "profile-email-err" : undefined}
                />
                {emailError ? (
                  <p id="profile-email-err" className="text-xs text-destructive" role="alert">
                    {emailError}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="profile-role">Role</Label>
                <Input
                  id="profile-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Software Engineer"
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="profile-avatar">Avatar URL (optional)</Label>
                <Input
                  id="profile-avatar"
                  type="url"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="https://..."
                />
              </div>

              <div className="grid gap-1.5 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="profile-bio">Bio</Label>
                  <span
                    className={cn(
                      "text-xs tabular-nums",
                      bioLen > BIO_MAX ? "text-destructive" : "text-muted-foreground",
                    )}
                    aria-live="polite"
                  >
                    {bioLen}/{BIO_MAX}
                  </span>
                </div>
                <Textarea
                  id="profile-bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us a little about yourself…"
                  rows={3}
                  maxLength={BIO_MAX}
                />
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.section>
  );
}

export { getInitials };
