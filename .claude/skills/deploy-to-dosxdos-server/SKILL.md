---
name: deploy-to-dosxdos-server
description: "Deploy a Next.js module to the Dos x Dos server (DXD-APPSRV: Windows Server + WSL, Apache on Windows, wildcard *.dospordosgrupoimagen.com cert, shared docker-compose on dw-net) and wire it into the shared login and the portal. Invoke when asked to deploy, ship or put live a project whose domain is *.dospordosgrupoimagen.com or whose repo is under the DosxDos GitHub org, to set up its Dockerfile/workflow/vhost/netsh rule, or when such a site serves the wrong app, returns 502 after a server reboot, or login sends people to the portal instead of back to the module."
---

# Next.js → Dos x Dos server (DXD-APPSRV)

Written from the gastos deploy of 2026-10-05, which went end to end in one sitting. It follows
the PDF «Next.js Deployment Guide — Dos x Dos Server» (in `~/Downloads`), plus every trap hit on
the way. Logística (2026-09-10) and gastos are the two reference deploys: their `DEPLOY.md`
files hold the real values.

## ⚠️ STOP — is this the right server?

This is **not** the Galaga VPS (`5.75.178.191`, Ubuntu, Certbot) — that is
`deploy-to-galaga-vps`. Mixing the two guides is the most expensive mistake here.

| | Dos x Dos server | Galaga VPS |
|---|---|---|
| Host | Windows Server + WSL Ubuntu | Ubuntu |
| Apache | on **Windows**, `P:\apache\conf\extra\httpd-vhosts.conf` | on Ubuntu |
| SSL | reuse the wildcard `.pem` — **never Certbot / Win-ACME** | Certbot per domain |
| Windows → container | `netsh portproxy` rule per port | direct |
| Compose / network | `/home/dosxdosadmin/DataWareHouse/datawarehouse/docker-compose.yml`, `dw-net` | `galaga_network` |

Use this skill only when the domain is `*.dospordosgrupoimagen.com`. Otherwise say so and stop.

## 🛑 How to run it — one step at a time

The user is at an SSH session or an admin PowerShell. Every message during the server phase is:

1. **One** copy-pasteable command, with **absolute paths** (`cd /home/dosxdosadmin/...` included).
   "That's not precise" is what a relative `git clone` got.
2. One line: what it does.
3. One line: what correct output looks like.
4. Stop and wait for the pasted output.

Never send step N+1 before seeing N. No recaps, no tables of remaining steps.

**Never hide progress on a long command.** `docker compose build ... | tail -25` printed nothing for
minutes and the user (rightly) refused to wait blind. Long commands stream: `--progress=plain`.

**Claude cannot SSH in, but CAN check the public side.** After the vhost step, `curl` the live
domain (and the sibling sites) yourself instead of asking the user to.

**Secrets.** Other services' blocks in the shared compose hold live keys and passwords. Never
print a range of the compose file that includes another service's `environment:`. If one gets
pasted anyway, say once that it is now in the chat and that rotating it is the user's call.

## Server baseline

| | |
|---|---|
| SSH | `ssh -p 2222 dosxdosadmin@172.16.15.240` (hostname `DXD-APPSRV`) |
| Public IP (Cloudflare A record) | `212.64.162.78` |
| WSL IP | `172.30.171.194` — **changes when the server reboots**, always re-read it |
| Project root (WSL) | `/home/dosxdosadmin/DataWareHouse/datawarehouse` |
| Shared compose | `.../datawarehouse/docker-compose.yml` — ~30 containers, the whole datawarehouse |
| Network / restart | `networks: [dw-net]`, `restart: unless-stopped` |
| Apache (Windows) | binary `P:\apache\bin\httpd.exe`, service name `apache` (not `httpd`) |
| Wildcard cert | `P:/proyectos/DataWareHouse/certificados/wildcard-dospordos-{chain,key}.pem` |
| CI | self-hosted runner; works for repos in the **DosxDos** org (logística, gastos, auth) |

