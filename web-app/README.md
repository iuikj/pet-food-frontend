# Web App

## API base URL

The frontend reads `VITE_API_BASE_URL` from Vite env files.

- Shared default: [`.env`](/E:/Graduate/frontend/web-app/.env:1)
- Committable examples: [`.env.example`](/E:/Graduate/frontend/web-app/.env.example:1), [`.env.development.example`](/E:/Graduate/frontend/web-app/.env.development.example:1), [`.env.development.local.example`](/E:/Graduate/frontend/web-app/.env.development.local.example:1)
- Machine-specific override: `.env.development.local`

Recommended setup:

1. Keep the shared production-like default in `.env`.
2. Copy `.env.development.local.example` to `.env.development.local`.
3. Put your own local backend address in `.env.development.local`.

Examples:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

```env
VITE_API_BASE_URL=http://192.168.1.23:8000/api/v1
```

Notes:

- Browser local development can use `localhost`.
- Real phones or other devices usually cannot use your computer's `localhost`; use your LAN IP instead.
- `.env.development.local` is ignored by git and only affects local `development` mode.

## Commands

- `npm run dev`: start development mode
- `npm run dev:local`: explicit local development command
- `npm run build`: production build
- `npm run build:prod`: explicit production build
- `npm run build:local`: development-mode build using local overrides
- `npm run mobile:build`: production build plus `cap sync`
- `npm run mobile:build:local`: local development-mode build plus `cap sync`

## Android coexistence

The Android `release` build stays on the production package name `com.petcare.app`.
The local `debug` build now uses `com.petcare.app.dev` with launcher label `宠物健康管家 Dev`,
so it can be installed side by side with the production app from GitHub Workflow.

Common commands:

```powershell
# Local sideloadable test build that can coexist with production
npm run mobile:build:local
cd android
.\gradlew.bat assembleDebug

# Production build path remains unchanged
npm run mobile:build
cd android
.\gradlew.bat assembleRelease
```

## CD impact

These local overrides do not change the existing GitHub Actions production workflow.

- CI frontend image builds still inject `VITE_API_BASE_URL` through workflow `build-args`.
- The frontend Docker build still writes those values into `.env.production` before `npm run build`.
