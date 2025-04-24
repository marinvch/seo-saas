#!/bin/bash

# Migration script to move files from src/ to root directory
# Created for SEO SaaS project restructuring

echo "Starting migration from src directory to root..."

# Create directories at root level if they don't exist
mkdir -p components hooks lib store types

# Move components directory
echo "Moving components directory..."
cp -r src/components/* components/

# Move hooks directory
echo "Moving hooks directory..."
cp -r src/hooks/* hooks/

# Move lib directory
echo "Moving lib directory..."
cp -r src/lib/* lib/

# Move store directory
echo "Moving store directory..."
cp -r src/store/* store/

# Move types directory
echo "Moving types directory..."
cp -r src/types/* types/

# Handle the app directory carefully - merge with existing app
echo "Merging app directories..."
cp -r src/app/globals.css app/
cp -r src/app/api app/
cp -r src/app/auth app/
cp -r src/app/dashboard app/
cp -r src/app/onboarding app/

# Copy layout.tsx from src/app to app, but be careful not to overwrite if exists
if [ ! -f app/layout.tsx ]; then
  cp src/app/layout.tsx app/
  echo "Moved layout.tsx to app directory"
else
  echo "app/layout.tsx already exists, please merge manually"
fi

# Don't copy page.tsx directly as it might conflict with existing redirect
if [ ! -f app/page.tsx.src ]; then
  cp src/app/page.tsx app/page.tsx.src
  echo "Copied src/app/page.tsx to app/page.tsx.src for manual merging"
fi

echo "Migration completed. Please verify the changes and update imports if necessary."
echo "Don't forget to update the page.tsx file manually to merge the content from both versions."
