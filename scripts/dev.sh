#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

usage() {
  cat <<EOF
Usage: pnpm dev [-- backoffice] [admin] [seller] [landing] [all]

Always starts dev:api. Optionally start frontends:

  pnpm dev
  pnpm dev backoffice
  pnpm dev admin
  pnpm dev seller
  pnpm dev landing
  pnpm dev backoffice admin
  pnpm dev all
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" || "${1:-}" == "help" ]]; then
  usage
  exit 0
fi

PIDS=()
START_BACKOFFICE=false
START_ADMIN=false
START_SELLER=false
START_LANDING=false

for arg in "$@"; do
  case "$arg" in
    backoffice)
      START_BACKOFFICE=true
      ;;
    admin)
      START_ADMIN=true
      ;;
    seller)
      START_SELLER=true
      ;;
    landing)
      START_LANDING=true
      ;;
    all|apps)
      START_BACKOFFICE=true
      START_ADMIN=true
      START_SELLER=true
      START_LANDING=true
      ;;
    *)
      echo "Unknown app: $arg" >&2
      usage >&2
      exit 1
      ;;
  esac
done

cleanup() {
  for pid in "${PIDS[@]}"; do
    kill "$pid" 2>/dev/null || true
  done
}

trap cleanup EXIT INT TERM

start() {
  local name=$1
  shift

  "$@" &
  PIDS+=("$!")
  echo "→ $name (pid $!)"
}

start "api" pnpm run dev:api

if [[ "$START_BACKOFFICE" == true ]]; then
  start "backoffice" pnpm run dev:backoffice
fi

if [[ "$START_ADMIN" == true ]]; then
  start "admin" pnpm run dev:admin
fi

if [[ "$START_SELLER" == true ]]; then
  start "seller" pnpm run dev:seller
fi

if [[ "$START_LANDING" == true ]]; then
  start "landing" pnpm run dev:landing
fi

wait
