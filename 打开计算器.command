#!/bin/sh
# Optional macOS launcher. The HTML file can also be opened directly.
task_dir=$(CDPATH= cd "$(dirname "$0")" && pwd) || exit 1
exec /usr/bin/open "$task_dir/视频码率计算器.html"
