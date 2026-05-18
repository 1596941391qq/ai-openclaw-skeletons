---
name: video-editor-full
description: |
  全栈视频后期制作 Skill：Whisper 转录 → auto-editor 去静音 → ffmpeg 精剪（PIP放大镜/章节标题/加速/字幕烧录）→ Remotion 动画片段 → HyperFrames 品牌视频。
  适用场景：教程视频后期、口播去死空气、宣传片生成、多平台导出。
---

# Video Editor Full — 全栈视频后期 Skill

整合 6 大能力的一站式视频后期制作 Skill。从原始录屏到成品发布，全程 AI 驱动。

## 能力矩阵

| 模块 | 工具 | 用途 | 依赖 |
|------|------|------|------|
| 转录 | Whisper (base/small/medium) | 语音→字幕 SRT | Python + openai-whisper |
| 去静音 | auto-editor | 自动 jump cut 死空气 | Python + auto-editor |
| 精剪 | ffmpeg filter_complex | PIP放大镜、章节标题、加速、drawbox高亮 | ffmpeg 7.0+ |
| 字幕 | ffmpeg subtitles filter | 烧录 SRT（支持中文雅黑） | ffmpeg + 字体 |
| 动画 | Remotion | 片头片尾、数据可视化、动态图表 | Node.js 18+ + Remotion |
| 品牌视频 | HyperFrames | HTML/CSS→视频、AI数字人 | Node.js + HeyGen API Key |

## 工作流总览

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│  原始视频    │────▶│  分析 & 转录  │────▶│  内容规划        │
└─────────────┘     └──────────────┘     └─────────────────┘
                                                   │
                    ┌──────────────────────────────┼──────────────────┐
                    ▼                              ▼                  ▼
            ┌──────────────┐            ┌─────────────────┐  ┌──────────────┐
            │ auto-editor  │            │ ffmpeg 精剪      │  │ Remotion     │
            │ 去静音/jump  │            │ PIP+章节+加速    │  │ 片头片尾     │
            └──────┬───────┘            └────────┬────────┘  └──────┬───────┘
                   │                             │                   │
                   └─────────────────────────────┼───────────────────┘
                                                 ▼
                                        ┌─────────────────┐
                                        │  字幕烧录        │
                                        │  + 最终导出      │
                                        └─────────────────┘
```

## 前置条件

```bash
# 必需
pip install openai-whisper auto-editor
# ffmpeg 必须在 PATH 中（推荐 7.0+）
ffmpeg -version

# 可选：Remotion（片头片尾动画）
npx create-video@latest --blank

# 可选：HyperFrames（品牌视频）
# 需要 HeyGen API Key，见 templates/hyperframes-config.example.json
```

## 模块详解

---

### 模块 1：分析 & 转录

#### Step 1: 视频元数据

```bash
ffprobe -v quiet -print_format json -show_format -show_streams input.mp4
```

关注：分辨率、帧率、时长、编码器、比特率。

#### Step 2: 提取关键帧（每 5 秒）

```bash
mkdir -p frames
ffmpeg -i input.mp4 -vf "fps=1/5" -q:v 2 frames/frame_%03d.jpg
```

用视觉分析确定重点 UI 区域、章节边界、放大镜目标。

#### Step 3: Whisper 转录

```python
import whisper
model = whisper.load_model("base")  # 中文用 base 即可，medium 更准但慢
result = model.transcribe("audio.wav", language="zh")
```

输出 SRT 后必须人工校准：
- 专有名词（产品名、技术术语）
- 时间轴对齐（尤其后半段容易漂移）
- 同音字错误

---

### 模块 2：auto-editor 去静音

```bash
# 基础用法：去掉所有静音段
auto-editor input.mp4 --margin 0.2s --output no_silence.mp4

# 保守模式：只去超过 1 秒的静音
auto-editor input.mp4 --min-clip-length 1s --margin 0.3s --output no_silence.mp4

# 导出 timeline（不直接渲染，用于后续 ffmpeg 精剪）
auto-editor input.mp4 --export timeline:api
```

**注意**：auto-editor 去静音后时间轴会变，字幕必须在去静音之后再生成或重新对齐。

推荐顺序：原始视频 → auto-editor → 再转录/对齐字幕 → ffmpeg 精剪

---

### 模块 3：ffmpeg 精剪（核心）

#### 3.1 PIP 放大镜（画中画）

```python
# 关键：crop 区域用 force_original_aspect_ratio 避免拉伸
PIP_W, PIP_H = 300, 188  # 目标 PIP 窗口尺寸

