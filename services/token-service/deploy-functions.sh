#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FUNCTIONS_DIR="${SCRIPT_DIR}/functions"

pushd "${FUNCTIONS_DIR}" >/dev/null
firebase deploy --only functions
popd >/dev/null
