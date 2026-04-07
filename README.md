# Desk Setup Landing Page Project

This project is a premium, modern "Desk Setup" landing page built with Next.js App Router, Tailwind CSS, and Supabase. Features a responsive Bento Grid layout, perfect for showcasing your workspace gear.

## Quick Start

1. **Setup Supabase:**
   Create a Supabase project and execute the SQL file `supabase_schema.sql` in the SQL Editor to create the necessary tables and Row Level Security policies.

2. **Set Environment Variables:**
   Create a `.env.local` file in your root directory and copy your API Keys from Supabase:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Install Dependencies & Run:**
   ```bash
   npm install
   npm run dev
   ```

## Features
- **Responsive Bento Grid:** Beautifully arranged gear cards using CSS Grid. 
- **Dark Mode Aesthetic:** Pre-configured premium dark styling.
- **Admin Dashboard `/admin`:** A secure route behind Supabase Auth to add and manage your desk setup showcase items directly from the web interface.
- **Micro-Animations:** Fluid transitions with Framer Motion natively integrated.
- **Optimized Performance:** Uses Next.js Server Components for SEO readiness and faster initial load.

## Managing Data
All items are controlled securely using the `/admin` page. Login with your registered Supabase user email and password. Since Row Level Security (RLS) is enabled natively, only authenticated sessions can modify data.