# filter_complex 片段：
# crop → scale（保持比例）→ pad（补黑边）→ drawbox（黄色边框）
f"[pip{i}]crop={cw}:{ch}:{cx}:{cy},"
f"scale={PIP_W}:{PIP_H}:force_original_aspect_ratio=decrease,"
f"pad={PIP_W}:{PIP_H}:(ow-iw)/2:(oh-ih)/2:color=0x1a1a2e,"
f"drawbox=x=0:y=0:w={PIP_W}:h={PIP_H}:color=yellow:t=2"
f"[pip{i}s]"
```

#### 3.2 章节标题（drawtext fade）

```python
# 在章节切换点显示标题，淡入淡出
f"drawtext=text='{title}':"
f"fontfile='C\\:/Windows/Fonts/msyh.ttc':"
f"fontsize=28:fontcolor=white:borderw=3:bordercolor=black@0.7:"
f"x=(w-text_w)/2:y=30:"
f"alpha='if(lt(t,{start}),0,if(lt(t,{start}+0.4),(t-{start})/0.4,"
f"if(lt(t,{end}-0.4),1,if(lt(t,{end}),({end}-t)/0.4,0))))':"
f"enable='between(t,{fade_in},{fade_out})'"
```

#### 3.3 加速

```python
# 视频加速
f"[vout]setpts=PTS/{SPEED}[vfinal]"
# 音频加速（atempo 范围 0.5-2.0，超过需要链式）
f"[0:a]atempo={SPEED}[afinal]"
```

#### 3.4 字幕时间轴同步

加速后字幕时间码必须同步调整：

```python
new_start = original_start / SPEED
new_end = original_end / SPEED
```

#### 3.5 完整构建模板

见 `scripts/build_template.py`

---

### 模块 4：Remotion 动画片段

适用于生成片头、片尾、过渡动画、数据可视化。

```bash
# 初始化 Remotion 项目
npx create-video@latest my-intro --blank

# 在 src/Composition.tsx 中编写动画
# 渲染为 MP4
npx remotion render src/index.ts MyComp out/intro.mp4
```

生成的片段通过 ffmpeg concat 拼接到主视频：

```bash
# concat list
echo "file 'intro.mp4'" > list.txt
echo "file 'main.mp4'" >> list.txt
echo "file 'outro.mp4'" >> list.txt
ffmpeg -f concat -safe 0 -i list.txt -c copy final.mp4
```

**Remotion Agent Skill 安装**：
```bash
# 官方 skill（推荐）
git clone https://github.com/remotion-dev/skills.git ~/.claude/skills/remotion
```

---

### 模块 5：HyperFrames 品牌视频

将 HTML/CSS/JS 渲染为视频帧，适合品牌宣传、网站转视频。

```bash
# 安装
npm install @anthropic-ai/hyperframes

# 基本用法：HTML → MP4
npx hyperframes render --input composition.html --output brand.mp4
```

需要 HeyGen API Key 才能使用 Avatar 数字人功能。
配置模板见 `templates/hyperframes-config.example.json`。

---

### 模块 6：最终导出

#### 字幕烧录（最后一步）

```bash
ffmpeg -y -i video_no_sub.mp4 \
  -vf "subtitles='srt_path':force_style='FontSize=13,FontName=Microsoft YaHei,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,Outline=2,Shadow=1,MarginV=22,Bold=1'" \
  -c:v libx264 -preset slow -crf 17 \
  -c:a copy -pix_fmt yuv420p -movflags +faststart \
  output.mp4
```

#### 多平台导出

| 平台 | 分辨率 | 比例 | 时长限制 |
|------|--------|------|----------|
| YouTube | 1920x1080 | 16:9 | 无 |
| 微信视频号 | 1080x1920 | 9:16 | 60s（推荐） |
| 小红书 | 1080x1350 | 4:5 | 5min |
| Twitter/X | 1280x720 | 16:9 | 2:20 |
| LinkedIn | 1920x1080 | 16:9 | 10min |

```bash
# 竖屏裁剪示例（16:9 → 9:16）
ffmpeg -i input.mp4 -vf "crop=ih*9/16:ih,scale=1080:1920" -crf 18 vertical.mp4
```

---

## 质量准则

1. **CRF 17 + slow preset** — 教程视频标准质量
2. **yuv420p** — 兼容所有播放器
3. **faststart** — 网络播放秒开
4. **lanczos** — 缩放算法首选
5. **不超过 2 次编码** — 避免代际损失
6. **字幕最后烧** — 确保时间轴对齐

## 常见坑

- Windows 路径在 ffmpeg subtitles filter 中需要 `/` 且 `:` 要转义为 `\:`
- Whisper 在 Windows 上必须用 Windows 路径（不能用 `/tmp/`）
- `atempo` 范围 0.5-2.0，超过需要链式：`atempo=2.0,atempo=1.5` = 3x
- PIP crop 区域和目标窗口比例不一致会拉伸，必须用 `force_original_aspect_ratio`
- auto-editor 改变时间轴后，之前的字幕全部失效
- filter_complex 太长不能命令行传，用 `-filter_complex_script` 写文件

## 文件结构

```
video-editor-skill-pack/
├── SKILL.md                          # 本文件
├── scripts/
│   ├── build_template.py             # ffmpeg 精剪构建模板
│   ├── transcribe.py                 # Whisper 转录脚本
│   ├── adjust_srt_speed.py           # SRT 时间轴加速调整
│   └── analyze_frames.py             # 关键帧提取 + 分析
├── templates/
│   ├── hyperframes-config.example.json
│   └── remotion-intro/               # Remotion 片头模板（待填充）
└── examples/
    └── tutorial-video-workflow.md     # 教程视频完整工作流示例
```
