# EduBuddy — AI Student Learning Assistant (PS04)

Built for **PromptWars x Code1 Innovators (Hack2Skill)** — *PS04: EduBuddy - Student Learning Assistant (Education Domain)*.

## Problem Statement
Students often struggle to understand complex academic topics and find learning resources that match their understanding levels. **EduBuddy** is an interactive AI-powered learning platform that simplifies difficult concepts across 4 adaptive understanding levels, recommends level-matched learning resources, tutors via the Socratic method, decodes dense lecture notes, and reinforces mastery with adaptive quizzes and 3D flashcards.

## Key Features
- **4-Level Adaptive Concept Simplifier**: Instantly transform explanations between **ELI5 Beginner**, **High School**, **Undergraduate**, and **Exam Mastery** — complete with step-by-step breakdowns, interactive SVG Concept Maps, real-world analogies, key formulas, common misconceptions, and Text-to-Speech narration.
- **Personalized Learning Resource Matcher**: Ranks curated videos, interactive simulators, university notes, and practice sets with a real-time **Level Fit %** score and personal Study Plan queue.
- **Interactive AI Socratic Tutor**: Guided study chat with toggleable Socratic Mode, quick-action prompts (*Explain like I'm 10*, *Give an analogy*, *Memory trick*, *Quiz me*), and dual-engine AI support.
- **Adaptive Quiz & 3D Flip Flashcards**: Instant feedback with hints, adaptive level-up/level-down recommendations, and spaced-repetition flashcards with mnemonics.
- **Dense Note & Textbook Simplifier**: Paste textbook paragraphs or upload `.txt`/`.md` notes to generate TL;DR summaries, simplified explanations, a jargon decoder glossary, and self-test questions (exportable as Markdown).
- **Mastery Progress Dashboard**: Tracks XP, streaks, quiz accuracy, subject readiness, and saved study plans locally.
- **Zero-Setup Smart Mode + Optional Live Gemini AI**: Runs 100% reliably out-of-the-box for demos, and seamlessly upgrades to live **Google Gemini 2.5 Flash** when a user adds their Gemini API key in Settings.

## Run Locally
```bash
npm install
npm run dev
```

## Build for Production
```bash
npm run build
```

## Deploy (1-Click Options)
- **Vercel**: Import this GitHub repository in [vercel.com/new](https://vercel.com/new) — auto-detected via `vercel.json`.
- **Netlify**: Drag and drop the `dist/` folder to [app.netlify.com/drop](https://app.netlify.com/drop) or connect GitHub (`netlify.toml` preconfigured).
- **GitHub Pages**: Push to `main` and enable **Settings → Pages → Source: GitHub Actions** (workflow included in `.github/workflows/deploy.yml`).
