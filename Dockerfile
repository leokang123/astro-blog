# Base stage for building the static files
FROM node:lts AS base
WORKDIR /app

# Install pnpm version compatible with the checked-in lockfile.
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
ARG PUBLIC_SITE_URL=http://localhost:4321/
ARG PUBLIC_BASE_PATH=
ENV PUBLIC_SITE_URL=$PUBLIC_SITE_URL
ENV PUBLIC_BASE_PATH=$PUBLIC_BASE_PATH
RUN pnpm run build

# Runtime stage for serving the application
FROM nginx:mainline-alpine-slim AS runtime
COPY --from=base /app/dist /usr/share/nginx/html
EXPOSE 80
