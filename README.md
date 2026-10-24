# REPONE

An AI-assisted calisthenics trainer that runs entirely in the browser. Build a bodyweight
routine by hand or let a dual-engine AI (Gemini, falling back to Cohere) propose one, then run
it with a guided timer, per-exercise YouTube form videos, and a logged history of sessions.

Archived project. The code is complete and functional but is not under active development.

---

## Features

| Feature | Where |
| --- | --- |
| Anonymous sign-in, no account required | `App.jsx:151-160` |
| Create routines from a 30-exercise library, or via AI | `App.jsx:392-482` |
| AI plan generation using level + target area | `App.jsx:400-407`, `App.jsx:230-242` |
| Timed exercise runner with automatic 15s rest between sets | `App.jsx:305-374` |
| Rep-based exercises advance on tap, timed ones on a countdown | `App.jsx:317-332`, `App.jsx:365` |
| Extend rest by 10s mid-set | `App.jsx:359` |
| Embedded YouTube tutorial per exercise | `App.jsx:199-206`, `App.jsx:351` |
| Workout history with calorie estimate | `App.jsx:220-227`, `App.jsx:484-486` |
| 7-session trend chart + lifetime totals | `App.jsx:488-509` |
| Realtime sync across tabs and devices | `App.jsx:162-169` |
| Offline-capable Firestore cache | `App.jsx:43-46` |
| "Trainer tips" generated at the start of each session | `App.jsx:182-186` |

## Tech stack

| Layer | Choice |
| --- | --- |
| UI | React 18, no router, no state management library |
| Build | Vite 4 (`@vitejs/plugin-react`) |
| Styling | Tailwind CSS 3 + a small block of raw CSS injected at runtime |
| Icons | `lucide-react` |
| Charts | `recharts` (`AreaChart`) |
| Backend | Firebase Auth (anonymous) + Cloud Firestore |
| AI | Google Gemini `gemini-flash-latest`, Cohere `command-r-08-2024` as fallback |

Total application code is one file: `src/App.jsx`, 509 lines, 9 components.

## Architecture

```
index.html          # single mount point, #root
src/main.jsx        # ReactDOM.createRoot -> <App />
src/index.css       # @tailwind base/components/utilities only
src/App.jsx         # the entire application
tailwind.config.js  # default theme, no plugins
```

There is no routing layer. The active screen is a single `view` string holding one of
`home`, `preview`, `live`, `history`, `stats`, or `builder`, switched in the render body
(`App.jsx:217-243`). There is no context, no reducer, and no external store; each component
receives props from `App`.

### `src/App.jsx` line map

| Lines | Contents |
| --- | --- |
| 1-19 | Imports (React, Firebase, recharts, lucide) |
| 21-29 | `getViteEnv(key, fallback)` helper |
| 32-39 | `firebaseConfig` object |
| 41-46 | App / Auth / Firestore initialization |
| 47 | `appId` namespace constant, `'repone-pro-v14'` |
| 50-88 | `EXERCISE_LIBRARY`, 30 entries |
| 90-91 | Gemini and Cohere key reads |
| 94-95 | Provider endpoints |
| 98-110 | `callGemini` |
| 112-127 | `callCohere` |
| 129-136 | `callAI`, Gemini then Cohere fallback |
| 138-253 | `App` root component |
| 139-149 | State declarations |
| 151-160 | Anonymous auth effect |
| 162-169 | Firestore `onSnapshot` subscriptions |
| 171 | `notify` toast helper |
| 173-187 | `startWorkout`, including tips request |
| 189 | Loading screen |
| 191-252 | Render tree |
| 193-197 | Injected `<style>` block (fonts, scrollbar) |
| 199-210 | Tutorial modal and toast |
| 212-215 | Header |
| 217-243 | View router |
| 245-250 | Bottom navigation |
| 255-257 | `NavIcon` |
| 259-278 | `Home` |
| 280-303 | `RoutinePreview` |
| 305-374 | `LiveWorkout` |
| 376-390 | `SelectionGroup` |
| 392-482 | `Builder` |
| 484-486 | `HistoryView` |
| 488-509 | `Stats` |

## Data model

All user data is namespaced under the hardcoded `appId` (`App.jsx:47`). Changing that
constant orphans every existing document.

