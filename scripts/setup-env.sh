#!/bin/bash

# Setup script for JetAgriTracker Environment Variables

echo "🌱 JetAgriTracker Environment Setup"
echo "==================================="
echo

# Check if .env.local exists
if [ -f ".env.local" ]; then
    echo "✅ .env.local file already exists"
    echo "📝 Please edit .env.local with your Supabase credentials"
else
    echo "📁 Creating .env.local from template..."
    cp .env.example .env.local
    echo "✅ .env.local created"
fi

echo
echo "🔧 Next steps:"
echo "1. Edit .env.local with your Supabase credentials:"
echo "   - VITE_SUPABASE_URL=https://your-project-id.supabase.co"
echo "   - VITE_SUPABASE_ANON_KEY=your_supabase_anon_key"
echo
echo "2. Get your credentials from:"
echo "   - Go to your Supabase project dashboard"
echo "   - Navigate to Settings → API"
echo "   - Copy the Project URL and anon/public key"
echo
echo "3. Run the app:"
echo "   pnpm dev"
echo
echo "📖 For complete setup instructions, see SUPABASE_SETUP_JETAGRITRACKER.md"