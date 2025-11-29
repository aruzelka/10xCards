# 10xCards

**Version:** 0.0.1  
**Status:** Alpha (Initial MVP under active development)

## TODO: Implementujemy endpoint /flacards - wygenerowany opis, należy dogenerować endpointy

## Description

10xCards is a web application designed to streamline the creation of educational flashcards. Leveraging AI, the platform automatically generates question-and-answer pairs from user-provided text, significantly reducing the time required to prepare effective study materials. Users can also manually create, edit, and organize their flashcards. An integrated spaced repetition algorithm helps optimize retention during study sessions.

## Table of Contents

- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Tech Stack

- **Astro 5** – Static site builder with minimal JavaScript
- **React 19** – Interactive UI components
- **TypeScript 5** – Static typing and IDE support
- **Tailwind CSS 4** – Utility-first styling framework
- **Shadcn/ui** – Prebuilt React component library
- **Supabase** – PostgreSQL database, authentication, and SDK
- **Openrouter.ai** – Unified AI model API (OpenAI, Anthropic, Google, etc.)
- **GitHub Actions** – CI/CD pipelines
- **DigitalOcean** – Docker-based hosting

## Getting Started

### Prerequisites

- **Node.js v22.14.0** (use NVM)
- npm or yarn

### Installation

```bash
git clone https://github.com/aruzelka/10xCards.git
cd 10xCards
nvm use 22.14.0
npm install
```

### Running Locally

```bash
npm run dev
```

Open your browser at `http://localhost:3000` to view the app.

## Available Scripts

- `npm run dev` – Run development server with hot reload
- `npm run build` – Build production-ready site
- `npm run preview` – Preview production build locally
- `npm run astro` – Execute Astro CLI commands
- `npm run lint` – Run ESLint on codebase
- `npm run lint:fix` – Run ESLint and fix issues
- `npm run format` – Format code with Prettier

## Project Scope

### In Scope (MVP)
- User registration, email verification, login/logout
- AI-powered flashcard generation from text input
- Manual creation, editing, and deletion of flashcards
- Review and acceptance workflow for AI-generated cards
- Session-based study view using external spaced repetition algorithm
- GDPR-compliant data storage and user data management

### Out of Scope (MVP)
- Custom spaced repetition algorithm
- Importing content from PDF, DOCX, PPTX
- Social or sharing features
- Native mobile apps (iOS/Android)
- Gamification and notification systems
- Advanced search and public API

## Project Status

Alpha – Version 0.0.1 under active development.

## License

This project is licensed under the MIT License. 
