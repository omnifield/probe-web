#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG="$SCRIPT_DIR/../sync-targets.yaml"

field() {
  awk -v target="$1" -v field="$2" '
    /^[A-Za-z0-9_-]+:[[:space:]]*$/ {
      key=$0; sub(/:.*/,"",key); in_target=(key==target); next
    }
    in_target && $0 ~ "^[[:space:]]+"field":" {
      val=$0
      sub("^[[:space:]]+"field":[[:space:]]*","",val)
      print val
      exit
    }
  ' "$CONFIG"
}

list_targets() {
  awk '/^[A-Za-z0-9_-]+:[[:space:]]*$/ { sub(/:.*/,""); print }' "$CONFIG"
}

usage() {
  echo "Usage: $(basename "$0") <target> [--message \"text\"]"
  echo "       $(basename "$0") --list"
  echo
  if [ -f "$CONFIG" ]; then
    echo "Configured targets:"
    for t in $(list_targets); do
      echo "  - $t: $(field "$t" url) [$(field "$t" branch)] <- $(field "$t" source)"
    done
  fi
  exit 1
}

[ -f "$CONFIG" ] || { echo "Config not found: $CONFIG" >&2; exit 1; }

[ $# -ge 1 ] || usage
if [ "$1" = "--list" ]; then
  usage
fi

TARGET="$1"; shift
MESSAGE=""
while [ $# -gt 0 ]; do
  case "$1" in
    --message) MESSAGE="$2"; shift 2 ;;
    *) echo "Unknown arg: $1" >&2; usage ;;
  esac
done

list_targets | grep -qx "$TARGET" || { echo "Unknown target '$TARGET'." >&2; usage; }

URL=$(field "$TARGET" url)
BRANCH=$(field "$TARGET" branch)
SOURCE=$(field "$TARGET" source)
[ -n "$SOURCE" ] || SOURCE=$(git rev-parse --abbrev-ref HEAD)

if [[ "$URL" == *REPLACE_ME* ]]; then
  echo "Target '$TARGET' still has a placeholder URL — edit sync-targets.yaml first." >&2
  exit 1
fi

if [ -n "$(git status --porcelain)" ]; then
  echo "Working tree is not clean — commit or stash before syncing." >&2
  exit 1
fi

if ! git ls-remote --exit-code "$URL" >/dev/null 2>&1; then
  echo "Cannot reach $URL — check the URL and your credentials." >&2
  exit 1
fi

REMOTE_NAME="sync-$TARGET"
SYNC_BRANCH="sync/$TARGET"
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

cleanup() {
  git checkout "$CURRENT_BRANCH" >/dev/null 2>&1 || true
  git branch -D "$SYNC_BRANCH" >/dev/null 2>&1 || true
}
trap cleanup EXIT

if git remote get-url "$REMOTE_NAME" >/dev/null 2>&1; then
  git remote set-url "$REMOTE_NAME" "$URL"
else
  git remote add "$REMOTE_NAME" "$URL"
fi

SRC_SHA=$(git rev-parse --short "$SOURCE")
COMMIT_MSG="${MESSAGE:-sync: $SOURCE@$SRC_SHA ($(date +%Y-%m-%d))}"

if git ls-remote --exit-code --heads "$URL" "$BRANCH" | grep -q .; then
  echo "Fetching $REMOTE_NAME/$BRANCH..."
  git fetch "$REMOTE_NAME" "$BRANCH"
  git checkout -B "$SYNC_BRANCH" "$REMOTE_NAME/$BRANCH"
  if ! git merge --squash "$SOURCE"; then
    echo "Merge conflicts — resolve manually in $SYNC_BRANCH, then:" >&2
    echo "  git commit -m \"$COMMIT_MSG\" && git push $REMOTE_NAME $SYNC_BRANCH:$BRANCH" >&2
    trap - EXIT
    exit 1
  fi
  if git diff --cached --quiet; then
    echo "Nothing to sync — $TARGET/$BRANCH is already up to date."
    exit 0
  fi
else
  echo "Branch '$BRANCH' doesn't exist on $TARGET yet — creating it from $SOURCE."
  git checkout --orphan "$SYNC_BRANCH" "$SOURCE"
fi

git commit -m "$COMMIT_MSG"
echo "Pushing to $TARGET/$BRANCH..."
git push "$REMOTE_NAME" "$SYNC_BRANCH:$BRANCH"
echo "Done: $TARGET synced."
