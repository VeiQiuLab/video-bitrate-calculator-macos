# MacBook Air 上怎样选压制工具

核查日期：2026-10-27（北京时间）。以下来自当前官网 / 官方文档，未在用户的 Mac 上实测。芯片型号、内存、macOS 版本未提供，不能给出可信的编码速度或耗电数字。

## 先给选择

**日常先装 HandBrake。卡 180 MB 时，从软件 x265 两遍平均码率开始；上传端要求广泛兼容时用 x264。赶时间再试 H.265 VideoToolbox。** 这是针对“画质 + 体积上限”的工作流建议，不是本次画质跑分结果。

| 方案 | 体积控制方式 | 适合这次需求的地方 | 取舍 |
|---|---|---|---|
| HandBrake | 视频 Average Bitrate；编码器支持时用 Multi-pass | 免费图形界面，直接填计算器的 kbps，适合反复制作上传版 | RF / CQ 适合追求质量，不能预先固定大小；音轨需单独预算 |
| Shutter Encoder | File size 目标大小，或视频码率；支持时选 2-pass | 更适合同时要裁剪、重封装、音轨 / 字幕处理的用户；官网提供 Intel 与 Apple Silicon 版本 | 功能更多；目标大小也是尝试达到，官方明确不保证完全一致 |
| FFmpeg | 明确选择编码器、视频 / 音频码率、流映射、两遍统计 | 需要批量、可重复参数或精确掌握输出流程时使用 | 命令行有学习成本；编译包所含编码器不同，硬件功能还依赖系统 / 芯片 |
| Apple VideoToolbox | 在以上软件中选 H.264 / HEVC 硬件编码和目标平均码率 | 编码速度优先；可先试在 Air 上用硬编生成日常版本 | 它是系统编码框架，不是单独转码软件；同体积画质及码率跟随程度应实测 |

