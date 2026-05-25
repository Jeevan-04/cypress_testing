#!/usr/bin/env bash
set -euo pipefail

# setup_git_repo.sh
# Initializes a git repository in the current folder (if none), adds all files, commits, and optionally sets remote and pushes.
# Usage:
#   ./setup_git_repo.sh               # just initialize and commit locally
#   REMOTE_URL=https://github.com/USER/REPO.git ./setup_git_repo.sh   # initialize, commit, add remote and push
# NOTE: Run this script from /Users/jeevan/Desktop/Cypress

REMOTE_URL=${REMOTE_URL:-}
BRANCH=${BRANCH:-main}

echo "Working directory: $(pwd)"

# Ensure we are in expected folder
if [ ! -f "config.xml" ] && [ ! -f "Jenkinsfile" ]; then
  echo "Warning: this directory doesn't look like the Cypress workspace (no config.xml or Jenkinsfile found). Continue? (y/N)"
  read -r ans
  if [ "${ans,,}" != "y" ]; then
    echo "Aborted."; exit 1
  fi
fi

if [ ! -d .git ]; then
  echo "Initializing new git repository..."
  git init
else
  echo "Git repository already initialized."
fi

# Create a helpful .gitignore if missing
if [ ! -f .gitignore ]; then
  cat > .gitignore <<'EOF'
node_modules/
.cypress/
coverage/
.env
.DS_Store
cypress/screenshots/
cypress/videos/
/tmp/
EOF
  echo "Wrote .gitignore"
fi

# Add all files and commit
echo "Adding files to git..."
git add -A

if git diff --cached --quiet; then
  echo "No changes to commit."
else
  git commit -m "Initial commit: add Cypress project and Jenkins job config"
  echo "Committed changes."
fi

# Set branch name
# If branch already exists locally, switch; otherwise create
if git rev-parse --verify "$BRANCH" >/dev/null 2>&1; then
  git checkout "$BRANCH"
else
  git branch -M "$BRANCH" || true
fi

# If REMOTE_URL provided, add remote and push
if [ -n "$REMOTE_URL" ]; then
  echo "Adding remote origin: $REMOTE_URL"
  if git remote | grep -q origin; then
    git remote remove origin
  fi
  git remote add origin "$REMOTE_URL"
  echo "Pushing branch $BRANCH to origin (this may prompt for credentials)..."
  git push -u origin "$BRANCH"
  echo "Pushed to $REMOTE_URL"
else
  echo "No REMOTE_URL provided. To push to GitHub, create a repo and run:\n  git remote add origin https://github.com/YOURNAME/REPO.git\n  git push -u origin $BRANCH"
fi

echo "Done."
