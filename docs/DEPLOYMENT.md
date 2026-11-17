# interaction-playground deployment

Production: https://interaction-playground.ericzwierzynski.dev

Vercel project `interaction-playground` in `Eric's projects` hosts the Vite frontend from
GitHub `ericshark/interaction-playground`, production branch `main`.
The architecture is Browser → Vercel static assets. Production was built from `main` at `cbf2b18`, the same commit as the jellyfish preview, before the deployment documentation update.

The custom domain is attached to the production environment. Cloudflare hosts
its DNS-only CNAME using the project-specific target returned by Vercel.
Existing Vercel addresses remain available. No backend custom domain was added.
No application environment variables are configured in Vercel.

Push reviewed commits to `main`, check GitHub Actions when configured, and verify
the corresponding Vercel production deployment. Check Vercel's deployment logs
if a build fails. If no Git deployment appears, deploy the exact Git commit through
Vercel rather than assuming the push released it. Roll back through Vercel's
previous production deployment, then verify the production URL again.

Verified on November 16, 2026: DNS, HTTPS, and an HTTP 200 response at the custom
URL. This setup uses the existing Vercel Hobby project and Cloudflare DNS; no
paid resources were added.
