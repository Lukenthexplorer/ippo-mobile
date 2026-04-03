#!/bin/bash
echo "🔨 Building..."
npx expo export --platform web --clear

echo "📝 Adding Vercel config..."
cat > dist/vercel.json << 'VERCEL'
{
  "rewrites": [
    { "source": "/((?!_expo|assets).*)", "destination": "/index.html" }
  ]
}
VERCEL

echo "🚀 Deploying..."
cd dist && vercel --prod

echo "✅ Done!"
