---
name: deploy-to-galaga-vps
description: "Deploy a Next.js project to the Galaga Agency VPS (5.75.178.191) — Docker standalone container behind an Apache reverse proxy, added to the shared docker-compose.yml, with a self-hosted GitHub Actions runner for redeploys. Invoke when asked to deploy, ship, or put a project live/online/in production, to set up a Dockerfile or deploy workflow for the VPS, to add a domain or SSL certificate, or when a deployed container won't start, a workflow fails with `no such service`, containers vanish after a reboot, or the live site shows localhost URLs."
---

# Next.js → Galaga Agency VPS Deployment

## ⚠️ STOP — confirm this project deploys HERE before anything else

This skill fires on any deploy request, but it is **specific to the Galaga Agency VPS
(5.75.178.191)**. It is wrong for Vercel, Netlify, AWS, Railway, Render, or a client's own
server.

Before step 1, confirm the target:
- Check `README.md`, `.github/workflows/`, `vercel.json`, `Dockerfile`, `docker-compose.yml`.
- If nothing names the Galaga VPS, **ask the user which host this project deploys to** and
  wait for the answer.
- A `*.dospordosgrupoimagen.com` project goes to the Dos x Dos server: use `deploy-to-dosxdos-server`.
- If it is not the Galaga VPS, say so and stop. Do not adapt this procedure to another host —
  the Apache proxy, shared compose file and self-hosted runner are all specific to this box.


## 🛑 HOW TO RUN THIS SKILL — read before anything else

**ONE STEP AT A TIME. Wait for the user's output before sending the next one.**

The user is at a terminal, working. They are not reading a document. Dumping the whole
procedure at once is useless to them and actively harmful: they cannot tell which command
is current, and an error in step 2 is invisible under the wall of steps 3-10.

Every message you send during a deploy is:

1. **One** command block, copy-pasteable, nothing else to decide.
2. One line saying what it does.
3. One line saying what a correct result looks like.
4. Then STOP. Wait for them to paste the output back.

Do not send step N+1 until you have seen the output of step N. Do not append "and then
you'll want to…". Do not summarise the remaining steps. Do not re-explain what you already
explained. No status tables, no recaps of completed work, no restating what the files contain.

If they say "next", send exactly one next step.

**Do not narrate your own work.** They do not need to know which file you edited or what you
verified. They need the command. Prose is the enemy here — a step is a code block plus at most
two short lines.

**Never paste secrets into the conversation.** Reference `.env.local` on the server or write to
a file. If the user pastes a secret at you, say so in one line and tell them to rotate it —
once, not repeatedly.


The exact procedure in use on the server. Follow the order; it reflects what actually worked.

**Claude cannot reach the VPS.** Everything in Phase A is done locally by Claude. Everything in
Phase B is SSH work the user runs — output the commands as a numbered block for them to paste,
and wait for their result before continuing. Never claim a server step succeeded.

## Server baseline

| | |
|---|---|
| VPS IP | `5.75.178.191` (Ubuntu 24.04, Apache2) |
| Project root | `/home/galagaagency/proyectos` (root disk) |
| Shared compose | `/home/galagaagency/proyectos/docker-compose.yml` |
| Docker network | `galaga_network` |
| Docker data-root | `/mnt/HC_Volume_104520317/docker` (data volume `/dev/sdb`, 99 GB) |
| Runner | organization-level self-hosted |

Two disks. Root `/dev/sda1` (38 GB) holds the OS, Apache, git checkouts and `.env` files.
The Hetzner volume holds all images, overlay2 layers and Docker volumes. **Builds consume the
volume, not root** — check headroom with `df -h /mnt/HC_Volume_104520317`, not `df -h /`.

---

## Phase A — local, before touching the server

### 0. 🛑 STOP — ask for the domain and port FIRST

**Do not write a single deployment file until the user has answered both.** These are not
details to fill in later: `NEXT_PUBLIC_SITE_URL` is compiled into the bundle at build time, so
guessing the domain means a full rebuild, not a restart. Guessing the port means an Apache vhost
that proxies to nothing, or a silent collision with a running project.

Never infer either one. Not from the repo name, not from an existing project, not from "the next
port looks free". Ask, then wait.

