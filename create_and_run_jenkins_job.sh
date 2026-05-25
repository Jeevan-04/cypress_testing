#!/usr/bin/env bash
set -euo pipefail

# One-shot script to create/update Jenkins Pipeline job from config.xml, trigger a build, and stream console output.
# Run this on the machine that can reach Jenkins at http://localhost:8080

# Edit these only if necessary
JENKINS_URL="http://localhost:8080"
JOB_NAME="Atithya-Cypress-Weekly"
CONFIG_PATH="/Users/jeevan/Desktop/Cypress/config.xml"
USER="admin"
PASS="cb193109d4634561959533d7f9283992"

echo "Using Jenkins: $JENKINS_URL"
echo "Job name: $JOB_NAME"
echo "Config path: $CONFIG_PATH"

# attempt to fetch crumb (works if CSRF protection enabled)
echo "Fetching Jenkins crumb..."
CRUMB_RESPONSE=$(curl -s -u "$USER:$PASS" "$JENKINS_URL/crumbIssuer/api/xml?xpath=concat(//crumbRequestField,\":\",//crumb)" || true)
echo "CRUMB_RESPONSE: '$CRUMB_RESPONSE'"

CRUMB_HEADER_ARGS=()
if [[ -n "$CRUMB_RESPONSE" ]]; then
  IFS=":" read -r CRUMB_FIELD CRUMB_VALUE <<< "$CRUMB_RESPONSE"
  echo "Using crumb header: $CRUMB_FIELD"
  CRUMB_HEADER_ARGS=(-H "$CRUMB_FIELD: $CRUMB_VALUE")
else
  echo "No crumb (CSRF) info - continuing without crumb header"
fi

# check if job exists (HTTP 200)
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -u "$USER:$PASS" "$JENKINS_URL/job/$JOB_NAME/api/json" || true)
if [[ "$HTTP_CODE" == "200" ]]; then
  echo "Job already exists (HTTP $HTTP_CODE) — updating its config.xml..."
  curl -v -u "$USER:$PASS" "${CRUMB_HEADER_ARGS[@]:-}" -X POST \
    "$JENKINS_URL/job/$JOB_NAME/config.xml" \
    -H "Content-Type: application/xml" \
    --data-binary @"$CONFIG_PATH" \
    -D /tmp/jenkins_create_headers.txt -o /tmp/jenkins_create_body.txt || true
else
  echo "Job does not exist (HTTP $HTTP_CODE) — creating job..."
  curl -v -u "$USER:$PASS" "${CRUMB_HEADER_ARGS[@]:-}" -X POST \
    "$JENKINS_URL/createItem?name=$JOB_NAME" \
    -H "Content-Type: application/xml" \
    --data-binary @"$CONFIG_PATH" \
    -D /tmp/jenkins_create_headers.txt -o /tmp/jenkins_create_body.txt || true
fi

echo "----- create/update response headers -----"
cat /tmp/jenkins_create_headers.txt || true
echo "----- create/update response body -----"
cat /tmp/jenkins_create_body.txt || true

# verify job exists
echo "Verifying job exists..."
curl -s -u "$USER:$PASS" "$JENKINS_URL/job/$JOB_NAME/api/json" -o /tmp/jenkins_job.json || true
if [[ -s /tmp/jenkins_job.json ]]; then
  echo "Job created/updated successfully. Job API JSON saved to /tmp/jenkins_job.json"
else
  echo "Job not found or API error. Check the previous response body for details and ensure Jenkins URL/credentials are correct."
  exit 1
fi

# Trigger a build
echo "Triggering a build..."
curl -s -u "$USER:$PASS" "${CRUMB_HEADER_ARGS[@]:-}" -X POST "$JENKINS_URL/job/$JOB_NAME/build" -o /tmp/jenkins_trigger_body.txt || true
echo "Trigger response saved to /tmp/jenkins_trigger_body.txt"

# Wait for lastBuild to appear (poll up to 60s)
echo "Waiting for a build to start..."
BUILD_NUM=""
for i in {1..60}; do
  sleep 1
  JSON=$(curl -s -u "$USER:$PASS" "$JENKINS_URL/job/$JOB_NAME/api/json" || true)
  BUILD_NUM=$(echo "$JSON" | sed -n 's/.*"lastBuild":[^0-9]*\([0-9][0-9]*\).*/\1/p' || true)
  if [[ -n "$BUILD_NUM" && "$BUILD_NUM" != "null" ]]; then
    echo "Found build number: $BUILD_NUM"
    break
  fi
done

if [[ -z "$BUILD_NUM" || "$BUILD_NUM" == "null" ]]; then
  echo "Timed out waiting for build to start. Check the job page in Jenkins UI."
  exit 1
fi

# Stream console text once available
echo "Streaming console output for build #$BUILD_NUM..."
curl -s -u "$USER:$PASS" "$JENKINS_URL/job/$JOB_NAME/$BUILD_NUM/consoleText" || true

echo "Done."