```
artifacts/
  repone-pro-v14/
    users/{uid}/
      routines/{routineId}
        name:      string            # e.g. "Full Body Build"
        exercises: Exercise[]        # denormalized copies, see below
        created:   number            # Date.now()

      history/{entryId}
        name:      string            # routine name
        date:      number            # Date.now()
        duration:  number            # whole minutes, elapsed wall clock
        calories:  string            # duration * 8.5, rounded, stored as string
        exercises: number            # count of exercises, not an array
```

An `Exercise` stored inside a routine is a snapshot of the library entry plus per-plan
overrides:

```js
{ id, name, muscle, icon, type, count, duration, videoId }
```

`type` is either `'reps'` or `'time'`. For `'reps'`, `count` is the target and `duration` is 0;
for `'time'` the reverse holds. The runner branches on this field throughout
(`App.jsx:313`, `App.jsx:341`, `App.jsx:365`).

Writes are three calls: `addDoc` for a routine (`App.jsx:477`), `addDoc` for a history entry on
finish (`App.jsx:222`), and `deleteDoc` when a routine is removed (`App.jsx:219`). Reads are
live subscriptions, with history sorted newest-first client side (`App.jsx:167`).

Firestore is initialized with a persistent multi-tab local cache and long-polling autodetection
(`App.jsx:43-46`), so previously loaded routines render offline and stay consistent across tabs.

## AI layer

### Endpoints

```js
GEMINI_URL  // generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=...
COHERE_URL  // https://api.cohere.ai/v1/chat
```

`callGemini` sends `{ contents: [{ parts: [{ text }] }] }` with the system prompt prepended to
the user prompt, and reads `candidates[0].content.parts[0].text` (`App.jsx:98-110`).
`callCohere` sends `{ message, preamble, model: 'command-r-08-2024' }` with a bearer token and
reads `data.text` (`App.jsx:112-127`). Both strip Markdown code fences before returning.

`callAI` is a bare `try`/`catch`: anything Gemini throws (missing key, quota, region block,
malformed response) silently promotes Cohere to primary (`App.jsx:129-136`). If Cohere is also
unconfigured the error surfaces to the caller.

### Prompt contract

The plan generator asks for a JSON array and constrains the model to the local library
(`App.jsx:231`):

> Generate a JSON array of exercises for a `{level}` level `{focus}` workout. Use only names
> from this list: `{names}`. Return ONLY the raw JSON array. Format: `[{"name": ..., "value": 15}]`

The response is parsed and then re-hydrated against `EXERCISE_LIBRARY` by case-insensitive name
match (`App.jsx:236-240`). A match is spread from the library entry, so `videoId`, `icon`,
`muscle`, and `type` always come from trusted local data and only `count`/`duration` come from
the model. Non-matches return `null` and are filtered out. A hallucinated exercise therefore
cannot reach the UI, and a malformed response yields an empty plan rather than a crash.

The same mechanism produces the session tips: a 20-word-max prompt whose failure is
non-fatal and falls back to the string `"Focus on form!"` (`App.jsx:184-185`).

## Environment variables

Both a real `.env.local` and Vercel project settings work; each value falls back to a hardcoded
default if unset (`App.jsx:22-29`).

| Variable | Required | Purpose |
| --- | --- | --- |
| `VITE_FIREBASE_API_KEY` | yes | Firebase web key |
| `VITE_FIREBASE_AUTH_DOMAIN` | yes | e.g. `project.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | yes | Firestore project |
| `VITE_FIREBASE_STORAGE_BUCKET` | yes | Storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | yes | Sender ID |
| `VITE_FIREBASE_APP_ID` | yes | Web app ID |
| `VITE_GEMINI_API_KEY` | no | Primary AI provider |
| `VITE_COHERE_API_KEY` | no | Fallback AI provider |

With no AI key set the app still runs: manual routine building, the workout runner, history and
stats all work, and AI actions report an error toast.

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in the Firebase values
npm run dev                  # http://localhost:5173
npm run build                # static output in dist/
npm run preview
```

Firebase side, once per project: enable **Authentication > Anonymous**, create a **Firestore**
database, and allow the `artifacts/{appId}/users/{uid}/...` path for authenticated users only.
Anonymous auth is what makes `user.uid` available, so email/password or other providers are not
required.

## Known issues