截至核查时，[HandBrake 官网](https://handbrake.fr/downloads.php)列出 **1.11.2**、macOS 10.13+ 的 Universal 安装镜像；[Shutter Encoder 官网](https://www.shutterencoder.com/)列出 **20.4**、macOS 10.14+ 及 Intel / Apple Silicon 分别下载。以官网当前系统要求为准，别从仿冒下载站获取。

HandBrake 文档说明：平均码率面向大小控制，恒定质量则由素材决定最终体积；其平均码率章节建议使用多遍。[官方码率说明](https://handbrake.fr/docs/en/latest/technical/video-cq-vs-abr.html)（页面标注为草稿，界面选项以实际版本为准）。

Shutter 文档列有目标 File size 与 2-pass，并明确文件大小不能精确保证。可以先设 **170 MB** 安全目标，或用本计算器算出的平均视频码率；界面显示若有单位歧义，优先按 kbps 填预算。[官方功能文档](https://www.shutterencoder.com/documentation/)

## MacBook Air 的两条路线

### 愿意等，优先在限定大小内看画质

1. 保留清晰原片，另存上传版本，避免反复有损压缩。
2. HandBrake 选 H.265 (x265 10-bit)；网站 / 播放端不支持则选 H.264 (x264)。AV1 软件编码可做额外对比，但不因“更新”就默认值得在 Air 上长时间等待。
3. 选 Average Bitrate，填计算器的**视频** kbps。音频单独设 AAC，例如一条 128 kbps；两条音轨要计总和。
4. 支持时开启 Multi-pass / 2-Pass；Medium 起步，想进一步比较可试 Slow。用同一动作片段对比，不把慢预设当作必然更好的保证。
5. 输出长度和本次预算一致。分辨率、帧率不超过源片；预算很紧时，先比较 720p 与 1080p 的实际观感。
6. 导出整段后，查看实际字节数和画质，超限时降低安全目标再压。可用“当前视频码率 × 新目标大小 / 当前实际大小 × 0.98”作为第二次尝试的粗略起点，再复算预算并检查成片；它不是精确求解。

### 赶时间，先试硬编

在 HandBrake 选 H.265 (VideoToolbox) 或 H.265 10-bit (VideoToolbox)；更广泛兼容用 H.264 (VideoToolbox)。仍使用平均码率，先留足体积缓冲。多遍选项只按实际软件、系统和编码器提供的能力使用，不把软件 x264 / x265 的设置照搬到硬编。

HandBrake 官方列出 H.264、H.265、H.265 10-bit VideoToolbox 编码器，并说明硬件解码可在 macOS 13+ 中启用。滤镜、音频和封装等仍可能占用 CPU，不能把“开硬编”理解为整条流程都不用 CPU。是否出现编码器以本机界面为准。[VideoToolbox 官方说明](https://handbrake.fr/docs/en/latest/technical/video-videotoolbox.html)

未提供 Air 型号，所以不假设它拥有 AV1 硬件编码，也不把 AV1 硬件解码等同于硬件编码。

## FFmpeg：需要可重复命令时再用

[FFmpeg 官网](https://ffmpeg.org/download.html)核查时列出的源码发布为 **9.0.2**。官网本身提供源码，二进制下载链接来自所列构建方；实际安装包版本与可用编码器需要本机确认。计算器不捆绑、下载或安装 FFmpeg。

先检查本机可用功能：

```sh
ffmpeg -version
ffmpeg -encoders
ffmpeg -h encoder=hevc_videotoolbox
```

下面示例只适用于**已剪辑完成、时长 578 秒的普通 SDR 素材**，预算为 2189 kbps 视频 + 一条 128 kbps AAC。把路径换成真实绝对路径，输出路径须与原片不同。`-n` 在同名文件已存在时停止，不覆盖原片。示例只保留第一条视频和可选的第一条音频，去除字幕、数据流、原有元数据和章节；若需要保留它们，要调整映射并重新预算。不提供 HDR 自动色调映射。

### H.264 软件两遍，体积控制优先

在终端运行同一个块；仅在第一遍成功后开始第二遍。两遍必须使用同一份源片和一致的视频参数。临时统计保留在独立目录，结束后会显示其位置，便于检查后自行清理。

```sh
(
  pass_dir=$(mktemp -d "${TMPDIR:-/tmp}/bitrate-pass.XXXXXX") || exit 1
  printf '两遍统计目录：%s\n' "$pass_dir"
  ffmpeg -n -i "/path/to/input.mp4" \
    -map 0:v:0 -c:v libx264 -preset slow -pix_fmt yuv420p \
    -b:v 2189k -pass 1 -passlogfile "$pass_dir/stats" \
    -an -sn -dn -map_metadata -1 -map_chapters -1 -f null /dev/null &&
  ffmpeg -n -i "/path/to/input.mp4" \
    -map 0:v:0 -map '0:a:0?' -c:v libx264 -preset slow -pix_fmt yuv420p \
    -b:v 2189k -pass 2 -passlogfile "$pass_dir/stats" \
    -c:a aac -b:a 128k -ac 2 -sn -dn -map_metadata -1 -map_chapters -1 \
    -movflags +faststart "/path/to/output-upload.mp4"
)
```

`-pass` 与 `-passlogfile` 的行为见 [FFmpeg 官方说明](https://ffmpeg.org/ffmpeg.html#Video-Options)。本例不能通过仅替换编码器名称改成 x265 两遍；x265 有自己的参数机制。

### HEVC VideoToolbox，速度优先

```sh
ffmpeg -n -i "/path/to/input.mp4" \
  -map 0:v:0 -map '0:a:0?' \
  -c:v hevc_videotoolbox -allow_sw 0 -b:v 2189k -pix_fmt yuv420p -tag:v hvc1 \
  -c:a aac -b:a 128k -ac 2 -sn -dn -map_metadata -1 -map_chapters -1 \
  -movflags +faststart "/path/to/output-upload-hevc.mp4"
```

这里显式选 8-bit SDR；10-bit / HDR 需要另一套正确的像素格式和色彩处理。`-allow_sw 0` 禁止悄悄退回软件编码，硬件不可用时会失败；以本机 `ffmpeg -h encoder=hevc_videotoolbox` 为准。不要把 `-q:v` 或 `-crf` 当作固定体积的参数，也不要把峰值 `-maxrate`、缓冲区或 `-fs` 截断输出当作完整成片大小保证。[FFmpeg 官方 VideoToolbox 实现](https://github.com/FFmpeg/FFmpeg/blob/master/libavcodec/videotoolboxenc.c)

### 完成后查体积与时长

```sh
stat -f '%z bytes' "/path/to/output-upload.mp4"
ffprobe -v error -show_entries format=duration,size,bit_rate \
  -of default=noprint_wrappers=1 "/path/to/output-upload.mp4"
```

若网站按十进制 180 MB 限制，比较的是 **180,000,000 字节**，不要只看圆整后的“180 MB”。实际上传端的判定仍是最终门槛。

本次 Windows 合成素材测试中，FFmpeg 9.0.2 在 `-n` 拒绝覆盖时打印错误、保留文件，但返回码为 0。因此批处理不能仅凭返回码认定转码完成；还应核对日志、输出文件和媒体信息。本次未在 macOS 重现这一返回码行为。

## 关于采集

采集与制作 180 MB 上传版应分开：先得到清晰母版，再另做受大小限制的成片。系统录屏、外接采集卡、采集软件和系统音频权限取决于具体硬件与系统；本次未安装录制软件、访问麦克风 / 屏幕、配置音频驱动或实测采集。需要采集方案时应以 Air 型号、采集来源与帧率另行确定，不将本次压制预算直接作为录制质量设置。
