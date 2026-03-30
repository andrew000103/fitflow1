#!/bin/zsh

set -euo pipefail

PROJECT_ROOT="${0:A:h:h}"
SHELL_RC="${HOME}/.zshrc"
MARKER_START="# >>> fit pdca >>>"
MARKER_END="# <<< fit pdca <<<"

BLOCK=$(cat <<EOF
${MARKER_START}
export PATH="${PROJECT_ROOT}/bin:\$PATH"
alias pdca="${PROJECT_ROOT}/bin/pdca"
${MARKER_END}
EOF
)

if [[ -f "${SHELL_RC}" ]] && grep -q "${MARKER_START}" "${SHELL_RC}"; then
  echo "pdca shell block already exists in ${SHELL_RC}"
  exit 0
fi

touch "${SHELL_RC}"
printf "\n%s\n" "${BLOCK}" >> "${SHELL_RC}"

echo "Installed pdca shell setup into ${SHELL_RC}"
echo "Run: source ${SHELL_RC}"
