# Operations Overview

> Last updated: 2026-02-24

This document provides a high-level overview of the operational landscape for the Volleyball Ranking Engine.

## Infrastructure Summary

The Volleyball Ranking Engine is a SvelteKit 2.50 monolith backed by Supabase (hosted PostgreSQL). The architecture intentionally avoids microservices in favor of a single managed database and a single application deployment.

| Component      | Technology                                | Hosting                  |
| -------------- | ----------------------------------------- | ------------------------ |
| Application    | SvelteKit 2.50 (Svelte 5, TypeScript 5.9) | Flexible (adapter-auto)  |
| Database       | PostgreSQL 17                             | Supabase managed service |
| CSS            | Tailwind CSS 4.2 (Vite plugin)            | Bundled with application |
| Math Libraries | ml-matrix, custom Elo                     | Bundled with application |

### Key Characteristics

- **Monolith architecture**: All ranking logic, import pipelines, and export functionality live in a single deployable unit.
- **No self-hosted infrastructure**: Supabase handles PostgreSQL provisioning, backups, connection pooling, and availability.
- **Stateless application tier**: The SvelteKit app holds no server-side session state; all persistence is in PostgreSQL.

## Deployment Model

The project currently uses **manual deployment**. There is no CI/CD pipeline configured.

- **Adapter**: `@sveltejs/adapter-auto` detects the deployment target at build time and selects the appropriate adapter (Vercel, Netlify, Cloudflare Pages, or Node).
- **Build tool**: Vite 7.3 powers both development and production builds.
- **Deployment targets**: Any platform supported by SvelteKit adapters. Switch to a specific adapter (e.g., `adapter-vercel`, `adapter-node`) once a hosting platform is selected.

See [deployment.md](./deployment.md) for detailed deployment procedures.

## Environment Management

The application requires three environment variables for Supabase connectivity:

| Variable                                  | Scope           | Purpose                                                       |
| ----------------------------------------- | --------------- | ------------------------------------------------------------- |
| `PUBLIC_SUPABASE_URL`                     | Client + Server | Supabase project API URL                                      |
| `PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | Client          | Supabase anonymous/publishable key for browser requests       |
| `SUPABASE_SERVICE_ROLE_KEY`               | Server only     | Supabase service role key for elevated server-side operations |

**Environment separation**:

- **Local development**: Variables stored in `.env` at project root (git-ignored).
- **Production**: Set environment variables through the hosting platform's dashboard or secrets manager. Never commit production credentials to source control.
- **Supabase local dev**: Supabase CLI provides a local PostgreSQL instance on port 54322 with its own configuration in `supabase/config.toml`.

## Monitoring Approach

No dedicated monitoring infrastructure is configured. Current observability relies on:

| Layer               | Current Approach                       | Recommended Enhancement                                                         |
| ------------------- | -------------------------------------- | ------------------------------------------------------------------------------- |
| Application errors  | Browser console, SvelteKit error pages | Add structured logging (e.g., Pino) and an error tracker (e.g., Sentry)         |
| Database health     | Supabase Dashboard metrics             | Enable Supabase alerting for connection pool saturation and query latency       |
| API performance     | Manual observation                     | Add request timing middleware and export metrics to a dashboard                 |
| Ranking correctness | Manual review of ranking results       | Automated smoke tests comparing expected vs. actual rankings for known datasets |
| Import pipeline     | Application-level error responses      | Add import audit logging with success/failure counts per batch                  |

### Supabase Dashboard

Supabase provides built-in observability through its dashboard:

- **Database**: Query performance, active connections, storage usage
- **API**: Request counts, latency, error rates
- **Auth**: Sign-in activity (not currently used by the ranking engine)
- **Logs**: PostgreSQL logs, API gateway logs, auth logs

Access the Supabase dashboard at `https://supabase.com/dashboard/project/<project-ref>`.

## Related Documentation

- [Infrastructure Topology](./infrastructure.md) -- Database schema, Supabase configuration, environment variables
- [Deployment Procedures](./deployment.md) -- Build, deploy, rollback procedures
- [Operational Runbooks](./runbooks/README.md) -- Incident response procedures for common failure scenarios
