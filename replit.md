# Grounded Warriors - Men's Healing Retreat Companion

## Overview

Grounded Warriors is a holistic web application designed for men's healing and personal growth, serving both individual warriors (clients) and guides (coaches). It integrates ground check tracking, daily anchors (habits), reflections (journaling) with AI prompts, grounding practice (breathing exercises), and an AI voice companion (Coach Brian). The platform aims to provide a comprehensive wellness experience focused on grounding, healing, and authentic masculine growth - featuring nature-focused language and metaphors throughout.

## Brand Guidelines

### Voice & Tone
- **Direct and grounded**: No spiritual bypassing, speak plainly
- **Warm without being soft**: Name hard truths when needed
- **Nature-focused**: Use metaphors of forest, fire, water, earth, roots, descent
- **Brotherhood context**: Men's healing retreat environment

### Terminology
- Mood tracking → "Daily Ground Check"
- Habits → "Daily Anchors"
- Journaling → "Reflections"
- Breathing exercises → "Grounding Practice"
- Vent/Crisis → "Release"
- Clients → "Warriors"
- Coaches → "Guides"

### Color Palette (Dark Forest Theme)
- Night Forest: `#0D1F17` (darkest, backgrounds)
- Deep Pine: `#1A3328` (cards, elevated surfaces)
- Forest Floor: `#3D5A4C` (borders, muted elements)
- Sage: `#87A892` (accent, text highlights)
- Birch: `#D4C5A9` (primary accent, CTAs)

### Typography
- Headings: Cormorant Garamond with letter-spacing 0.1-0.2em
- Body: Inter

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

Grounded Warriors is a full-stack TypeScript application featuring a mobile-first React frontend and an Express.js backend with PostgreSQL.

### Frontend Architecture

The frontend uses React 18 with TypeScript, Wouter for routing, and TanStack Query for server state management. UI components are built with Radix UI primitives and shadcn/ui, styled using Tailwind CSS. The design adopts a dark forest theme, mobile-first approach, clean cards, and nature-focused design language with `Inter`/`Cormorant Garamond` fonts. A fixed bottom navigation bar ensures easy access to core features across `Ground`, `Reflect`, `Coach`, `Practice`, and `Profile`. Guides have an additional "Brotherhood" tab.

### Backend Architecture

The backend is built with Node.js and Express.js, utilizing Drizzle ORM for PostgreSQL database interactions. Authentication is handled via email/password with session storage. AI services integrate OpenAI for chat (GPT-4o-mini), text-to-speech (TTS-1), and reflection prompt generation. The server structure is modular, separating routes, storage, authentication, and AI services.

### Authentication System

Authentication is managed through email/password login with secure password hashing. Sessions are stored in PostgreSQL with a 7-day expiration. First-time users select their role (warrior/guide) during registration.

### Data Storage

PostgreSQL database is used with Drizzle ORM, with a schema defining tables for `users`, `sessions`, `moods` (ground checks), `habits` (anchors), `journal_entries` (reflections), `homework`, `vision_board_items`, `vent_messages` (releases), `user_achievements`, `user_settings`, `app_profiles`, `user_profile_assignments`, and guide-warrior relationships (`coach_clients`, `coach_invites`). User roles include `client` (warrior), `coach` (guide), and `superadmin`, with privacy settings allowing warriors to control data shared with their guides.

### App Profile Configuration System

The application supports multiple "personalities" through a super admin configuration system:

- **App Profiles**: Stored in `app_profiles` table with customizable theme tokens (CSS variables) and feature flags
- **Theme Tokens**: JSONB field containing color overrides (nightForest, deepPine, forestFloor, sage, birch, ember)
- **Feature Flags**: JSONB field toggling features on/off (groundCheck, dailyAnchors, reflections, groundingPractice, coachBrian, visionBoard, achievements, release, brotherhood)
- **User Assignments**: Super admins can assign specific profiles to users via `user_profile_assignments`
- **Default Profile**: One profile can be marked as default for new users without explicit assignment
- **Admin Panel**: Accessible at `/admin` for superadmin users to manage profiles and user assignments

### AI Integration

