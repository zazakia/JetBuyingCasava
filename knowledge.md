# JetAgriTracker Knowledge

## Project Overview
JetAgriTracker is a React-based agricultural management application built with TypeScript, Vite, and Supabase. It helps farmers and agricultural organizations track farmers, lands, crops, and transactions.

## Key Technologies
- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL database, authentication)
- **Build Tool**: Vite
- **Package Manager**: pnpm
- **Testing**: Vitest, React Testing Library

## Architecture
- Uses custom `jetagritracker` schema in Supabase
- Offline-first design with sync capabilities
- Context-based state management for auth and data
- Component-based UI with reusable forms and managers

## Authentication
- Supabase Auth with email/password
- Custom user profiles in `jetagritracker.user_profiles` table
- Role-based access (admin, manager, user)
- Email verification flow

## Database Schema
- Uses `jetagritracker` schema prefix for all tables
- Main entities: farmers, lands, crops, transactions, user_profiles
- Database triggers for automatic profile creation
- Row Level Security (RLS) policies

## Development Notes
- Environment variables in `.env.local` (not tracked in git)
- Development server runs on port 5173
- Database setup requires running SQL files in `database/` folder
- Offline actions stored in localStorage for sync

## Common Issues
- URL validation is case-sensitive - ensure `supabase.co` is lowercase
- Database schema must be set up before app functions properly
- 404 errors indicate missing database tables/schema

## Deployment
- Multiple deployment scripts available (Vercel, Netlify)
- Environment variables must be configured in deployment platform
