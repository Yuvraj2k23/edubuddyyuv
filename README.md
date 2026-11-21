# EduBuddy — AI Student Learning Assistant (PS04)

Built for **PromptWars x Code1 Innovators (Hack2Skill)** — *PS04: EduBuddy - Student Learning Assistant (Education Domain)*.

- **Live Public Demo (Vercel):** https://edubuddyyuv.vercel.app
- **Backup Public Demo (GitHub Pages):** https://yuvraj2k23.github.io/edubuddyyuv/
- **Repository:** https://github.com/Yuvraj2k23/edubuddyyuv

---

## Problem Statement
> *Students often struggle to understand complex academic topics and find learning resources that match their understanding levels. Develop an interactive learning platform that helps students simplify difficult concepts, improve their understanding and make their learning experience more effective through AI-powered assistance.*

## Core Features
- **Apple × ChatGPT Home Hub & Floating Quick-Switch Dock**: Time-of-day greeting, direct Omni-Search (*Simplify Topic* / *Ask AI Tutor*), interactive starter chips, and a 6-card Bento workspace launcher.
- **4-Level Adaptive Concept Simplifier**: Instantly transforms explanations across **ELI5 Beginner**, **High School**, **Undergraduate**, and **Exam Mastery**, complete with an animated Apple Silicon-style **Interactive Concept Map** (hover previews + live section breakdown), expandable **Real-World Analogies** (3 angles + 1-to-1 mapping), **Myth vs. Reality Misconception Defense**, and Text-to-Speech narration.
- **Multi-Web & AI Council Socratic Tutor**: Combines **English Dictionary**, **Simple Wikipedia**, **Wikipedia**, and **OpenAlex Research Papers** with **AI Council Debate Mode** (Gemini, ChatGPT, Claude panelist cross-critique + Final Consensus), **Picture/File Uploads** (for asking sub-questions on uploaded images & study notes), and 1-click compare links.
- **Customizable Timed Quizzes & AI Flashcard Studio**:
  - Same-domain challenging MCQs with difficulty selector (`Easy`–`Exam Mastery`), custom question counts (`3/5/8/10`), live countdown timer with Pause/Resume, and full Answer Review.
  - 3D Flip Flashcard Studio supporting **Exam Perspective** *(High-Yield Exam POV vs. explicitly labeled "Just for Knowledge · Not Exam POV" cards)* and **Quick Revision** decks.
- **Personalized Resources Study Hub**: `% Level Fit` ranking, unified level switcher, collapsible **Prerequisites & Next Steps / Quick Cheat Sheet** strip, status tracking (`To Study → In Progress → Completed`), personal study notes, and **+ Add Resource / Notes** modal for student-contributed links, PDFs, and class notes.
- **Dense Note & Textbook Simplifier**: Decodes dense paragraphs into TL;DR, simplified explanations, a jargon decoder glossary, and self-test questions (exportable as Markdown).
- **Dedicated Sidebar Search History & Mastery Dashboard**: Automatically groups recent searches by *Today*, *Yesterday*, and exact *Weekday + Date*, alongside XP, streak, and subject readiness analytics.

## Security, Accessibility & Quality Architecture
- **Security Hardening (`src/utils/security.js`, `vercel.json`, `netlify.toml`, `index.html`)**:
  - User-supplied AI API keys remain strictly in **volatile in-memory React state** (never written to `localStorage`) and Gemini keys are transmitted via the `x-goog-api-key` HTTP header rather than URL query parameters.
  - Strict `sanitizeExternalUrl()` allowlists `http:` / `https:` (blocking `javascript:`, `data:`, and `vbscript:` XSS), all external links include `rel="noopener noreferrer"`, and `validateUploadedFile()` enforces a 5 MB cap + MIME/extension allowlist (blocking SVG script uploads).
  - Production security headers (`Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`).
- **Accessibility (WCAG 2.1 AA)**:
  - Skip-to-main-content link, semantic landmarks (`<main>`, `<aside>`, `<nav>`), `aria-current="page"`, `aria-expanded`, `aria-live="polite"` status regions, keyboard-accessible SVG Concept Map nodes (`Enter`/`Space`), Escape-key modal dismissal, high-contrast `:focus-visible` outlines, and `prefers-reduced-motion` support.
- **Resilience & Automated Testing**:
  - Top-level React `ErrorBoundary` (`src/components/ErrorBoundary.jsx`) and automated unit/integration tests (`tests/*.test.js`) run via `npm test` and GitHub Actions CI (`.github/workflows/ci.yml`).

## Run Locally & Test
```bash
npm install
npm test        # Run automated unit & integration test suite
npm run dev     # Start local dev server
npm run build   # Build optimized production bundle to dist/
```
