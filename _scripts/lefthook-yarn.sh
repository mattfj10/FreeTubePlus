#!/usr/bin/env bash
# Git hooks (lefthook) often run with a minimal PATH (e.g. NixOS GUI sessions).
# Use yarn from PATH when present; otherwise run via this flake's dev shell.
set -euo pipefail
repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

if command -v yarn >/dev/null 2>&1; then
  exec yarn "$@"
fi

if command -v nix >/dev/null 2>&1 && [[ -f "$repo_root/flake.nix" ]]; then
  exec nix develop "$repo_root" --accept-flake-config -c yarn "$@"
fi

echo "lefthook-yarn: yarn not on PATH; install Yarn or use a dev shell (nix develop)." >&2
exit 127