- **Entrance animations do nothing.** `animate-in`, `fade-in`, `slide-in-from-bottom` and
  `slide-in-from-right` appear throughout (`App.jsx:261`, `App.jsx:282`, `App.jsx:344`,
  `App.jsx:416`, `App.jsx:491`), but they come from `tailwindcss-animate`, which is not in
  `package.json` and not registered in `tailwind.config.js` (`plugins: []`). The classes compile
  to nothing.
- **`font-bebas` is not a Tailwind utility.** It is defined in the injected `<style>` block
  (`App.jsx:195`) and works because a plain CSS class of that name is emitted at runtime. It is
  absent from `tailwind.config.js`, so it is invisible to tooling.
- **Fonts load via `@import` inside a runtime `<style>` tag** (`App.jsx:194`), which forces a
  late render-blocking request instead of a `<link>` in `index.html`.
- **AI keys ship to the browser.** Vite inlines every `VITE_*` variable into the built bundle.
  See Security below.
- **Rep-based sets have no timer.** They wait for the checkmark tap (`App.jsx:319`,
  `App.jsx:365`); only timed sets count down.
- **`user.uid` is read in render paths** (`App.jsx:219`, `App.jsx:477`) while the subscription
  effect guards with `if (!user) return` (`App.jsx:163`). A render between sign-out and
  re-auth would throw.
- **`initializeFirestore` runs at module scope** (`App.jsx:43`), so a hot reload that
  re-evaluates the module can raise "Firestore has already been initialized".
- **AI generation overwrites the plan name** with `` `${focus} Build` `` (`App.jsx:404`).
- **No tests, no linter, no CI.** Nothing enforces the prompt contract or the line map above.
- **`experimentalAutoDetectLongPolling`** (`App.jsx:45`) is an experimental Firebase flag.

## Security

Verified against this repository on the current commit:

- **No Gemini or Cohere credential has ever been committed.** Both read from the environment
  with an empty-string default (`App.jsx:90-91`). A sweep of all commits (`git log -p --all`)
  finds no AI key, no `.env` file ever tracked, and no bearer-token literal. The only
  Google-format key in history is the Firebase web key.
- **The Firebase web API key is hardcoded** as a fallback (`App.jsx:33`). This is normal for
  Firebase web clients, where the key identifies the project rather than authenticating it; the
  real control is Firestore security rules. Unauthenticated reads against the Firestore REST API
  are rejected (403), so the database is not world-readable.
- **`.gitignore` was missing entirely** and is now present, excluding `.env*`, `dist/`,
  `node_modules/`, and `.vercel/`.
- **The keys live in Vercel project settings, not in the repo.** That is the right place for a
  server secret, but because the variable names carry the `VITE_` prefix, Vercel's build step
  substitutes them into `dist/assets/*.js` exactly as any other build machine would. They are
  not held server-side. Storing them in Vercel keeps them out of git; it does not keep them out
  of the browser.
- **Deployment protection is currently the only thing between those keys and the public.** The
  Vercel deployments linked to this repository resolved to a Vercel login page rather than the
  app at audit time, so the bundle was not publicly served. If protection is disabled, or moved
  to a tier that leaves production open, every key in the project becomes downloadable in a
  single request. Treat that setting as load-bearing rather than incidental.

The structural risk remains: this is a client-only app. Because Vite statically inlines
`VITE_GEMINI_API_KEY` and `VITE_COHERE_API_KEY` into `dist/assets/*.js`, **anyone who can load
the deployed app can read those keys** out of the bundle. The only sound fix is a server-side
proxy that holds the keys and calls the providers on the app's behalf.

## Revival notes

If this is picked back up, in rough priority order:

1. Move AI calls behind a serverless function (`/api/generate`) and drop the `VITE_` prefix from
   both AI keys so they never enter the bundle. Rotate the existing keys first.
2. Replace the `getViteEnv` fallbacks with a startup check that fails loudly when Firebase config
   is missing, instead of shipping credentials in source.
3. Install `tailwindcss-animate` and add it to `plugins` to make the existing animation classes
   real, or delete them.
4. Add a proper font `<link>` in `index.html` and register `bebas` in `tailwind.config.js`.
5. Split `App.jsx` into modules, and introduce a router only if deep links are needed.
6. Add Firestore rules tests plus a smoke test around the JSON re-hydration step, which is the
   part most likely to break silently.



