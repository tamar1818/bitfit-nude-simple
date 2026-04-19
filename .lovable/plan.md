
The user is asking for guidance on how to publish their Bitfit web app to the App Store. This is a research/guidance question — no code changes needed yet, but they may want to act on it. Let me lay out the realistic path clearly.

## The reality

Lovable builds **web apps** (React + Vite running in the browser). The Apple App Store only accepts **native iOS apps** (compiled binaries). To bridge the gap, you wrap your published Lovable web app inside a thin native shell using **Capacitor** — this is the standard, Apple-approved approach.

## Requirements before you start

1. **A Mac computer** (Xcode only runs on macOS) — this is a hard Apple requirement
2. **Apple Developer Program membership** — $99/year at developer.apple.com
3. **Xcode** installed (free from the Mac App Store)
4. Your project **exported to GitHub** (Lovable → GitHub button, top right)

## Step-by-step path

**Phase 1 — Publish on Lovable (5 min)**
- Click **Publish** in Lovable to get your live `.lovable.app` URL
- Test the app on your phone via Safari first to catch obvious issues

**Phase 2 — Wrap with Capacitor (1–2 hours)**
- Export to GitHub, clone the repo locally on your Mac
- Run `npm install` then add Capacitor:
  - `npm install @capacitor/core @capacitor/ios @capacitor/cli`
  - `npx cap init Bitfit com.yourname.bitfit`
  - `npm run build`
  - `npx cap add ios`
  - `npx cap sync`
- Configure `capacitor.config.ts` to point to your published Lovable URL (or use the bundled `dist/` for offline)

**Phase 3 — Prepare in Xcode (1–2 hours)**
- `npx cap open ios` opens the project in Xcode
- Set bundle ID, version, app icon (1024×1024), splash screen
- Add required permissions to `Info.plist` (camera for the scanner, etc.)
- Sign with your Apple Developer account
- Test on a real iPhone via USB

**Phase 4 — Submit to App Store (1–2 weeks for review)**
- Create app listing in **App Store Connect**: name, description (Georgian + English), screenshots (6.7", 6.5", 5.5"), privacy policy URL
- Archive build in Xcode → upload to App Store Connect
- Submit to **TestFlight** first for beta testing with up to 10,000 users (no review needed for internal testers)
- Submit for App Store review (typically 24–48h, sometimes longer)

## Important Apple gotchas for Bitfit specifically

- **Privacy policy URL is mandatory** — you'll need a public `/privacy` page (currently it's a modal only)
- **Camera permission usage description** must explain the food scanner clearly in `Info.plist`
- **Sign in with Apple is required** if you offer Google sign-in — Apple will reject the app otherwise
- **Account deletion** must be available in-app (not just disable) — Apple enforces this for any app with user accounts
- **No external payment links** if you ever add subscriptions (must use Apple's IAP, 15–30% fee)

## Faster alternative — PWA on home screen (no App Store)

If you just want users to install Bitfit on their phone today:
- Publish on Lovable
- Users open the URL in Safari → Share → **Add to Home Screen**
- Looks and feels like a native app, no $99/year, no review

I can also make the app a proper **installable PWA** (manifest, icons, offline cache) so the home-screen experience is more polished.

## What I'd recommend doing now

1. **Publish on Lovable** (one click) so you have a real URL to test
2. **Add the missing App Store prerequisites to the codebase**: public `/privacy` route, Sign in with Apple, in-app account deletion
3. **Make it a PWA** so it works great on phones immediately
4. Then tackle Capacitor when you have a Mac + Apple Developer account ready

Pick which of these you want me to do next.
