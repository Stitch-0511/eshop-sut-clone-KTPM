#!/bin/bash
killall node
cd /Users/hanhtran/Downloads/EShop/backend && node server.js &
cd /Users/hanhtran/Downloads/EShop/frontend-web && npm run dev &
cd /Users/hanhtran/Downloads/EShop/frontend-admin && npm run dev &
