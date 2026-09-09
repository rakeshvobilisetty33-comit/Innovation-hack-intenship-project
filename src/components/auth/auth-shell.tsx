"use client";

import * as React from "react";
import { BrandPanel, MobileBrandHeader } from "@/components/auth/brand-panel";
import {
  AuthModeTabs,
  type AuthMode,
} from "@/components/auth/auth-mode-tabs";
import LoginView from "@/pages/auth/login-view";
import RegisterView from "@/pages/auth/register-view";

/**
 * AuthShell — the logged-out experience.
 *
 * Two-column layout:
 *  - LEFT  (lg+): brand marketing panel (BrandPanel) with ThemeToggle.
 *  - RIGHT (all):  a centered auth card (~440px) that swaps between
 *                  LoginView and RegisterView via an internal `mode` state.
 */
export function AuthShell() {
  const [mode, setMode] = React.useState<AuthMode>("login");

  return (
    <div className="relative min-h-screen w-full bg-background lg:grid lg:grid-cols-[1.05fr_minmax(0,1fr)]">
      {/* LEFT — brand panel (hidden on mobile) */}
      <BrandPanel className="lg:block" />

      {/* RIGHT — auth form */}
      <div className="relative flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 lg:py-12">
        <div className="w-full max-w-[440px]">
          {/* Mobile compact brand header */}
          <div className="lg:hidden">
            <MobileBrandHeader />
          </div>

          <div className="glass animate-in fade-in-0 slide-in-from-bottom-2 duration-300 rounded-2xl border border-border bg-card/85 shadow-soft">
            <div className="p-6 sm:p-8">
              {/* Mode toggle */}
              <AuthModeTabs mode={mode} onModeChange={setMode} />

              {/* Form area */}
              <div className="mt-6">
                <div key={mode} className="animate-in fade-in-0 duration-200">
                  {mode === "login" ? (
                    <LoginView onSwitchToRegister={() => setMode("register")} />
                  ) : (
                    <RegisterView onSwitchToLogin={() => setMode("login")} />
                  )}
                </div>
              </div>

              {/* Footer line */}
              <p className="mt-6 text-center text-xs text-muted-foreground">
                By continuing you agree to the{" "}
                <span className="font-medium text-foreground/80">Terms</span> &{" "}
                <span className="font-medium text-foreground/80">Privacy</span>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
