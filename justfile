# Personal Agent documentation site (MkDocs Material). `just` lists recipes.
set shell := ["bash", "-c"]

default:
    @just --list

setup:
    uv sync --group docs
    command -v prek >/dev/null && prek install && prek install --hook-type commit-msg || echo "prek not installed (uv tool install prek)"

# Live preview at http://127.0.0.1:8000
serve:
    uv run --group docs mkdocs serve

# Build the static site (strict) -> site/
build:
    uv run --group docs mkdocs build --strict

hooks:
    prek run --all-files

# Pre-PR gate
check: build
