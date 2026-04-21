

# Bitfit redesign — modern, photo-led, fun onboarding

A complete visual refresh moving Bitfit from "AI-generated emoji" feel to a polished, modern app with realistic food photography, a friendlier landing page, a pill-style theme switcher, and a smoother registration flow.

---

## 1. New landing/welcome page (replaces the auto-redirect)

Today, opening the app immediately bounces visitors to the auth form. We replace this with a proper **welcome screen** at `/` for logged-out users.

**Design**
- Full-bleed hero with a realistic food photograph (Georgian-style plated meal — grilled meat, fresh salad, bread) generated via AI.
- Dark gradient overlay from bottom for legibility.
- Top: small Bitfit logo + new pill theme switcher + language switcher.
- Bottom card area on the photo:
  - Bold headline: **"Track every bite. Reach every goal."** (EN) / "თვალი ადევნე ყოველ ლუკმას" (KA)
  - Subheading: short value prop
  - Primary CTA: **"Get started"** (large, brand-red, full-width)
  - Secondary text link: **"I already have an account → Sign in"**
- Three small feature pills above the CTA: *AI scanner · Calorie tracking · Coach support* with mini icons.

```text
┌──────────────────────────┐
│ [logo]    [☀️🌙] [🇬🇧]   │
│                          │
│   ╔══════════════════╗   │
│   ║  realistic food  ║   │
│   ║   photo (hero)   ║   │
│   ╚══════════════════╝   │
│                          │
│  Track every bite.       │
│  Reach every goal.       │
│                          │
│  · AI scan · Calories ·  │
│                          │
│  ┌────────────────────┐  │
│  │   GET STARTED  →   │  │
│  └────────────────────┘  │
│  Already have account?   │
│       Sign in            │
└──────────────────────────┘
```

Logged-in users still auto-route to `/app/dashboard` as before.

---

## 2. New theme switcher (matches your screenshot)

Replace the small icon-only toggle with the **pill-style switcher** from your reference: a rounded capsule containing two icons (sun ☀️ + moon 🌙) where the active one is highlighted with a filled brand-red circle that slides between positions on click.

- Smooth sliding animation (`transition-transform`) on the highlighted thumb.
- Used in the welcome page, settings page, and onboarding header.
- Reusable as `<ThemeSwitcher />` component.

---

## 3. Smooth, fun registration flow

Currently signup = one dense form. We split it into a **2-step micro-flow** with playful motion:

**Step A — "Let's get you in"** (account)
- Single field at a time, large input, big rounded card.
- Order: name → email → password.
- Each field has an emoji prefix (👋 / 📧 / 🔒) and animates in.
- Live validation with green checkmark when a field is valid.
- Progress dots at top (2 steps).
- Continue with Google / Apple shown as secondary above the form (one tap = skips most of step A).

**Step B — Privacy & welcome**
- Friendly summary: "Welcome, **{firstName}** 🎉"
- One-tap accept policy with clearer copy.
- "Create my account" CTA → confetti micro-animation → onboarding.

**Sign-in mode** (existing users) stays as a single compact form — only signup gets the 2-step treatment.

Animations: each step uses the existing `bf-step-in` keyframe; success state uses a brief scale-pop on the field's checkmark.

---

## 4. Realistic food imagery (replace emoji avatars)

Today meals show emojis (🥗, 🍗, 🥟). We replace these with **realistic photo thumbnails** for the most common meals using AI image generation, stored as static assets:

**Initial photo set (generated once, bundled in `src/assets/meals/`)**:
- breakfast (eggs/oats), salad, grilled meat, chicken, fish, soup, rice, pasta, bread, fruit bowl, smoothie, khinkali, lobio, mchadi, snack/yogurt — ~15 photos covering 90% of meal names.

**Updated `MealAvatar` component**:
- Maps meal name → photo (same regex rules as today's `emojiForMeal`).
- Falls back to a tasteful gradient + emoji only if no photo matches.
- Square rounded thumbnail (`rounded-[12px]`), same sizing as before so dashboard layout doesn't shift.

This makes the meal list look like the reference screenshots — like a real food app, not an AI demo.

---

## 5. Dashboard polish (subtle)

- Hero ring card gets an **optional small food photo strip** under the macro bars showing today's logged meals as round thumbnails (like a story bar).
- Quick-add meal buttons get realistic photo backgrounds at low opacity instead of solid color tiles, with the meal label overlaid — feels closer to your reference.
- Keep all existing data, layout, and bottom navigation intact.

---

## 6. Visual system updates

Small token tweaks for the modern feel:
- Add `--shadow-photo: 0 8px 24px rgba(28, 21, 18, 0.12)` for image cards.
- New utility `.glass-overlay` for the welcome hero text panel (dark gradient + slight blur).
- Slightly increase card radius on hero elements (welcome card: `rounded-[28px]`).
- No changes to brand color, fonts, or existing dashboard layout — just additive.

---

## Technical details

**New files**
- `src/routes/welcome.tsx` — new welcome page (or repurpose `/` for logged-out)
- `src/components/bitfit/theme-switcher.tsx` — pill switcher
- `src/components/bitfit/meal-photo.tsx` — realistic photo avatar (replaces `MealAvatar` usage at call sites; old emoji helper kept as fallback)
- `src/assets/meals/*.jpg` — ~15 AI-generated food photos
- `src/assets/welcome-hero.jpg` — landing hero photo

**Modified files**
- `src/routes/index.tsx` — show welcome page when logged out instead of redirecting to `/auth`
- `src/routes/auth.tsx` — split signup into 2-step flow; sign-in stays single-form
- `src/routes/app.dashboard.tsx` — swap `MealAvatar` → `MealPhoto`; add photo backgrounds on quick-add tiles
- `src/components/bitfit/language-toggle.tsx` — minor restyle to match new pill aesthetic
- `src/components/bitfit/splash.tsx` — leave as-is
- `src/styles.css` — add new tokens and `.glass-overlay` utility
- `src/lib/i18n.ts` — add new strings: `getStarted`, `welcomeHeadline`, `welcomeSubheadline`, `signInInstead`, `letsGetYouIn`, `welcomeFirstName` (KA + EN)

**Image generation**
- Use Lovable AI Gateway with `google/gemini-3.1-flash-image-preview` (fast + high quality) to generate the welcome hero and meal photos at build time, save to `src/assets/`.
- All photos: square format, soft natural lighting, neutral background, top-down or 45° angle, consistent style.

**No backend / database changes.** No new dependencies. No breaking changes to existing data flows.

