#!/usr/bin/env sh
# Advisory pre-commit reminder: if the root package.json `version` is bumped, CHANGELOG.md
# should change in the same commit. Confirmable (not a hard gate) and root-only by design —
# the 12 internal packages stay pinned, so their versions are ignored.

staged=$(git diff --cached --name-only)

# grep -x: whole-line match, so nested apps/compio/package.json etc. never trigger this.
echo "$staged" | grep -qx "package.json" || exit 0

read_version() {
  node -pe "JSON.parse(require('fs').readFileSync(0, 'utf8')).version" 2>/dev/null
}

old=$(git show HEAD:package.json 2>/dev/null | read_version)
new=$(git show :package.json | read_version)

[ "$old" = "$new" ] && exit 0

echo "$staged" | grep -qx "CHANGELOG.md" && exit 0

# No usable TTY (GUI client / CI): can't prompt, so warn and allow rather than silently
# blocking. Probe by actually opening /dev/tty — the node can exist yet be unopenable when
# there is no controlling terminal, so `[ -e /dev/tty ]` is not enough.
if ! { : < /dev/tty; } 2>/dev/null; then
  echo "Warning: root version changed $old -> $new without a CHANGELOG.md update (no TTY to confirm)."
  exit 0
fi

printf "Root version changed %s -> %s but CHANGELOG.md is not staged. Commit anyway? [y/N] " "$old" "$new" > /dev/tty
read answer < /dev/tty
case "$answer" in
  [Yy]*) exit 0 ;;
  *) echo "Commit aborted: update CHANGELOG.md or re-run and confirm." ; exit 1 ;;
esac