This is not hypothetical. On 2026-08-24 the placeholder `3009` looked free against a list gathered
on the **wrong server**; on Galaga it was occupied. The 3000-block there runs 3000–3012 solid, so
a guess anywhere in the obvious range collides with a live project.

**Ask the user directly — use AskUserQuestion, do not just note it as unknown and carry on:**

1. **What domain?** (e.g. `frontonking.com`, `app.galagaagency.com`) — needed for
   `NEXT_PUBLIC_SITE_URL`, the vhost, and Certbot.
1b. **What service name?** Decide it HERE, not while writing the workflow. It must be byte
   identical in three places: the compose key, `docker compose build/up <name>` in the workflow,
   and `docker ps --filter name=<name>`. Invent it in the workflow and every run dies with
   `no such service` — which happened on 2026-08-24 (`fronton_king_frontend` in the workflow vs
   `fronton-king` in compose). Match the house style: `ecc-yachts`, `algolpito` — kebab-case,
   no `_frontend` suffix.
2. **Which host port?** — hand them this command and wait for the output:

```bash
# Paste on the Galaga VPS. Aborts loudly if you are on the wrong machine.
COMPOSE=/home/galagaagency/proyectos/docker-compose.yml
if [ ! -f "$COMPOSE" ]; then
  echo "WRONG SERVER: $COMPOSE not found. You are on $(hostname) as $(whoami)."
  echo "Expected the Galaga VPS (5.75.178.191, user galagaagency). Aborting."
else
  { grep -hoE '^\s*-\s*"?[0-9]+:[0-9]+' "$COMPOSE" | grep -oE '[0-9]+:' | tr -d ':'
    docker ps --format '{{.Ports}}' | grep -oE '0\.0\.0\.0:[0-9]+' | cut -d: -f2
    ss -ltnH | grep -oE ':[0-9]+ ' | tr -d ': '
  } | sort -n -u | awk '{printf "%s ", $0} END {print ""}'
fi
```

⚠️ **Verify the server before trusting the output.** Galaga is not the only box in play —
`DXD-APPSRV` (user `dosxdosadmin`) is a different machine entirely. Run this on the wrong one and
the `grep` fails on the missing compose file while `docker ps` and `ss` still answer, so you get a
**plausible but wrong port list** with only a one-line error scrolled off the top. That happened on
2026-08-24. Hence the guard above: no compose file, no output.

The absolute path (not `~`) is deliberate — `~` silently resolves to whichever user is logged in.

Three sources on purposeThree sources on purpose — the compose file shows what is *declared*, `docker ps` what is
*running*, and `ss` catches anything bound outside Docker (Apache, Postgres) that would collide
just as hard. A port must be absent from all three.

Before trusting any output, confirm the box: `hostname; whoami; ls ~/proyectos/docker-compose.yml`.
A port list gathered on the wrong server is worse than no list — it looks authoritative.

If the user does not have SSH open, ask them for the port rather than picking one. A wrong port
is discovered late, at the vhost step, after the image is already built.

Record both answers in the skill's project section (or MEMORY.md) so the next deploy does not
have to ask again.

### 1. Confirm shape and read env usage

`package.json` should have the standard `dev`/`build`/`start` scripts. Then:

```bash
rg -n "process\.env" --glob '!node_modules/**'
```

Sort every hit into three buckets. **This sorting is the step that most often goes wrong** — see
the two failure modes below.

### 2. `next.config.ts` — add `output: "standalone"`

Keep existing wrappers (`next-intl`, etc.); add the key inside the config object only.

```ts
const nextConfig: NextConfig = {
  output: "standalone",
  // ...existing keys stay
}
export default withNextIntl(nextConfig)
```

### 3. 🔴 `NEXT_PUBLIC_*` must be passed into the BUILDER stage

Next inlines `NEXT_PUBLIC_*` at **build** time. The compose `environment:` block only exists at
**run** time, so a public var that is missing during `docker compose build` is baked in as
`undefined` — or, worse, as its `??` fallback.

