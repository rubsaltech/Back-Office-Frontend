# ---- Build stage: produce the static SPA bundle ----
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# No VITE_API_BASE_URL on purpose: the app calls /api/v1 same-origin, and Caddy
# (below) proxies /api + /uploads to the backend — so there is no CORS to manage.
RUN npm run build

# ---- Serve stage: Caddy serves the SPA + reverse-proxies the API, with auto-HTTPS ----
FROM caddy:2-alpine
COPY --from=build /app/dist /srv
COPY Caddyfile /etc/caddy/Caddyfile
EXPOSE 80 443
