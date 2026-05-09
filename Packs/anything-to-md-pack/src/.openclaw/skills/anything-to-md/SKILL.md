---
name: anything-to-md
description: |
  Universal document to Markdown converter. Convert any file (PDF, Word, Excel, PPT, images, audio, video, YouTube URLs) to clean LLM-ready Markdown.

  Use when:
  - User wants to convert documents to Markdown
  - User needs to process entire directories of files
  - User has YouTube videos or audio files to transcribe
  - User wants to prepare content for LLM processing

  Triggers: "convert to markdown", "anything to md", "document to md", "pdf to md", "batch convert", "youtube transcript"

  PDF Backend Priority:
  1. MinerU (mineru CLI) - High-quality OCR-based extraction with layout detection, table recognition, formula extraction. Best for Chinese/CJK PDFs, scanned documents, and image-heavy presentations.
  2. MarkItDown (Microsoft) - Fast text-based extraction for simple text PDFs.
  3. pypdf - Last resort fallback for basic text extraction.

  Video Intelligent Routing:
  1. PROBE: Detect embedded subtitles, sidecar files, audio tracks, on-screen text (sample frame OCR)
  2. DECIDE: Choose optimal strategy based on content type
  3. EXTRACT: Run appropriate pipelines (subtitle extraction, audio transcription, frame OCR)
  4. FUSE: Merge results with timeline alignment and deduplication
metadata:
  model: sonnet
  allowed-tools:
    - Bash
    - Read
    - Write
    - Glob
    - Task
    - AskUserQuestion
---

# Anything-to-MD Skill

Convert any file to clean, LLM-ready Markdown. Supports 50+ file formats including documents, images (OCR), audio/video, and YouTube URLs.

## Quick Start

```
# Convert single file
anything-to-md file document.pdf -o ./output

# Convert entire directory
anything-to-md dir ./my-docs ./my-mds --report

# Extract YouTube transcript
anything-to-md youtube "https://youtube.com/watch?v=xxx"
```

## Capabilities

### File Types Supported

| Category | Formats |
|----------|---------|
| Documents | PDF, DOCX, XLSX, PPTX, ODT, ODS, ODP |
| Web | HTML, HTM, XHTML |
| eBooks | EPUB, MOBI |
| Data | CSV, TSV, JSON, XML |
| Images | PNG, JPG, GIF, BMP, TIFF, WEBP (with OCR) |
| Audio | MP3, WAV, M4A, FLAC, OGG, AAC |
| Video | MP4, MKV, AVI, MOV, WEBM |
| URLs | YouTube, Wikipedia, RSS feeds |

### Video Intelligent Routing (NEW)

Videos are processed through a smart 4-phase pipeline:

```
PROBE → DECIDE → EXTRACT → FUSE
```

**Phase 1: PROBE** (< 5 seconds)
- ffprobe: Detect embedded subtitle tracks, audio streams
- Sidecar detection: Check for .srt/.vtt files
- Sample frame OCR: Extract 5 frames, run quick OCR to detect on-screen text

**Phase 2: DECIDE** - Choose optimal strategy

| Video Type | Strategy | Description |
|------------|----------|-------------|
| Has embedded subtitles | `embedded_subtitle` | Extract with ffmpeg, parse SRT |
| Has sidecar .srt/.vtt | `sidecar_subtitle` | Parse external subtitle file |
| Audio + on-screen text | `hybrid` | faster-whisper + frame OCR |
| Pure audio (podcast) | `audio_transcribe` | faster-whisper transcription |
| PPT recording / tutorial | `visual_ocr` | Scene detection + keyframe OCR |
| Unknown / mixed | `full_pipeline` | Run all extraction methods |

**Phase 3: EXTRACT**
- **Subtitles**: ffmpeg extraction → SRT parsing
- **Audio**: faster-whisper (4x faster than OpenAI Whisper)
- **Frames**: PySceneDetect for scene changes + perceptual hash deduplication
- **OCR**: RapidOCR (PaddleOCR models + ONNX runtime)

**Phase 4: FUSE**
- Timeline alignment across sources
- Content deduplication (subtitle vs audio vs OCR)
- Priority: subtitle > audio > OCR for overlapping content

**Key Insight**: Don't OCR every frame. Scene detection reduces 1-hour video from ~108,000 frames to 50-200 keyframes.

### MCP Tools Available