**This fails silently.** No error, no warning. `NEXT_PUBLIC_SITE_URL` falling back to
`http://localhost:3000` poisons every canonical URL, hreflang alternate, sitemap entry and OG tag
on the live site. It is only visible in the rendered `<head>`.

Every public var needs `ARG` + `ENV` in the builder stage AND a `build.args` entry in compose:

```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .

ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
# ...repeat ARG/ENV for EVERY NEXT_PUBLIC_* var the app reads

RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production HOSTNAME=0.0.0.0 PORT=3000
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
```

`--legacy-peer-deps` over `npm ci` — lockfile mismatches break `npm ci` in Docker on this server.

**Running as a non-root user?** Then that user must own `.next`, or the image optimizer fails
at runtime with `EACCES: permission denied, mkdir '/app/.next/cache'` (every `next/image`
request errors). Copy with ownership:

```dockerfile
RUN addgroup -S nodejs -g 1001 && adduser -S nextjs -u 1001 -G nodejs
COPY --from=builder /app/public ./public
RUN mkdir .next && chown nextjs:nodejs .next
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
```

Server-only secrets are the opposite: they belong ONLY in runtime `environment:`/`env_file:`.
Never `ARG` a secret — build args are readable in the image history.

### 3.5 🔴 Dynamic imports get dropped from the standalone build

`output: "standalone"` traces files with `@vercel/nft`, which analyses `import`/`require`
**statically**. A template-literal path cannot be resolved, so those files are silently omitted
from `.next/standalone`.

next-intl's `i18n/request.ts` is exactly this shape:

```ts
import(`@/locales/${locale}/common.json`)   // ← nft cannot resolve this
```

The failure is nasty: the local build is fine, `npm run build` is green, and the container starts
happily — then every page 500s at runtime because the messages are not on disk. Fix in
`next.config.ts`:

```ts
outputFileTracingIncludes: {
  "/*": ["locales/**/*.json"],
},
```

**Verified on this repo:** without it, `find .next/standalone -path "*locales*"` returns 0 files.
With it, 30 (5 locales × 6 namespaces). Always run that check after the first build.

Any other dynamic `import()` — MDX content, JSON fixtures, per-tenant config — needs the same
treatment. Keep the globs narrow; avoid `**/*` at the repo root.

### 4. 🔴 Secrets must not be read at module scope

If a module instantiates a client with a secret at import time, `next build` fails in Docker where
that env is absent.

```ts
const client = new Something({ apiKey: process.env.MY_SECRET })   // ❌ fails at build
```

The fix is a lazy getter, read inside the request handler at runtime:

```ts
export const serverConfig = {
  stormglass: { apiKey: () => required(process.env.STORMGLASS_API_KEY, "STORMGLASS_API_KEY") },
}
```

**In this repo this is already correct** — `config/app.config.ts` is the single `process.env` site
and wraps every secret in `() => required(...)`. Preserve that pattern; don't "simplify" a getter
into a direct read or the Docker build starts failing.

### 5. `.dockerignore`

```
.git
.gitignore
.next
node_modules
npm-debug.log
README.md
.env*
.DS_Store
```

### 6. `.github/workflows/deploy.yml`

`concurrency` matters: two pushes in quick succession otherwise race on the same checkout and
the same compose service, and the second `git reset --hard` can yank files from under a running
build.

```yaml
name: Deploy <Project> to VPS
on:
  push:
    branches: [main]
concurrency:
  group: deploy-<project>
  cancel-in-progress: false
jobs:
  deploy:
    runs-on: self-hosted
    steps:
      - name: Pull latest changes
        run: |
          cd /home/galagaagency/proyectos/<project-folder>/<repo-name>
          git fetch origin main && git reset --hard origin/main && git clean -fd
      - name: Rebuild and restart
        run: |
          cd /home/galagaagency/proyectos
          docker compose build <service_name>
          docker compose up -d <service_name>
      - name: Check status
        run: sleep 5 && docker ps --filter "name=<service_name>"
      - name: Verify the app answers
        run: |
          curl -fsS -o /dev/null -w "%{http_code}\n" http://localhost:<host-port> || \
            (docker logs <service_name> --tail 50; exit 1)
```

The last step matters: `docker ps` shows a *created* container, not a *working* one. Without a
curl check a crash-looping app reports a green deploy.

