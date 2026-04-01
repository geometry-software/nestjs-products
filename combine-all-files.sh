#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   ./script.sh             -> scan ./src and output ./main.txt
#   ./script.sh path/to/src -> scan given folder and output ./main.txt
#   ./script.sh path/to/src custom-output.txt -> custom output name
#
# Put this script in the root of your Angular project.

SRC_DIR="${1:-src}"
OUTPUT_FILE="${2:-seven-fox-domains.txt}"

if [[ ! -d "$SRC_DIR" ]]; then
  echo "Source directory '$SRC_DIR' does not exist." >&2
  exit 1
fi

# List of file extensions we treat as "text" for Angular projects
TEXT_EXTENSIONS=(
  ts tsx js jsx
  html htm
  css scss sass less
  json md txt
  yml yaml
  env
)

is_text_file() {
  local file="$1"
  local ext="${file##*.}"

  for e in "${TEXT_EXTENSIONS[@]}"; do
    if [[ "$ext" == "$e" ]]; then
      return 0
    fi
  done

  return 1
}

# Truncate/create the output file
: > "$OUTPUT_FILE"

# Find all files under the source directory, excluding main.txt itself
find "$SRC_DIR" -type f ! -name "$(basename "$OUTPUT_FILE")" -print0 |
while IFS= read -r -d '' file; do
  if is_text_file "$file"; then
    cat "$file" >> "$OUTPUT_FILE"
    printf '\n' >> "$OUTPUT_FILE"
  fi
done

echo "Done. All text files from '$SRC_DIR' have been concatenated into '$OUTPUT_FILE'."
