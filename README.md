# VOICEADS

VOICEADS helps businesses generate high-converting advertisements using real customer reviews instead of guessed marketing language.

## Features

- Extract insights from real Google Maps reviews
- Generate structured JSON ad copy
- Create marketing copy with customer language
- Design image ad creatives
- All content based on actual customer reviews

## Getting Started

### Prerequisites

**Groq API Key**
- Go to [Groq Console](https://console.groq.com/)
- Sign up or log in
- Navigate to API Keys section
- Create a new API key

### Setup

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Add your Groq API key to `.env.local`:
   ```
   GROQ_API_KEY=your_groq_api_key_here
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