### 7. Gate: the local build must pass

```bash
npm run build

# Then verify the standalone output is actually complete — a green build is NOT enough:
ls .next/standalone/server.js                              # the minimal server exists
find .next/standalone -path "*locales*" -name "*.json" | wc -l   # matches locales × namespaces
```

Do not start Phase B until all three are green. The container build is not more forgiving than
local — and the tracing gap in §3b passes the build while breaking the container.

Then `git push origin main`.

---

## Phase B — server, run by the user over SSH

Uses the domain and port confirmed in **Step 0**. If either is still unknown, go back — do not
improvise one here.

```bash
# 1. Verify Docker's data-root is on the volume — if this is wrong, STOP
docker info | grep "Docker Root Dir"        # → /mnt/HC_Volume_104520317/docker
df -h /mnt/HC_Volume_104520317              # headroom for the build

# 2. Clone
mkdir -p ~/proyectos/<project-folder> && cd ~/proyectos/<project-folder>
git clone https://github.com/Galaga-Agency/<repo-name>.git

# 3. Re-confirm the port is still free (another project may have landed since Step 0)
cat ~/proyectos/docker-compose.yml
```

Add the service to the shared compose file. Pick **one** env source — inline `environment:` or
`env_file:` — not both for the same var. `build.args` is separate and always needed for public vars:

```yaml
  <service_name>:
    build:
      context: ./<project-folder>/<repo-name>
      dockerfile: Dockerfile
      args:
        NEXT_PUBLIC_SITE_URL: "https://fronton-king.galagaagency.com"
        # every other NEXT_PUBLIC_* var
    container_name: <service_name>
    restart: always
    ports: ["<host-port>:3000"]
    environment:
      NODE_ENV: production
      NEXT_PUBLIC_SITE_URL: "https://fronton-king.galagaagency.com"
      # server-only secrets here (or via env_file)
    networks: [galaga_network]
```

```bash
# 4. Build, start, verify
cd ~/proyectos
docker compose config > /tmp/compose-check.yml     # `version` is obsolete → harmless
docker compose build <service_name>
docker compose up -d <service_name>
docker ps --filter name=<service_name>
curl -I http://localhost:<host-port>               # 307 → /es is CORRECT on an i18n app
```

Apache vhost at `/etc/apache2/sites-available/<domain>.conf`:

```apache
<VirtualHost *:80>
  ServerName <domain>
  ProxyPreserveHost On
  ProxyPass / http://localhost:<host-port>/
  ProxyPassReverse / http://localhost:<host-port>/
  ErrorLog ${APACHE_LOG_DIR}/<project>-error.log
  CustomLog ${APACHE_LOG_DIR}/<project>-access.log combined
  RewriteEngine on
  RewriteCond %{SERVER_NAME} =<domain>
  RewriteRule ^ https://%{SERVER_NAME}%{REQUEST_URI} [END,NE,R=permanent]
</VirtualHost>
```

```bash
# 5. Enable, SSL, verify origin
sudo a2ensite <domain>.conf && sudo apache2ctl configtest && sudo systemctl reload apache2
curl -I -H "Host: <domain>" http://127.0.0.1          # expect 301 → https
sudo certbot --apache -d <domain>
curl -k -I --resolve <domain>:443:127.0.0.1 https://<domain>   # 200 or locale 307
docker logs <service_name> --tail 100
```

### 🔴 MANDATORY FINAL STEP — empty commit + watch the run

**Never end a deployment without this.** Not optional, not "if there's time". A deploy is not
finished until an empty commit has gone green through the workflow.

`docker compose up` succeeding by hand proves only that you can build it by hand. It says nothing
about whether the runner picks the job up, whether the service names match, or whether a push
actually redeploys. Those fail independently — and they failed on 2026-08-24 with the container
already live and serving traffic.

Run it yourself, do not ask the user to:

```bash
git commit --allow-empty -m "ci: verify runner" && git push origin main
gh run watch $(gh run list --limit 1 --json databaseId --jq '.[0].databaseId') --exit-status
```

All steps must pass, including the curl verify. `no such service` means the workflow's service
name does not match the compose key — see Step 0 (1b).

