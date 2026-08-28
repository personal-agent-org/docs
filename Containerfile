FROM docker.io/library/node:22-alpine AS build

WORKDIR /app
ENV CI=true
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm fetch

COPY . .
RUN pnpm install --offline --frozen-lockfile && pnpm build


FROM docker.io/library/nginx:1.31-alpine AS runtime

LABEL org.opencontainers.image.source="https://github.com/personal-agent-org/docs" \
      org.opencontainers.image.description="Personal Agent website and documentation" \
      org.opencontainers.image.licenses="MIT"

COPY deploy/nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/dist/ssg /usr/share/nginx/html

USER nginx
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --spider http://127.0.0.1:8080/ || exit 1

ENTRYPOINT []
CMD ["nginx", "-g", "daemon off;"]
