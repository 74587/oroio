#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: uninstall.sh [options]

选项:
  --prefix <dir>    需要移除的安装目录（默认: $HOME/.local/bin）
  -h, --help        显示本帮助

示例:
  ./uninstall.sh
  ./uninstall.sh --prefix /usr/local/bin
  curl -fsSL https://raw.githubusercontent.com/notdp/oroio/main/uninstall.sh | bash
USAGE
}

die() {
  printf 'uninstall.sh: %s\n' "$*" >&2
  exit 1
}

main() {
  local prefix="${DK_PREFIX:-$HOME/.local/bin}"
  local -a summary=()

  while [ $# -gt 0 ]; do
    case "$1" in
    --prefix)
      shift || die "--prefix 需要路径"
      prefix="$1"
      ;;
    -h | --help)
      usage
      exit 0
      ;;
    --)
      shift
      break
      ;;
    -*)
      die "未知参数: $1"
      ;;
    *)
      break
      ;;
    esac
    shift || true
  done

  local dk_path="$prefix/dk"
  if [ -e "$dk_path" ]; then
    rm -f "$dk_path"
    summary+=("已移除 $dk_path")
  else
    summary+=("未在 $prefix 找到 dk (跳过)")
  fi


  printf '\n卸载结果:\n'
  local i
  for i in "${!summary[@]}"; do
    printf '  %d. %s\n' "$((i + 1))" "${summary[$i]}"
  done
}

main "$@"