If it fails: fix, push, and watch again. Repeat until green. Only then report the deploy done —
and report the run result explicitly, never "it should redeploy automatically".

### Confirm it is YOUR app being served, not the default vhost

A wildcard DNS record means the domain answers `200` before you deploy anything, from whatever
Apache serves by default. Check identity, never just the status code:

```bash
curl -s https://<domain>/<locale> | grep -oE '<title>[^<]*</title>'   # must be YOUR title
curl -s https://<domain>/<a-route-only-your-app-has> -o /dev/null -w "%{http_code}\n"
curl -s https://<domain>/<locale> | grep -oE '<link rel="canonical"[^>]*>'  # no localhost
```

### Post-deploy check on an i18n project

Confirm the public vars actually baked in — this catches the §3 failure:

```bash
for l in es en de fr pt; do
  curl -s https://<domain>/$l | grep -oE '<link rel="canonical"[^>]*>'
done
```

Any `localhost:3000` in that output means the build args were missing. Rebuild; a restart alone
will not fix it — the wrong value is compiled into the bundle.

---

## Known recurring issues

| Symptom | Cause → Fix |
|---|---|
| Containers gone after reboot | Docker started before the volume mounted, made a fresh data-root on `/`. Check `docker info \| grep "Docker Root Dir"` and that `/etc/systemd/system/docker.service.d/override.conf` has `RequiresMountsFor=/mnt/HC_Volume_104520317`. Then `daemon-reload && systemctl restart docker`. |
| Port list looks fine but nothing matches | Command was run on the wrong server (e.g. `DXD-APPSRV`). Check `hostname; whoami`. See §0. |
| Workflow: `no such service` | Name mismatch between workflow and compose key (or service missing entirely). They must be byte identical. See Step 0 (1b). |
| `cannot lock ref 'refs/remotes/origin/main'` | `rm -f .git/refs/remotes/origin/main && git fetch origin && git reset --hard origin/main` |
| Live site shows `localhost:3000` URLs | Missing `build.args` for `NEXT_PUBLIC_*`. See §3. Rebuild, don't restart. |
| Build fails on a missing secret | Secret read at module scope. See §4. |
| Build fails installing deps | Use `npm install --legacy-peer-deps`, not `npm ci`. |
| Repo on VPS lacks deploy files | Cloned before they existed. Push locally, then `git reset --hard origin/main` on the server. |
| Pages 500 in container, fine locally | Dynamic `import()` dropped from the trace. See §3.5, add `outputFileTracingIncludes`. |
| Green deploy but site is down | Workflow only ran `docker ps`. Add the curl verify step. |
| `version` is obsolete warning | Harmless. Optionally drop `version: "3.9"`. |
| Root disk filling | Not Docker anymore. Check `du -sh /var/log /home/galagaagency/proyectos`. |

Cleanup (reclaims volume space): `docker system prune -a`, `docker builder prune -a`.

**High-I/O database exception:** the volume is network-attached SSD — fine for image layers, not
ideal for a write-heavy DB. Bind-mount only that DB's data dir to the root disk:
`- /var/lib/pgdata:/var/lib/postgresql/data`.

---

## Fronton King — concrete values

Filled in and verified on 2026-08-24. Everything below is already committed in the repo except
the compose block, which lives on the server.

| | |
|---|---|
| Repo | `Galaga-Agency/fronton_king` |
| Checkout | `/home/galagaagency/proyectos/fronton-king/fronton_king` |
| Service | `fronton_king_frontend` |
| Host port | `3013` — verified free on 2026-08-24 (3000–3012 all taken) |
| Domain | `fronton-king.galagaagency.com` (confirmed 2026-08-24) |
| Stack | Next 16.3.1, next-intl, `proxy.ts`, locales `es en de fr pt` (default `es`) |

`curl -I http://localhost:3013` returning `307 → /es` is correct, not a fault.

Compose service to add to `/home/galagaagency/proyectos/docker-compose.yml` — the public values
are duplicated in `args` (build) and `environment:` (runtime) on purpose; secrets are runtime only:

