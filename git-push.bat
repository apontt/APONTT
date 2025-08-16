@echo off
git add .
git commit -m "Fix: Netlify build error - convert to ES modules"
git push origin main
pause