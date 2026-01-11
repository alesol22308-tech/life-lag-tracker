# Life Lag

A preventative self-maintenance web app that detects early "life drift" before burnout or collapse occurs. Users complete a 3-minute weekly check-in, receive a Lag Score (0-100), drift category, and one personalized, actionable tip.

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Backend**: Supabase (Auth, Postgres)
- **Mobile**: Capacitor (iOS + Android ready)
- **Hosting**: Vercel

## Setup

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Database Setup

1. Go to your Supabase project SQL Editor
2. Run the migration file: `supabase/migrations/001_initial_schema.sql`
3. Verify tables and RLS policies are created

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
life-lag/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Auth routes (login, callback)
│   ├── (app)/             # Protected app routes (checkin, results, settings)
│   ├── api/               # API routes
│   └── page.tsx           # Landing page
├── components/            # React components
├── lib/                   # Utilities and business logic
│   ├── calculations.ts    # Lag score calculation
│   ├── tips.ts            # Tip selection logic
│   └── supabase/          # Supabase client utilities
├── types/                 # TypeScript type definitions
└── supabase/              # Database migrations
```

## Features

### Weekly Check-in

Users answer 6 questions on a 1-5 scale:
1. Energy (mental + physical)
2. Sleep consistency
3. Daily structure
4. Task initiation
5. Engagement / follow-through
6. Effort sustainability

### Lag Score Calculation

- Converts each answer to drift: `(5 - value) / 4`
- Averages across 6 questions
- Multiplies by 100
- Applies 0.8 softening factor
- Returns integer 0-100

### Drift Categories

- 0-19: Aligned
- 20-34: Mild Drift
- 35-54: Moderate Drift
- 55-74: Heavy Drift
- 75-100: Critical Drift

### Tip System

- Identifies lowest-scoring question
- Selects one tip based on dimension + category
- Critical Drift: Only sleep or load reduction tips
- Format: Focus, Constraint, Choice

### Results Display

- All results are displayed immediately on the web app
- No email notifications - everything stays in the app

## Mobile Setup (Capacitor)

### Prerequisites

- iOS: Xcode (Mac only)
- Android: Android Studio

### Setup

1. Install Capacitor CLI:
```bash
npm install -g @capacitor/cli
```

2. Add platforms:
```bash
npx cap add ios
npx cap add android
```

3. Build the Next.js app:
```bash
npm run build
```

4. Sync with Capacitor:
```bash
npx cap sync
```

5. Open in native IDE:
```bash
npx cap open ios
# or
npx cap open android
```

### Configuration

Edit `capacitor.config.json` to customize app ID and name.

## Deployment

### Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (for server operations) | Yes |
| `NEXT_PUBLIC_APP_URL` | Your app URL | Yes |

## Development

### Key Files

- `lib/calculations.ts`: Lag score and drift category logic
- `lib/tips.ts`: Tip selection system
- `app/api/checkin/route.ts`: Check-in submission handler
- `supabase/migrations/001_initial_schema.sql`: Database schema

### Testing Checklist

- [ ] User can sign up with email
- [ ] User can complete check-in
- [ ] Results display correctly
- [ ] Streak tracking works
- [ ] Settings page functions
- [ ] Protected routes redirect to login

## License

Private - All rights reserved
