# Task 1-b — full-stack-developer — Auth views (logged-out experience)

Task: Build AuthShell, LoginView, RegisterView for the logged-out experience.

## Files created/changed
- `src/components/auth/brand-panel.tsx` — NEW. Named exports `BrandPanel` (premium left marketing panel: animated gradient + .bg-grid overlay + two pulsing glows + ThemeToggle + Logo(40) + headline + supporting paragraph + 3 Lucide feature bullets + faux mini dashboard card with stat chips and animated progress bars + trusted-by stat row) and `MobileBrandHeader` (compact header shown above the auth card on mobile).
- `src/components/auth/auth-mode-tabs.tsx` — NEW. Named export `AuthModeTabs` (segmented pill toggle with role=tablist/tab, aria-selected, framer-motion `layoutId="auth-mode-pill"` sliding background) plus the `AuthMode` type (`'login' | 'register'`).
- `src/components/auth/auth-shell.tsx` — REPLACED stub. Named export `AuthShell`. Full-viewport two-column shell (`lg:grid lg:grid-cols-[1.05fr_minmax(0,1fr)]`); holds internal `mode` state; renders `BrandPanel` (hidden below lg) + right column with mobile brand header + glass auth card (`bg-card/85`, `shadow-soft`, `rounded-2xl`, `border`) with `AuthModeTabs` at top, `<AnimatePresence mode="wait">` swapping LoginView/RegisterView (220ms fade + 6px y), and the "By continuing you agree to the Terms & Privacy." footer line.
- `src/pages/auth/login-view.tsx` — REPLACED stub. Default export `LoginView` with optional `onSwitchToRegister` prop. Email + password (show/hide) + "Remember me" + "Forgot password?" (toast "Coming soon"), zod validation, inline aria-invalid/describedby errors, demo credentials hint with "Use demo" autofill, full-width `bg-brand` submit with Loader2 spinner, success toast "Welcome back" + user.name, failure → inline + destructive toast. "Don't have an account? Create one" link.
- `src/pages/auth/register-view.tsx` — REPLACED stub. Default export `RegisterView` with optional `onSwitchToLogin` prop. Name + email + password (show/hide) + confirm (show/hide) + terms checkbox. zod schema with min-lengths, valid-email, min-6-password, confirm-match `.refine()` and `z.literal(true)` for terms. Visual 4-segment password strength meter (Too short → Strong, brand/chart-2/chart-3/destructive tones). Full-width `bg-brand` submit with ShieldCheck + ArrowRight + Loader2. Success toast "Account created" / "Welcome to DevFlow AI". Email-exists failure → inline + destructive toast. "Already have an account? Sign in" link.

## Login/register switching
- Single source of truth: `mode` state in `AuthShell` (`'login' | 'register'`).
- Two control surfaces stay in sync because they both update the same state:
  1. `AuthModeTabs` segmented toggle at the top of the card — calls `setMode`.
  2. In-form text links — `LoginView.onSwitchToRegister` and `RegisterView.onSwitchToLogin` — wired by `AuthShell` to `setMode('register')` / `setMode('login')`.
- `<AnimatePresence mode="wait">` swaps the two views with a 220ms fade + 6px y translate.
- The segmented tab indicator uses `motion.span` with `layoutId="auth-mode-pill"` so it slides between tabs (spring 420/32).

## Mock auth wiring
- `useAuthStore.login(email, password)` (550ms simulated latency, demo user `alex@devflow.ai` / `password`).
- `useAuthStore.register(name, email, password)` (700ms simulated latency; in-memory user db; email-exists error returned for duplicates).
- Success toasts use the standard toast; failures use `variant: "destructive"`.
- After a successful login/register, `useAuthStore.isAuthenticated` becomes true and `src/app/page.tsx` automatically swaps to `AppShell` — no extra wiring needed.

## Dev server log
- `tail` of `/home/z/my-project/dev.log` shows only "✓ Compiled" messages and `GET / 200` responses — no errors/warnings introduced.
- `bun run lint`: my files produce zero warnings/errors. (The only remaining lint error is in `src/components/layout/user-menu.tsx`, owned by task 1-a — left untouched per ownership rules.)

## Design notes
- Brand accent = emerald throughout. No indigo/blue. chart-2 (teal-ish) only used for the "Design System v2" progress bar + one ambient glow on the brand panel (matches CHART_COLORS).
- Dark-mode aware (default theme is dark); glass + bg-card + shadow-soft tokens used.
- All transitions subtle (220–450ms), respect prefers-reduced-motion (global CSS guard already in place).
- A11y: labels with htmlFor/id, aria-invalid, aria-describedby, role=alert for errors, aria-label on icon-only Eye/EyeOff toggles, role=tablist/tab + aria-selected on the segmented control, full keyboard focus rings.
- Responsive: BrandPanel hidden below lg; mobile gets the compact brand header above the card; form card centered with horizontal padding; no horizontal scroll.
