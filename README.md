# 视频码率计算器 · macOS 离线 HTML 版

按最终时长和目标体积计算平均视频码率。现存产品形态是单文件离线 HTML，可选 `.command` 启动脚本；不是原生 `.app` 或 `.dmg`，没有签名或公证。它不转码视频、不上传视频，也不计算两个已有文件的实际压缩率。

## 安装与使用

从本仓库 [Releases](../../releases) 下载 ZIP，完整解压，在 Mac 上用 Safari 或 Chrome 打开 `视频码率计算器.html`。无需安装 Python、Node、FFmpeg 或运行服务器。Intel 与 Apple Silicon 使用同一 HTML。启动脚本只是可选便利入口；系统若阻止脚本，直接打开 HTML，不需要关闭系统保护。

默认 `9:38`、180/170 MB、128 kbps、1.5% 预留，结果 2189 kbps。支持 MB/MiB、音轨总预算、附件预留、单片段裁剪变速换算；复制或导出设置后，在自己的转码软件中使用。选择视频只尝试通过浏览器在本机读取时长。完整步骤见 [先读我.txt](先读我.txt)。

## 开发、测试与打包

应用本身无需构建。修改 HTML 后可直接打开。开发测试需要 Node.js 和 Python 3.10+，不需要安装 npm/pip 依赖：

```sh
python3 -B -m unittest discover -s 开发与验证/original -p 'test_bitrate_core.py' -v
python3 -B 开发与验证/generate_reference.py
node 开发与验证/test_calculator.mjs
python3 tools/package_release.py
```

Windows 将 `python3` 换为可用的 Python 命令。参考数据生成器会更新副本中的 `reference_vectors.json`，应复查是否仍与提交一致。打包器生成 `release/` ZIP、逐文件校验清单并保存启动脚本 Unix 可执行权限。CI 在 Windows 跑公式对照与结构/控制器测试，并生成 ZIP 附件。

## 验证边界

测试读取 HTML 中实际计算代码；DOM/剪贴板桩检查只覆盖控制器接线，不等于浏览器渲染、Safari、复制权限、视频读取或下载实测。本次环境为 Windows，无 macOS 真机；Mac/Safari、启动脚本、Apple 硬件编码和实际完整视频体积/画质待验收。见 [VALIDATION.md](VALIDATION.md)。[Mac压制软件选择.md](Mac压制软件选择.md) 是 2026-10-27 原交付资料，软件版本与推荐需按官网复核。

## 协议

自有代码与文档采用 [MIT](LICENSE)。页面无外部运行库，第三方独立软件说明见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。[归档说明](docs/ARCHIVE.md) 说明本地来源与数据排除。