The application integrates OpenAI services for:
- **Coach Brian**: Grounded, direct AI guide utilizing GPT-4o-mini for honest, nature-focused conversations, incorporating user ground checks, reflections, and anchors data.
- **Text-to-Speech**: Converts AI responses into audio using TTS-1 with a natural voice.
- **Reflection Prompt Generation**: GPT-4o-mini generates personalized reflection prompts using grounding language and nature metaphors.

### Features

- **Daily Ground Check**: Emoji-based check-ins tracking how grounded users feel.
- **Daily Anchors**: Grounding practices with streak tracking (cold water, forest walks, breathwork, etc.).
- **Reflections**: Journaling with AI-generated prompts using grounding language.
- **Grounding Practice**: Multiple breathing techniques including 4-7-8, box breathing, Wim Hof method.
- **Coach Brian**: Interactive AI chat with direct, grounded voice.
- **Vision Board**: Goal visualization with images and descriptions.
- **Achievements**: Nature-themed badges for milestones (Tree, Roots, Fire, etc.).
- **Release**: Private messaging for releasing heavy emotions (formerly "vent").
- **Guide Features**: Brotherhood dashboard, data access (privacy-controlled), homework assignment, invite system.
- **Warrior Features**: Guide connection, granular privacy settings, homework tracking.

## External Dependencies

- **Server-side**:
    - `express`, `express-session`: Web framework and session management.
    - `drizzle-orm`, `pg`: PostgreSQL ORM and client.
    - `openai`: Integration with OpenAI API.
    - `passport`: Authentication handling.
    - `@sendgrid/mail`: Email notifications.
- **Client-side**:
    - `react`, `react-dom`: UI framework.
    - `@tanstack/react-query`: Server state management.
    - `wouter`: Lightweight client-side routing.
    - `framer-motion`: Animations.
    - `Radix UI`, `shadcn/ui`: UI component libraries.
    - `tailwindcss`: CSS framework.
    - `lucide-react`: Icons.
- **Utilities**:
    - `zod`, `drizzle-zod`: Schema validation.
    - `date-fns`: Date manipulation.
    - `class-variance-authority`: Component styling utilities.

## Logo Assets

- Primary logo with text: `attached_assets/gw-lockup-vertical-512_1765492642920.png`
- Logo mark only: `attached_assets/gw-logo-primary-512_1765492642920.png`
- Badge/circular: `attached_assets/gw-badge-512_1765492642920.png`
- Icon (simplified): `attached_assets/gw-icon-512_1765492642920.png`
- Light variant: `attached_assets/gw-logo-light-512_1765492642919.png`
- REWIRE brand logo: `client/public/brands/rewire-logo.jpeg`

## Fork Setup Instructions

When forking this application to create a new instance, complete the following steps:

### 1. Environment Variables (Required)
Configure these secrets in your forked Repl:
- `DATABASE_URL` - PostgreSQL connection string (auto-provisioned by Replit)
- `SESSION_SECRET` - Random string for session encryption
- `OPENAI_API_KEY` - For AI coach and TTS features
- `SENDGRID_API_KEY` - For email notifications
- `SENDGRID_FROM_EMAIL` - Sender email address

### 2. Database Setup
1. Replit will auto-provision a PostgreSQL database
2. Run `npm run db:push` to create tables
3. The app will seed default data on first run

### 3. Create Your App Profile
1. Register a superadmin account
2. Access `/admin` to create your brand profile with:
   - Brand name and description
   - Theme colors (hex values for nightForest, deepPine, forestFloor, sage, birch, ember)
   - Fonts (fontDisplay for headings, fontSans for body)
   - Feature flags (enable/disable features)
   - Logo URL (place logo in `client/public/brands/`)
3. Mark your profile as default

### 4. Brand Assets
1. Place your logo in `client/public/brands/your-logo.png`
2. Update `client/index.html` meta tags (og:title, og:description)
3. Replace favicon if needed

### 5. Security
- Change default superadmin credentials immediately after first login
- Never commit secrets to the repository

### 6. Optional Integrations
- **Google Calendar/Mail**: Requires service account credentials
- **SendGrid**: Required for email features (invites, notifications)