```yaml
  fronton_king_frontend:
    build:
      context: ./fronton-king/fronton_king
      dockerfile: Dockerfile
      args:
        NEXT_PUBLIC_SITE_URL: "https://fronton-king.galagaagency.com"
        NEXT_PUBLIC_EVENT_YEAR: "2026"
        NEXT_PUBLIC_EVENT_START: "2026-10-17"
        NEXT_PUBLIC_EVENT_END: "2026-10-31"
        NEXT_PUBLIC_SUPABASE_URL: "<from .env.local>"
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "<from .env.local>"
        NEXT_PUBLIC_SURFSCORES_SCOREBOARD_URL: "https://www.surfscores.com/ESP/2026/frk001/"
    container_name: fronton_king_frontend
    restart: always
    ports:
      - "3013:3000"
    environment:
      NODE_ENV: production
      NEXT_PUBLIC_SITE_URL: "https://fronton-king.galagaagency.com"
      NEXT_PUBLIC_EVENT_YEAR: "2026"
      NEXT_PUBLIC_EVENT_START: "2026-10-17"
      NEXT_PUBLIC_EVENT_END: "2026-10-31"
      NEXT_PUBLIC_SUPABASE_URL: "<from .env.local>"
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "<from .env.local>"
      NEXT_PUBLIC_SURFSCORES_SCOREBOARD_URL: "https://www.surfscores.com/ESP/2026/frk001/"
      SUPABASE_SERVICE_ROLE_KEY: "<secret>"
      SURFSCORES_API_URL: "https://surfscores.com/api/v1"
      SURFSCORES_EMAIL: "<secret>"
      SURFSCORES_PASSWORD: "<secret>"
      SURFSCORES_ORG_ID: "17"
      SURFSCORES_LEAGUE_ID: "180"
      SURFSCORES_EVENT_ID: "<from .env.local>"
      STORMGLASS_API_KEY: "<secret>"
      WORLDTIDES_API_KEY: "<secret>"
      CRON_SECRET: "<secret>"
    networks:
      - galaga_network
```

Real values come from `.env.local` in the repo root — never commit them, never paste them into
a chat log. `WORLDTIDES_API_KEY` is in `.env.local` but not yet read by `config/app.config.ts`;
carry it anyway so the container is ready when the tides sync lands.

---

## ⚠️ galagaagency.com sits behind Cloudflare — read before Certbot

`galagaagency.com` uses Cloudflare nameservers (`tori`/`henry.ns.cloudflare.com`) and has a
**wildcard `*.galagaagency.com` → 5.75.178.191**. Two things follow.

**1. A new subdomain already "works" before you deploy anything.** The wildcard means it resolves
and Apache answers with its default vhost. On 2026-08-24 `fronton-king.galagaagency.com` returned
a healthy `200` on `/es` — but it was serving the *Galaga Agency* site, not Fronton King. Both are
Next i18n apps, so the locale redirect looked convincing.

Never treat "the domain responds" as "my app is deployed". Check what it actually serves:

```bash
curl -s https://<domain>/es | grep -oE '<title>[^<]*</title>'
curl -s -o /dev/null -w "%{http_code}\n" https://<domain>/<a-route-only-your-app-has>
```

A 404 on your own route means you are looking at someone else's vhost.

**2. Certbot's HTTP-01 challenge cannot reach the origin through an orange-clouded record.**
Check the proxy state first — Cloudflare IPs (104.x / 172.67.x) mean proxied; `5.75.178.191`
means DNS-only:

```bash
dig +short A <domain>
```

Options, in order of preference:

- **Grey-cloud, then Certbot** — turn the proxy OFF for the subdomain, run `sudo certbot --apache`,
  optionally re-enable. Real origin cert, matches the guide, survives Cloudflare being disabled.
- **Cloudflare Origin Certificate** — keep the proxy, install a CF-issued origin cert on Apache,
  set the CF SSL mode to *Full (strict)*. No Certbot at all.
- **Never use Flexible mode.** It leaves Cloudflare→origin as plaintext HTTP while the padlock
  shows for visitors.

Whichever you pick, the Apache HTTP vhost and the `ProxyPass` to the container port are identical.
Only the TLS step differs.
