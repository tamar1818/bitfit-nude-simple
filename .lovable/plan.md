
All four scoping questions answered. Locking in:
- **v1 = Full**: Auth + DB + Coach Mode + AI scanner
- **Scanner = Georgian food DB** (searchable, with planned AI image add-on later)
- **Coach linking = Invite code**
- **Languages = Georgian first, English second, with toggle in Settings**

Design references (Nixtio + the fitness dashboard) define the look: oversized white rounded cards on `#F9F9F9`, big circular calorie ring, pastel-tinted sub-cards (lavender/mint/peach), pill tabs, floating bottom nav, mixed-weight headings.

## Plan: Bitfit v1

### 1. Backend (Lovable Cloud)
Tables (all RLS-protected):
- `profiles` — id, full_name, age, gender, height_cm, goal (lose/gain/maintain), language ('ka'|'en'), is_coach, coach_id (nullable)
- `weights` — user_id, weight_kg, target_weight_kg, recorded_at
- `daily_logs` — user_id, date, water_ml, steps, calories_goal
- `meals` — user_id, date, food_id, name, calories, protein, carbs, fats, meal_type
- `foods_ge` — Georgian food DB seeded from your blueprint (khinkali, khachapuri, Sante, Nikora, etc.) with calories + macros per 100g
- `coach_invites` — code (unique), coach_id, expires_at, used_by
- `user_roles` + `app_role` enum (`user`, `coach`, `admin`) with `has_role()` security-definer function

Auth: Email + Password. Trigger creates profile + default daily_log on signup.

### 2. Routes (TanStack file-based)
```
src/routes/
  __root.tsx                 — shell, fonts, QueryClientProvider, AuthProvider, i18n
  index.tsx                  — Landing → redirects to /app or /auth
  auth.tsx                   — Login + Signup tabs
  onboarding.tsx             — 4-step wizard (goal → identity → body → invite code)
  _app.tsx                   — Authenticated layout (bottom nav + Outlet)
  _app/dashboard.tsx         — Calorie ring, water, steps, today's meals
  _app/scanner.tsx           — Searchable Georgian food DB + add to log
  _app/progress.tsx          — Weight chart, streaks
  _app/settings.tsx          — Language toggle, profile, logout
  _coach.tsx                 — Coach-only layout (role guard via has_role)
  _coach/clients.tsx         — Client list with avatars, today's stats
  _coach/clients.$id.tsx     — Single client detail
```

### 3. Design system (`src/styles.css`)
Tokens (HSL):
- bg `#F9F9F9`, card `#FFFFFF`, nude `#F3EEEA`, ink `#1A1A1A`, muted `#757575`
- pastels: lavender `#E8E6FF`, mint `#E8F5E9`, peach `#FFE8D9`, sky `#E3F2FD`
- accent `#A3E635` (success/health)
- radius: card 24px, button 12px, pill 999px
- shadow-soft: `0 4px 20px rgba(0,0,0,0.03)`
- fonts: Plus Jakarta Sans (display) + Inter (body) via Google Fonts in `__root.tsx` head

### 4. Reusable components (`src/components/bitfit/`)
- `CalorieRing` — SVG progress, shows eaten/burned/remaining
- `StatCard` — pastel-tinted card with icon + label + value
- `WaterTracker` — glass row with +/− buttons, optimistic updates
- `StepCounter` — horizontal bar
- `MacroBars` — protein/carbs/fats
- `MealRow` — food entry row with delete
- `BottomNav` — floating rounded nav, 4 icons + center scan FAB
- `LanguageToggle` — KA/EN segmented switch
- `FoodSearchSheet` — bottom sheet with search + result cards

### 5. i18n
Lightweight in-house solution: `src/lib/i18n.ts` with `ka.json` + `en.json`, `useT()` hook, default `ka`, persisted in profile + localStorage. No extra dependency.

### 6. AI placeholder
Scanner uses DB search for v1. UI includes a camera button that opens a "Coming soon" sheet — we'll wire Lovable AI Gemini Flash image recognition in v2.

### Build order
1. Cloud setup: tables, RLS, trigger, seed `foods_ge` (~40 Georgian items)
2. Design tokens + fonts + base layout
3. Auth + onboarding flow
4. Dashboard + components
5. Food scanner (search) + meal logging
6. Progress + settings + i18n
7. Coach role + invite code + clients view
