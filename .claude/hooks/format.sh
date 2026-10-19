#!/usr/bin/env bash
# PostToolUse(Write|Edit): formatiert die geänderte Datei mit Biome, wenn es für
# ihren Ort eine biome.json gibt (nächste oberhalb der Datei, bis zum Repo-Root).
# Ohne passende Konfiguration passiert nichts. Schlägt nie fehl.
f=$(jq -r '.tool_input.file_path // .tool_response.filePath // empty')
root="${CLAUDE_PROJECT_DIR:-$(pwd)}"
case "$f" in
"$root"/*) ;;
*) exit 0 ;;
esac
case "$f" in
*.ts | *.tsx | *.js | *.mjs | *.jsx | *.json | *.css | *.astro) ;;
*) exit 0 ;;
esac
case "$f" in
*/node_modules/* | */dist/* | "$root"/backend/* | "$root"/docs/*) exit 0 ;;
esac

dir=$(dirname "$f")
cfg_dir=""
while [ "${#dir}" -ge "${#root}" ]; do
	if [ -f "$dir/biome.json" ] || [ -f "$dir/biome.jsonc" ]; then
		cfg_dir="$dir"
		break
	fi
	dir=$(dirname "$dir")
done
[ -n "$cfg_dir" ] || exit 0

# Biome-Binary: zuerst beim Config-Ort, dann Root
bin=""
for cand in "$cfg_dir/node_modules/.bin/biome" "$root/node_modules/.bin/biome"; do
	[ -x "$cand" ] && bin="$cand" && break
done
[ -n "$bin" ] || exit 0

(cd "$cfg_dir" && "$bin" check --write --no-errors-on-unmatched "$f" >/dev/null 2>&1)
exit 0
