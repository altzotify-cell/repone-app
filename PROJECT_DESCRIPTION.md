# Project Description

## One-liner

A browser-only calisthenics trainer that generates bodyweight routines with a dual-engine AI (Gemini, Cohere fallback) and logs every session to Firestore.

## Short description

REPONE is a mobile-first workout app for people training with nothing but their own bodyweight. Pick exercises from a 30-move library or let an AI assemble a plan for your level and target area, then run the routine with a guided timer, rest intervals, and inline form videos. Routines and completed sessions sync in realtime across devices through Firebase, and a small dashboard charts the last seven sessions plus lifetime totals.

## Long description

REPONE exists to remove the setup work from bodyweight training. Instead of scrolling through a list of movements and guessing at sets, you either hand-build a routine from a curated library or hand two choices, experience level and target area, to an AI that returns a structured plan.

The AI layer is deliberately constrained. The model is asked for JSON and told it may only use exercise names that already exist in the bundled library. Whatever comes back is re-hydrated against that library by name, so videos, muscle groups and rep-versus-time semantics always come from trusted local data and only the rep target is taken from the model. If it returns a malformed payload the app produces an empty plan instead of crashing, and if Gemini fails for any reason the request falls through to Cohere.

The workout runner is the part that gets used most. Timed holds count down, rep-based moves wait for a tap, a fifteen-second rest is inserted between sets and can be extended, and a progress bar tracks position in the plan. Every exercise carries a YouTube id so form can be checked mid-set. Finishing a session writes a history entry with elapsed minutes and an estimated calorie figure.

All state lives in Firestore under `artifacts/repone-pro-v14/users/{uid}`, using anonymous auth so there is no signup. Reads are live subscriptions with a persistent multi-tab cache, which keeps the app usable offline and consistent across open tabs. The whole application is a single 509-line React component file with no router, no state library, and no build-time backend.

## Tech

React 18, Vite 4, Tailwind CSS 3, Firebase (anonymous auth + Firestore), Recharts, lucide-react, Google Gemini and Cohere for text generation.

## Topics

`react` `vite` `tailwindcss` `firebase` `firestore` `gemini` `cohere` `llm` `fitness` `calisthenics` `bodyweight` `workout-tracker` `single-file` `recharts` `pwa-style` `archived`

## Status

Archived. Functional as written, no longer maintained. The AI calls run from the client, so any public deployment exposes the provider keys in the bundle; see the Security section of the README.
