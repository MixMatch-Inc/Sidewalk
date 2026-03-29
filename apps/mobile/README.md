# Sidewalk Mobile

Expo React Native app for the Sidewalk monorepo.

## Environment

Copy the example file and point the app at the API you want to test against:

```bash
cp .env.example .env
```

Supported variables:

- `EXPO_PUBLIC_API_URL`: base URL for the Sidewalk API, defaults to `http://localhost:5000`

The app validates this value at runtime and falls back to the local API default if the URL is invalid.

## Run

```bash
pnpm --filter mobile start
```

## Checks

```bash
pnpm --filter mobile lint
pnpm --filter mobile typecheck
```
