#!/bin/bash
# Stock Image Scheduler - runs every 4 hours
# This script is executed by the Hermes cron system

cd /data/workspace/nash-graphic

# Load Supabase credentials from environment
export SUPABASE_URL=$(grep -oP "SUPABASE_URL\s*=\s*'\K[^']+" js/config.js)
export SUPABASE_KEY=$(grep -oP "SUPABASE_ANON\s*=\s*'\K[^']+" js/config.js)

echo "Stock Image Collector Starting..."
echo "Supabase URL: ${SUPABASE_URL}"
echo "Key length: ${#SUPABASE_KEY}"

# Run the collector
python3 scripts/stock-image-collector.py

echo "Stock Image Collector Done!"
