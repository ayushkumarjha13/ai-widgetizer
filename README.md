# ChatWatch: n8n Custom AI Chat Widget Platform

ChatWatch is a professional SaaS platform designed to transform standard n8n workflows into high-end, branded AI chat widgets with advanced analytics.

## 🚀 Features

- **Custom Branding**: Fully white-labeled widgets. Use your own logos, colors, and welcome messages.
- **Advanced Analytics**: Track opens, messages, and unique sessions in real-time.
- **Sentiment Analysis**: AI-powered insight into how your customers feel.
- **Geographical Tracking**: Know where your users are coming from.
- **One-Line Embed**: Works everywhere—Wordpress, Webflow, React, or plain HTML.
- **Starter Pro Tips**: Integrated monthly usage tracker to help you upsell subscription tiers.

## 🛠️ Tech Stack

- **Frontend**: Vite + React + Tailwind + Lucide Icons
- **Backend / Database**: Firebase (Auth & Firestore)
- **Deployment**: Supports any static site hosting (Vercel, Netlify, Firebase Hosting)

## 📦 Getting Started

### 1. Prerequisite
- Node.js (v18+)
- A Firebase project
- An n8n instance with a webhook trigger

### 2. Setting Up Environment Variables
Create a `.env` file in the root directory and add your Firebase credentials:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Run Locally
```bash
npm run dev
```

### 5. Build for Production
```bash
npm run build
```

The generated widget script for public use is located in `dist/widget.js` and `src/pages/Builder.tsx`.

## 📈 Database Scaling Tips (Pro)

To ensure high-performance at scale, we recommend:
- **Denormalization**: Use Cloud Functions or server-side increments to track message counts instead of on-the-fly aggregation.
- **TTL Policies**: Archive analytics older than 90 days to BigQuery to keep Firestore reads efficient.
- **Composite Indexes**: Ensure you've enabled indexes for `ownerUid` and `timestamp`.

## ⚖️ License
MIT
