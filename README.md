# 🔥 Pain Pulse

**Internet Frustration Barometer** — Discover what people are complaining about, asking for, and struggling with on Reddit & Hacker News.

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Tailwind](https://img.shields.io/badge/Tailwind-4.0-38bdf8)

## Features

- 🔍 **Real-time analysis** of Reddit and Hacker News
- 📊 **Pain Index** — Quantified frustration score (0-100)
- 💡 **Opportunity Score** — Startup potential based on buyer intent
- 📈 **Pain Spikes** — Week-over-week trend analysis
- 📝 **Raw Receipts** — Copyable quotes for validation
- 🚀 **Build Ideas** — AI-free heuristic suggestions
- 🔗 **Shareable Reports** — Public URLs with OG images

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Database**: Firebase Firestore (server-only)
- **Deployment**: Firebase Hosting (Next.js Web Frameworks)

## Getting Started

### Prerequisites

- Node.js 20+
- Firebase project with Firestore and Hosting enabled

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/pain-pulse.git
cd pain-pulse

# Use Node 20
nvm use 20

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local
```

### Environment Setup

Edit `.env.local` with your Firebase credentials:

```bash
FB_PROJECT_ID=your-project-id
FB_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FB_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

#### Getting Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project → **Project Settings** → **Service Accounts**
3. Click **"Generate new private key"**
4. Open the downloaded JSON and copy the values:
   - `project_id` → `FB_PROJECT_ID`
   - `client_email` → `FB_CLIENT_EMAIL`
   - `private_key` → `FB_PRIVATE_KEY`

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build

```bash
npm run build
npm start
```

## Deployment

### Firebase Hosting

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Enable web frameworks: `firebase experiments:enable webframeworks`
4. Deploy: `firebase deploy --only hosting`
5. Set environment variables in the Firebase Console (Environment Configuration for Functions).

> ⚠️ **Note**: Environment variables use `FB_*` prefix instead of `FIREBASE_*` because Firebase Cloud Functions reserves that prefix.

> ⚠️ **Security**: Never commit `.env.local` or any secrets to git. The `.gitignore` is already configured correctly.

## Firestore Rules

Since we use server-only Firebase Admin SDK, deny all client access:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/pulse` | Generate or fetch cached report |
| GET | `/api/pulse?slug=...` | Get cached report |
| GET | `/api/og?slug=...` | Generate OG image |

### Rate Limiting

- 10 requests per minute per IP
- 5-day cache on reports

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── og/route.tsx         # OG image generation
│   │   └── pulse/route.ts       # Main API
│   ├── pulse/[slug]/page.tsx    # Report page
│   └── page.tsx                 # Landing page
├── components/
│   ├── pulse/                   # Report UI components
│   └── ui/                      # shadcn components
├── lib/
│   ├── analysis/                # Scoring algorithms
│   ├── sources/                 # Reddit & HN clients
│   ├── firebase-admin.ts        # Firestore client
│   ├── rate-limit.ts            # Rate limiting
│   └── slug.ts                  # URL utilities
└── types/
    └── pulse.ts                 # TypeScript interfaces
```

## License

GNU AFFERO GENERAL PUBLIC LICENSE — see [LICENSE](LICENSE)

---

**Built for makers who solve real problems.** 🚀
