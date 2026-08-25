<p align="center">
  <img src=".github/logo.svg" alt="Personal Agent" width="128" />
</p>

# Personal Agent website

The public [Personal Agent](https://personal-agent.org) website, documentation, and marketplace.
It is a Quasar application built with Vue, TypeScript, and the Quasar CLI for Vite.

## Develop

```bash
pnpm install
pnpm dev               # http://127.0.0.1:9000
pnpm check             # format check, lint, types, production build
```

The existing Markdown documentation lives in `docs/` and is rendered directly by the Quasar
application. Public marketplace data currently enters through `src/services/marketplace.ts`;
that boundary is ready to be backed by the catalog API without coupling it to page components.

Production output is pre-rendered into `dist/ssg/`, including documentation and marketplace
detail routes. A client-only build remains available with `pnpm build:spa`.

## License

[MIT](LICENSE).
