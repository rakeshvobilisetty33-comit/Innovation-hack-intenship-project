"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
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
 *
 * On mobile (<lg) the brand panel is hidden and a compact brand header
 * appears above the card. Both the segmented tab toggle and the in-form
 * "switch" links update the same `mode` state, so the two surfaces stay
 * in sync.
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

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
            className="glass rounded-2xl border border-border bg-card/85 shadow-soft"
          >
            <div className="p-6 sm:p-8">
              {/* Mode toggle */}
              <AuthModeTabs mode={mode} onModeChange={setMode} />

              {/* Form area — AnimatePresence handles the swap */}
              <div className="mt-6">
                <AnimatePresence mode="wait" initial={false}>
                  {mode === "login" ? (
                    <motion.div
                      key="login"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <LoginView onSwitchToRegister={() => setMode("register")} />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="register"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <RegisterView onSwitchToLogin={() => setMode("login")} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer line */}
              <p className="mt-6 text-center text-xs text-muted-foreground">
                By continuing you agree to the{" "}
                <span className="font-medium text-foreground/80">Terms</span> &{" "}
                <span className="font-medium text-foreground/80">Privacy</span>.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