### Ports seen taken (2026-10-05) — a snapshot, ALWAYS re-audit

- In the compose: 88, 3000-3003, 3005, 3006, 3011, 3014, 3015, 3017 (logística), 3100, 3307,
  5010, 5011, 5433-5435, 8081, 8086-8088, 8090, 8091, 9090, 9104, 9115, 9117, 27017
- **Outside the compose** (only visible with `docker ps`): 3016 formulario-frontend,
  3018 facturas-frontend, 3019 planificador-nginx
- 3020 gastos. First free above: 3021.

---

## Phase A — local (Claude does this)

### A.0 Decide the values first

Domain `<app>.dospordosgrupoimagen.com`, service/container name `dosxdos-<app>` (kebab-case,
identical in compose, workflow and `docker ps --filter`), server folder `dosxdos_<app>`. Derive
them from the project; don't stop to ask. The port is NOT decided here — it comes from the B.1
audit, then gets written into the workflow.

A new portal module starts as a copy of logística (`CREAR-UN-MODULO.md`), which already
carries everything below. Check it is all there rather than rewriting it.

### A.1 Repo files

- `next.config.ts`: `output: "standalone"` (the Dockerfile's `node server.js` needs it) and
  `transpilePackages: ["@dosxdos/ui"]` when the shared package is used.
- `Dockerfile`: copy logística's. Two non-obvious lines it carries:
  - `apk add --no-cache git` plus `git config --global url."https://github.com/".insteadOf ...`:
    `@dosxdos/ui` installs from GitHub, and a lockfile written on a laptop pins `git+ssh://`,
    which has no key inside the image.
  - `ARG`/`ENV` for **every** `NEXT_PUBLIC_*` before `npm run build`: they are compiled into the
    bundle, so `environment:` in compose arrives too late.
- `.dockerignore` excludes `.env*`, `.git`, `.next`, `node_modules`.
- `.github/workflows/deploy.yml`: `git fetch` + `reset --hard origin/main` in the server folder,
  `docker compose build/up -d <service>`, then a **curl loop on `localhost:<port>` until 200**
  (a container that is "Up" is not an app that answers). Port placeholder until B.1.
- `DEPLOY.md` with the values table and a checklist (template: gastos's).

### A.2 Push

Push to main. **The first workflow runs fail** (the server folder does not exist yet). That is
expected and harmless; the first run after B.2 is the one that must be green.

---

## Phase B — WSL, over SSH (user runs, one at a time)

### B.1 Audit the port — BOTH sources

```bash
cd /home/dosxdosadmin/DataWareHouse/datawarehouse && grep -oE '"?[0-9]{2,5}:[0-9]{2,5}' docker-compose.yml | tr -d '"' | sort -t: -k1 -n -u
```

then

```bash
docker ps -a --format '{{.Names}} {{.Ports}}' | grep -E '30[2-3][0-9]'
```

The compose file lies by omission: 3016/3018/3019 belong to containers started outside it. A port
must be absent from both. Write the chosen port into the workflow and `DEPLOY.md`, push.

### B.2 Clone into the expected folder name

```bash
cd /home/dosxdosadmin/DataWareHouse/datawarehouse && git clone https://github.com/DosxDos/<repo>.git dosxdos_<app> && ls /home/dosxdosadmin/DataWareHouse/datawarehouse/dosxdos_<app>
```

The repo name and folder name usually differ (`dosxdos_gastos_modulo` → `dosxdos_gastos`).

### B.3 Back up the compose, and prove the backup

```bash
cp /home/dosxdosadmin/DataWareHouse/datawarehouse/docker-compose.yml /home/dosxdosadmin/DataWareHouse/datawarehouse/docker-compose.yml.bak-<yyyymmdd>-<app> && cmp /home/dosxdosadmin/DataWareHouse/datawarehouse/docker-compose.yml /home/dosxdosadmin/DataWareHouse/datawarehouse/docker-compose.yml.bak-<yyyymmdd>-<app> && echo "backup OK"
```

(Not `ls | tail`: the listing is alphabetical and cuts the new file off.)

### B.4 Find where to insert — without printing secrets

```bash
grep -nE '^  [a-z0-9_-]+:$|^networks:' /home/dosxdosadmin/DataWareHouse/datawarehouse/docker-compose.yml | tail -3
```

Shows the last service names and the top-level `networks:` line number, nothing else.
Insert just before `networks:` (on 2026-10-05 the last service was `dosxdos-logistica`).

### B.5 Insert the service block

With `N` = the `networks:` line number minus 2 (after the last service's `restart:` line, keeping
the blank line):

```bash
sed -i '<N>r /dev/stdin' /home/dosxdosadmin/DataWareHouse/datawarehouse/docker-compose.yml <<'EOF'

  dosxdos-<app>:
    build:
      context: ./dosxdos_<app>
      dockerfile: Dockerfile
      args:
        - NEXT_PUBLIC_SITE_URL=https://<app>.dospordosgrupoimagen.com
        - NEXT_PUBLIC_AUTH_URL=https://auth.dospordosgrupoimagen.com
        - NEXT_PUBLIC_PORTAL_URL=https://portal.dospordosgrupoimagen.com
    container_name: dosxdos-<app>
    ports:
      - "<port>:3000"
    environment:
      - NODE_ENV=production
    networks: [dw-net]
    restart: unless-stopped
EOF
grep -n -A16 '^  dosxdos-<app>:' /home/dosxdosadmin/DataWareHouse/datawarehouse/docker-compose.yml; grep -n '^networks:' /home/dosxdosadmin/DataWareHouse/datawarehouse/docker-compose.yml
```

Verify with the service's own block only (`grep -A16`), never a `sed -n` range that reaches into
the previous service's secrets. Server-side secrets go in `environment:` (never `args`), and
never get pasted into the chat.

### B.6 Validate

```bash
cd /home/dosxdosadmin/DataWareHouse/datawarehouse && docker compose config >/dev/null && echo "compose OK"
```

### B.7 Build — streaming

```bash
cd /home/dosxdosadmin/DataWareHouse/datawarehouse && docker compose build --progress=plain dosxdos-<app>
```

3–6 minutes. Ends with `Image datawarehouse-dosxdos-<app> Built`.

### B.8 Start only this service

```bash
cd /home/dosxdosadmin/DataWareHouse/datawarehouse && docker compose up -d dosxdos-<app>
```

The `Found orphan containers ([convencion-dosxdos-app])` warning is harmless. **Never**
`--remove-orphans` (deletes that app) and **never** `docker compose down` (takes the whole
datawarehouse down).

### B.9 Verify inside WSL

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:<port>/ && curl -s http://localhost:<port>/ | grep -o "<title>[^<]*</title>"
```

### B.10 Read the WSL IP

```bash
ip addr show eth0 | grep "inet "
```

---

## Phase C — Windows, PowerShell **as Administrator** (user runs)

Pasting into this console often echoes a `>>` continuation line. It is harmless: the command
runs. Verify by the result, not by the prompt.

### C.1 portproxy rule

```powershell
netsh interface portproxy add v4tov4 listenaddress=127.0.0.1 listenport=<port> connectaddress=<WSL_IP> connectport=<port>
```

Prints nothing on success. Verify:

```powershell
netsh interface portproxy show all | findstr <port>
```

```powershell
curl.exe -s -o NUL -w "%{http_code}" http://localhost:<port>/
```

`curl.exe`, never PowerShell's `curl` alias.

### C.2 Back up the vhosts file

```powershell
Copy-Item P:\apache\conf\extra\httpd-vhosts.conf P:\apache\conf\extra\httpd-vhosts.conf.bak-<yyyymmdd>-<app>; Get-Item P:\apache\conf\extra\httpd-vhosts.conf*  | Select-Object Name, Length
```

Same `Length` on both = good backup.

### C.3 Append both vhosts

```powershell
Add-Content -Path P:\apache\conf\extra\httpd-vhosts.conf -Value @'

# ============ <app>.dospordosgrupoimagen.com  ->  <port> ============
<VirtualHost *:80>
    ServerAdmin soporte@galagaagency.com
    ServerName <app>.dospordosgrupoimagen.com
    DocumentRoot "P:/proyectos/DataWareHouse"

    <Directory "P:/proyectos/DataWareHouse">
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    ProxyRequests Off
    ProxyPreserveHost On
    ProxyPass        / http://localhost:<port>/
    ProxyPassReverse / http://localhost:<port>/

    Timeout 7200
    ProxyTimeout 7200

    ErrorLog "P:/apache/logs/<app>.dospordosgrupoimagen.com-error.log"
    CustomLog "P:/apache/logs/<app>.dospordosgrupoimagen.com-access.log" common
    Header always set Strict-Transport-Security "max-age=0"
</VirtualHost>

<VirtualHost *:443>
    ServerAdmin soporte@galagaagency.com
    ServerName <app>.dospordosgrupoimagen.com
    DocumentRoot "P:/proyectos/DataWareHouse"

    SSLEngine on
    SSLCertificateFile      "P:/proyectos/DataWareHouse/certificados/wildcard-dospordos-chain.pem"
    SSLCertificateKeyFile   "P:/proyectos/DataWareHouse/certificados/wildcard-dospordos-key.pem"
    SSLCertificateChainFile "P:/proyectos/DataWareHouse/certificados/wildcard-dospordos-chain.pem"

    <Directory "P:/proyectos/DataWareHouse">
        AllowOverride All
        Require all granted
    </Directory>

    ProxyRequests Off
    ProxyPreserveHost On
    ProxyPass        / http://localhost:<port>/
    ProxyPassReverse / http://localhost:<port>/

    Timeout 7200
    ProxyTimeout 7200

    ErrorLog  "logs/<app>.dospordosgrupoimagen.com-error.log"
    CustomLog "logs/<app>.dospordosgrupoimagen.com-access.log" common
</VirtualHost>
'@
```

`SSLCertificateFile` pointing at the **chain** `.pem` is how every working subdomain on the box is
set up. Do not "fix" it.

### C.4 Syntax check BEFORE restarting

```powershell
P:\apache\bin\httpd.exe -t; (Select-String -Path P:\apache\conf\extra\httpd-vhosts.conf -Pattern "ServerName <app>.dospordosgrupoimagen.com").Count
```

Expect `Syntax OK` and `2`. The `AH00112 ... dosxdos-vite-backend does not exist` warning predates
everything and is harmless. Anything other than `Syntax OK` → do not restart; restore the backup.
A broken vhost takes down **every** `*.dospordosgrupoimagen.com` site.

### C.5 Restart Apache

```powershell
Restart-Service -Name apache; Get-Service -Name apache
```

It usually hangs on "Esperando a que se detenga el servicio" (the `Timeout 7200` connections).
After ~1 minute: `Ctrl+C`, then

```powershell
Stop-Service -Name apache -Force; Start-Service -Name apache; Get-Service -Name apache
```

Expect `Running`. Every site is down while Apache is stopped, so don't dawdle.

---

## Phase D — Claude verifies, then wires the login

### D.1 Check the public side yourself

```bash
for d in <app> portal auth logistica; do printf "%-10s " $d; curl -s -o /tmp/p.html -w "%{http_code} " --max-time 15 https://$d.dospordosgrupoimagen.com/; grep -o "<title>[^<]*</title>" /tmp/p.html | head -1; echo; done; dig +short <app>.dospordosgrupoimagen.com
```

The new site must show its own title (not «Reloj Laboral»), and the siblings must still be 200
after the Apache restart. DNS must answer `212.64.162.78`.

If the domain serves the **reloj laboral**: the Cloudflare record is missing or proxied
differently from `portal`/`auth` (logística, 2026-09-10). Or, only in some browsers, the old
reloj service worker: the module needs `public/sw.js` + `ServiceWorkerCleanup` (test in a
private window).

### D.2 Confirm CI deploys from now on

Push the `DEPLOY.md` update, then `gh run list -R DosxDos/<repo> --limit 3` and
`gh run watch <id> --exit-status`. The run must be green, followed by a 200 again.

### D.3 Register the module in the portal (user, in the UI)

*portal → Módulos → Añadir módulo*: name, description, URL `https://<app>.dospordosgrupoimagen.com`,
icon, roles (comma-separated; tick «Cada persona tiene UNO» for levels), «Todavía no existe»
until it is live. Saving creates the roles in the access service. The user then grants
themselves a role in the users panel.

### D.4 Let the login come back — `dosxdos_auth`

Without this, anyone opening the module directly lands in the **portal** after login and it
looks like "login is broken". Mirror commit `3b49acd`, three files:

- `config/app.config.ts`: `<app>Url: process.env.NEXT_PUBLIC_<APP>_URL ?? "https://<app>.dospordosgrupoimagen.com"`
- `constants/apps.ts`: add `appConfig.<app>Url` to `ALLOWED_RETURN_ORIGINS`
- `tests/return-url.test.ts`: the URL in the mocked config and a row in `NUEVAS`

Then `npx tsc --noEmit` + `npx vitest run`. The auth working tree often has someone else's
uncommitted work: `git add` **only those three files**, `git pull --rebase --autostash`, check
what is coming from origin (`git log HEAD..origin/main`) and whether it has already been deployed
(`gh run list`) before pushing. Push = deploy. Then confirm it is live by finding the domain in
the served JS:

```bash
curl -s https://auth.dospordosgrupoimagen.com/ -o /tmp/a.html; for js in $(grep -oE '/_next/static/chunks/[^"]+\.js' /tmp/a.html | sort -u); do curl -s https://auth.dospordosgrupoimagen.com$js | grep -q "<app>.dospordosgrupoimagen.com" && echo "live in $js"; done
```

For local development, auth's `.env.local` needs `NEXT_PUBLIC_<APP>_URL=http://localhost:<devport>`.
That is the user's file. Tell them; don't edit it.

### D.5 Record it

Tick the `DEPLOY.md` checklist (port, DNS, compose + backup name, vhost + backup name, netsh rule
with the WSL IP, auth allowlist, portal module) and add a Session Log line to `MEMORY.md`.
Update the "Ports seen taken" list in this skill.

---

## Known recurring issues

| Symptom | Cause |
|---|---|
| All apps 502 after a server reboot | WSL IP changed; every `netsh portproxy` rule points at a dead address. Re-read the IP, re-add the rules |
| Domain shows the reloj laboral | Cloudflare record missing or different from the others; or the old reloj service worker in that browser |
| Login lands in the portal, not the module | Domain missing from `ALLOWED_RETURN_ORIGINS` in `dosxdos_auth` |
| Workflow hangs "Waiting for a runner" | Repo is not in an org the self-hosted runner serves |
| Workflow fails at `cd` | Server folder not cloned yet (expected before B.2) or named differently |
| Build fails `spawn git ENOENT` / ssh key errors | Dockerfile missing `apk add git` or the `insteadOf` rewrite |
| Browser gets default/localhost URLs | `NEXT_PUBLIC_*` passed in `environment:` instead of build `args` + Dockerfile `ARG` |
| Port "free" but collides | Audited only the compose file; check `docker ps -a` too |
