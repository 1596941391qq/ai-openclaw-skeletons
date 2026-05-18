# 教程视频完整工作流示例

以 OpenClaw EP01 教程视频为例，展示从原始录屏到成品的完整流程。

## 源素材

- 格式：MP4, 960x544, 25fps, H.264
- 时长：3:14（194秒）
- 内容：屏幕录制 + 口播讲解

## Step 1: 分析

```bash
python scripts/analyze_frames.py input.mp4 --interval 5
```

输出 38 张关键帧，人工/AI 视觉分析确定：
- 5 个章节边界
- 6 个 PIP 放大镜目标区域

## Step 2: 转录

```bash
python scripts/transcribe.py input.mp4 --model base --language zh
```

输出粗稿 SRT → 人工校准：
- 修正 "Claude Code" → "Codex"（segment 20）
- 修正 "代码" → "待办"（segment 48-49）
- 对齐后半段时间轴漂移

## Step 3: 去静音（可选）

```bash
auto-editor input.mp4 --margin 0.2s --output no_silence.mp4
```

本例未使用（教程视频停顿较少）。

## Step 4: 配置构建参数

编辑 `build_template.py` 的 CONFIG 区域：

```python
chapters = [
    (14.0, "添加 AI 助手"),
    (55.0, "定时任务配置"),
    (95.0, "部门与协作"),
    (140.0, "日常使用与路线图"),
]

highlights = [
    (19, 3.0, 560, 50, 320, 200),    # 添加下拉菜单
    (34, 3.5, 230, 90, 400, 250),    # 助手类型选择
    (69, 3.0, 180, 270, 480, 300),   # 定时任务配置
    (119, 3.0, 160, 70, 480, 300),   # 创建群聊
    (164, 3.5, 100, 60, 560, 350),   # Prompt 设置
    (171, 3.0, 140, 120, 480, 300),  # 项目路线图
]
```

## Step 5: 构建

```bash
export VIDEO_INPUT="input.mp4"
export VIDEO_SRT="subtitles_corrected.srt"
export VIDEO_OUTPUT="final.mp4"
python scripts/build_template.py
```

## 产出

- `final.mp4`: 6.5MB, 2:39, CRF 17
- 包含：PIP 放大镜（无拉伸）+ 4 个章节标题 + 1.2x 加速 + 中文字幕

## 质量对比

| 版本 | 大小 | 特性 | 问题 |
|------|------|------|------|
| V1 | 5.8MB | 仅字幕+加速 | 字幕不同步 |
| V2 | 7.2MB | zoom+章节卡+字幕 | 多次编码质量损失 |
| V3 | 6.8MB | 分段zoom+concat | 接缝处有跳帧 |
| V4 | 6.4MB | PIP+drawbox | PIP拉伸、字幕错误 |
| V5 | 6.5MB | PIP(保比例)+章节标题+字幕修正 | 最终版 |