1. **convert_file_to_markdown** - Convert a single file
2. **convert_directory_to_markdown** - Batch convert entire directories
3. **convert_youtube_to_markdown** - Extract YouTube transcripts
4. **get_supported_formats** - List all supported formats

## Usage Examples

### Example 1: Convert Single File

```python
# Using MCP tool
result = await convert_file_to_markdown(
    file_path="/path/to/document.pdf",
    output_dir="/path/to/output",
    output_name="document.md"
)
```

### Example 2: Batch Convert Directory

```python
# Using MCP tool
result = await convert_directory_to_markdown(
    source_dir="/path/to/documents",
    target_dir="/path/to/markdown-output",
    preserve_structure=True,
    skip_patterns=["*.tmp", "draft_*"]
)
```

### Example 3: YouTube Transcript

```python
# Using MCP tool
result = await convert_youtube_to_markdown(
    url="https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    output_path="./transcript.md"
)
```

### Example 4: Video with On-Screen Text

```python
# Video intelligent routing is automatic
result = await convert_file_to_markdown(
    file_path="/path/to/tutorial.mp4",
    output_dir="/path/to/output"
)
# Output includes:
# - Audio transcription (if speech detected)
# - On-screen text via OCR (if detected)
# - Extracted keyframes saved to <video>_frames/
```

## Output Format

The converter produces clean, structured Markdown:

```markdown
# Document Title

## Section 1

Content with preserved structure...

### Subsection

- Lists are preserved
- Tables converted to Markdown tables
- Headers maintain hierarchy

| Column A | Column B |
|----------|----------|
| Data     | Data     |
```

### Video Output Format

```markdown
# Video Transcript: tutorial

## Metadata

- **Source**: `tutorial.mp4`
- **Duration**: 00:15:32
- **Strategy**: hybrid
- **Audio transcribed**: true
- **Subtitles extracted**: false
- **Frames analyzed**: 47
- **Frames with text**: 32

## Transcript

### Audio Transcription

- [00:00:01] Welcome to this tutorial on...
- [00:00:15] Let's start by opening the editor...

### On-Screen Text (OCR)

- [00:01:23] npm install anything-to-md
- [00:02:45] const converter = new AnythingToMD()

## Extracted Frames

Frames saved to: `tutorial_frames/`
```

## Configuration

### Environment Variables

- `ANYTHING_TO_MD_ENABLE_PLUGINS=true` - Enable MarkItDown plugins

### Skip Patterns

Default patterns to skip:
- `.git/`, `__pycache__/`, `node_modules/`
- `.venv/`, `venv/`
- `*.pyc`, `*.pyo`
- `.DS_Store`, `Thumbs.db`

Add custom patterns via CLI:
```bash
anything-to-md dir ./src ./output --skip "*.test.*" --skip "temp_*"
```

## Dependencies

### Required
- `markitdown` - Microsoft's document converter
- `pypdf` - PDF fallback

### PDF Enhancement
- `mineru` (CLI) - High-quality OCR for PDFs

### Video Processing
- `ffmpeg` / `ffprobe` - Video analysis and extraction
- `rapidocr-onnxruntime` - OCR engine
- `faster-whisper` - Audio transcription
- `scenedetect` + `opencv-python` - Scene detection
- `imagehash` + `Pillow` - Frame deduplication

## Integration

### With Claude Code

The MCP server can be configured in Claude Code settings:

```json
{
  "mcpServers": {
    "anything-to-md": {
      "command": "uvx",
      "args": ["anything-to-md-mcp"]
    }
  }
}
```

### With AionUI

Add to AionUI MCP configuration:

```yaml
mcp_servers:
  - name: anything-to-md
    command: python -m anything_to_md.mcp_server
    enabled: true
```

## Troubleshooting

### File not converting?

1. Check if format is supported: `anything-to-md formats`
2. Ensure file isn't corrupted
3. Check error message in conversion report

### YouTube extraction failing?

1. Ensure `yt-dlp` is installed: `pip install yt-dlp`
2. Video may not have subtitles/transcript available
3. Check if video is age-restricted

### Video OCR missing text?

1. Ensure `rapidocr-onnxruntime` is installed: `pip install rapidocr-onnxruntime`
2. For hard-coded subtitles, text may be too small
3. Try increasing scene detection sensitivity in code

### Large directory taking too long?

1. Use `--skip` patterns to exclude unnecessary files
2. Consider processing in smaller batches
