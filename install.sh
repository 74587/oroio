#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: install.sh [options]

选项:
  --prefix <dir>    指定安装目录（默认: $HOME/.local/bin）
  --reinstall       覆盖已安装的 dk（显式声明重装，默认也会覆盖同名文件）
  -h, --help        显示本帮助

示例:
  ./install.sh
  ./install.sh --prefix /usr/local/bin
  curl -fsSL https://raw.githubusercontent.com/notdp/oroio/main/install.sh | bash
USAGE
}

die() {
  printf 'install.sh: %s\n' "$*" >&2
  exit 1
}

path_has() {
  case ":$PATH:" in
  *":$1:"*) return 0 ;;
  *) return 1 ;;
  esac
}

DK_TMPDIR=""
DK_SRC=""

make_tmpdir() {
  if [ -z "$DK_TMPDIR" ]; then
    DK_TMPDIR=$(mktemp -d)
    trap 'rm -rf "$DK_TMPDIR"' EXIT
  fi
}

fetch_component() {
  local name="$1" url="$2" out_var="$3"

  command -v curl >/dev/null 2>&1 || die "需要 curl 以下载 $name"
  make_tmpdir
  local dest="$DK_TMPDIR/$name"
  printf '正在从 %s 下载 %s...\n' "$url" "$name"
  curl -fsSL "$url" -o "$dest" || die "下载 $name 失败（检查网络或仓库分支是否存在）"
  chmod +x "$dest"
  printf -v "$out_var" '%s' "$dest"
}

locate_sources() {
  fetch_component "dk" "https://raw.githubusercontent.com/notdp/oroio/main/bin/dk" DK_SRC
}

main() {
  local prefix="${DK_PREFIX:-$HOME/.local/bin}"
  local reinstall=0

  while [ $# -gt 0 ]; do
    case "$1" in
    --prefix)
      shift || die "--prefix 需要路径"
      prefix="$1"
      ;;
    --reinstall)
      reinstall=1
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

  locate_sources

  install -d "$prefix"

  install -m 0755 "$DK_SRC" "$prefix/dk"

  printf '\n安装完成:\n'
  printf '  - 已将 dk 安装到 %s/dk\n' "$prefix"
  if ! path_has "$prefix"; then
    printf '  - 注意: %s 不在 PATH，请手动加入后再使用。\n' "$prefix"
  else
    printf '  - PATH 已包含 %s，可直接运行 dk。\n' "$prefix"
  fi
  printf '  - 数据目录为 %s（首次运行时自动创建）。\n' "$HOME/.oroio"

  if [ "$reinstall" -eq 1 ]; then
    printf '  - 已覆盖旧版本 (--reinstall)。\n'
  fi
}

main "$@"
