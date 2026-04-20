# BitFit — React Native App

Converted from your Lovable web app to React Native (Expo).  
**Same Supabase backend. All your data. Full App Store ready.**

---

## 1. One-time setup

### Prerequisites
- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- EAS CLI (for App Store): `npm install -g eas-cli`

### Install dependencies
```bash
npm install
```

---

## 2. Add your Supabase credentials

Open `src/lib/supabase.ts` and replace the placeholder values:

```ts
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_PUBLISHABLE_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

Find these values in your Lovable project's `.env` file:
- `VITE_SUPABASE_URL` → paste as `SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY` → paste as `SUPABASE_PUBLISHABLE_KEY`

---

## 3. Run on your phone (development)

```bash
npx expo start
```

Then scan the QR code with **Expo Go** (free app on App Store / Google Play).

---

## 4. Run on iOS Simulator (Mac only)

```bash
npx expo start --ios
```

---

## 5. Publish to the App Store

### Step 1 — Apple Developer Account
- Register at https://developer.apple.com ($99/year)
- Create an App ID with bundle identifier: `com.yourcompany.bitfit`
  (update this in `app.json` → `ios.bundleIdentifier`)

### Step 2 — Configure EAS
```bash
eas login          # log in to your Expo account
eas build:configure
```

Update `eas.json` with your Apple credentials:
```json
"submit": {
  "production": {
    "ios": {
      "appleId": "your@email.com",
      "ascAppId": "YOUR_APP_STORE_CONNECT_APP_ID",
      "appleTeamId": "YOUR_TEAM_ID"
    }
  }
}
```

### Step 3 — Build for production
```bash
eas build --platform ios --profile production
```
This takes ~10-15 minutes and runs in the cloud. No Xcode needed!

### Step 4 — Submit to App Store
```bash
eas submit --platform ios
```
EAS uploads your build directly to App Store Connect.

### Step 5 — App Store Connect
1. Go to https://appstoreconnect.apple.com
2. Fill in your app name, description, screenshots, and category
3. Submit for review (Apple takes 1–3 days)

---

## Project structure

```
BitFitApp/
├── App.tsx                    # Root entry point
├── app.json                   # Expo config
├── eas.json                   # App Store build config
├── src/
│   ├── lib/
│   │   ├── supabase.ts        # ← Add your credentials here
│   │   ├── i18n.ts            # Georgian + English translations
│   │   └── theme.ts           # Colors, spacing, fonts
│   ├── providers/
│   │   ├── AuthProvider.tsx   # Auth state (unchanged logic)
│   │   └── I18nProvider.tsx   # Language switching
│   ├── navigation/
│   │   └── index.tsx          # React Navigation setup
│   ├── screens/
│   │   ├── AuthScreen.tsx     # Login / Sign up
│   │   ├── OnboardingScreen.tsx # 5-step wizard
│   │   ├── DashboardScreen.tsx  # Main hub
│   │   ├── ScannerScreen.tsx    # Food search & add meal
│   │   ├── ProgressScreen.tsx   # Weight chart + points
│   │   ├── GroupsScreen.tsx     # Group challenges
│   │   └── SettingsScreen.tsx   # Profile, language, theme
│   └── components/
│       ├── CalorieRing.tsx    # SVG ring chart
│       ├── MacroBars.tsx      # Protein/carbs/fats bars
│       └── WaterTracker.tsx   # Water intake tracker
```

---

## What's identical to the web app

| Feature | Status |
|---|---|
| Supabase auth (email/password) | ✅ Identical |
| All database queries | ✅ Identical |
| Georgian + English i18n | ✅ Identical |
| Calorie ring | ✅ Rebuilt with react-native-svg |
| Macro bars | ✅ Rebuilt |
| Water tracker | ✅ Rebuilt |
| Activity tracker | ✅ Rebuilt |
| Weight chart | ✅ Rebuilt with react-native-svg |
| Food scanner/search | ✅ Identical queries |
| AI meal suggestions | ✅ Same Supabase Edge Function |
| Groups + challenges | ✅ Identical |
| Coach portal | 🔜 Add later (same pattern) |

---

## Troubleshooting

**"Missing Supabase env vars"** → Make sure you've added credentials to `src/lib/supabase.ts`

**Metro bundler issues** → Run `npx expo start --clear`

**iOS build fails** → Make sure bundle ID in `app.json` matches your Apple Developer App ID

**Auth not persisting** → `@react-native-async-storage/async-storage` must be installed
