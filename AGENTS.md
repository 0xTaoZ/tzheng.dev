# Repository Identity

This repository is Haitao Zheng's production personal website.

Framework:

Astro

Production URL:

`https://tzheng.dev`

# Production Deployment Contract

The only supported production deployment architecture is the existing GitHub Actions pipeline.

Canonical workflow:

`.github/workflows/deploy.yml`

Expected production flow:

push to main
-> npm ci
-> npm run build
-> generate dist
-> upload Pages artifact
-> deploy-pages

Normal website publishing begins with a verified push to main.

The existing GitHub Actions workflow automatically performs deployment.

# Forbidden Without Explicit Owner Approval

Do not:

- switch GitHub Pages to Deploy from branch
- create a gh-pages publishing architecture
- replace Astro with Jekyll
- use .nojekyll as a generic fix
- copy dist manually to repository root
- create a second Pages deployment workflow
- change the Pages source
- redesign the deployment architecture after a transient error

# Failure Handling

Read exact logs first.

Classify the failed layer:

1. source
2. build
3. artifact
4. deployment
5. HTTP/runtime

Only fix the failed layer.

Never change deployment architecture without explicit approval from Haitao.

# Completion

A production publish is complete only when:

- remote main contains the expected commit
- the Actions run for that exact commit succeeds
- build succeeds
- deploy succeeds
- https://tzheng.dev responds successfully
