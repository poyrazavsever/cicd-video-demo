#!/usr/bin/env bash
set -euo pipefail

release_id="${1:?Release ID gerekli}"
[[ "$release_id" =~ ^[a-f0-9]{40}-[0-9]+-[0-9]+$ ]] || exit 1
base=/var/www/cicd-demo
release_dir="$base/releases/$release_id"
archive="$base/uploads/$release_id.tar.gz"
previous="$(readlink -f "$base/current")"

mkdir "$release_dir"
tar -xzf "$archive" -C "$release_dir" --no-same-owner
test -s "$release_dir/index.html"
test -d "$release_dir/assets"
printf '%s\n' "$release_id" > "$release_dir/version.txt"
chmod -R u=rwX,go=rX "$release_dir"

ln -s "$release_dir" "$base/current-next"
mv -Tf "$base/current-next" "$base/current"

if [[ "$(curl --fail --silent --show-error --max-time 10 http://127.0.0.1/version.txt)" != "$release_id" ]]; then
  ln -s "$previous" "$base/current-rollback"
  mv -Tf "$base/current-rollback" "$base/current"
  echo 'Yayın kontrolü başarısız: önceki sürüme dönüldü.' >&2
  exit 1
fi

rm -- "$archive"
echo "Yayın başarılı: $release_id"
