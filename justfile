# Personal Agent public website. `just` lists recipes.
set shell := ["bash", "-c"]

default:
    @just --list

setup:
    pnpm install
    command -v prek >/dev/null && prek install && prek install --hook-type commit-msg || echo "prek not installed (uv tool install prek)"

# Live preview at http://127.0.0.1:9000
serve:
    pnpm dev

build:
    pnpm build

typecheck:
    pnpm typecheck

hooks:
    prek run --all-files

# Pre-PR gate
check:
    pnpm check
