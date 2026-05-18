"""
Video Editor Build Template
ffmpeg filter_complex 精剪构建模板：PIP放大镜 + 章节标题 + 加速

Usage:
    修改 CONFIG 区域的参数，然后运行：
    python build_template.py
"""
import subprocess, os, json, sys

# ============ CONFIG ============
WORK = os.environ.get('VIDEO_WORK_DIR', os.path.join(os.path.expanduser('~'), 'video-edit'))
INPUT = os.environ.get('VIDEO_INPUT', '')
SRT = os.environ.get('VIDEO_SRT', '')
OUTPUT = os.environ.get('VIDEO_OUTPUT', os.path.join(WORK, 'final_output.mp4'))

W, H = 960, 544          # 源视频分辨率
SPEED = 1.2              # 加速倍率
PIP_W, PIP_H = 300, 188  # PIP 窗口尺寸（1.6:1）
PIP_X, PIP_Y = -20, 20   # PIP 位置（负数=从右边算）
PIP_PAD_COLOR = '0x1a1a2e'
CRF = 17
PRESET = 'slow'

# 章节定义：(原始时间点, 标题)
chapters = [
    # (14.0, "第一章标题"),
    # (55.0, "第二章标题"),
]

# PIP 高光区域：(开始秒, 持续秒, crop_x, crop_y, crop_w, crop_h)
highlights = [
    # (19, 3.0, 560, 50, 320, 200),
]
# ============ END CONFIG ============


def parse_time(t):
    h, m, rest = t.split(':')
    s, ms = rest.split(',')
    return int(h)*3600 + int(m)*60 + int(s) + int(ms)/1000

def fmt_time(sec):
    h = int(sec // 3600)
    m = int((sec % 3600) // 60)
    s = sec % 60
    ms = int((s - int(s)) * 1000)
    return f"{h:02d}:{m:02d}:{int(s):02d},{ms:03d}"

def adjust_srt_speed(srt_in, srt_out, speed):
    """Adjust SRT timecodes for speed change."""
    with open(srt_in, 'r', encoding='utf-8') as f:
        content = f.read()
    blocks = content.strip().split('\n\n')
    adjusted = []
    for block in blocks:
        lines = block.strip().split('\n')
        if len(lines) >= 3:
            idx = lines[0]
            times = lines[1]
            text = '\n'.join(lines[2:])
            start_s, end_s = times.split(' --> ')
            new_start = parse_time(start_s) / speed
            new_end = parse_time(end_s) / speed
            adjusted.append(f"{idx}\n{fmt_time(new_start)} --> {fmt_time(new_end)}\n{text}")
    with open(srt_out, 'w', encoding='utf-8') as f:
        f.write('\n\n'.join(adjusted) + '\n')
    return len(adjusted)

def build_filter_complex(highlights, chapters, w, h, speed, pip_w, pip_h, pip_x, pip_y, pad_color):
    """Generate ffmpeg filter_complex string."""
    if pip_x < 0:
        pip_x = w + pip_x - pip_w

    n = len(highlights)
    fc_lines = []

    if n > 0:
        split_out = ''.join(f'[pip{i}]' for i in range(n))
        fc_lines.append(f"[0:v]split={n+1}[main]{split_out}")

        for i, (start, dur, cx, cy, cw, ch) in enumerate(highlights):
            fc_lines.append(
                f"[pip{i}]crop={cw}:{ch}:{cx}:{cy},"
                f"scale={pip_w}:{pip_h}:force_original_aspect_ratio=decrease,"
                f"pad={pip_w}:{pip_h}:(ow-iw)/2:(oh-ih)/2:color={pad_color},"
                f"drawbox=x=0:y=0:w={pip_w}:h={pip_h}:color=yellow:t=2"
                f"[pip{i}s]"
            )

        # Drawboxes on main
        filters_on_main = []
        for start, dur, cx, cy, cw, ch in highlights:
            end = start + dur
            filters_on_main.append(
                f"drawbox=x={cx}:y={cy}:w={cw}:h={ch}:color=yellow@0.6:t=2:"
                f"enable='between(t,{start},{end})'"
            )
    else:
        fc_lines.append(f"[0:v]null[main]")
        filters_on_main = []

    # Chapter titles
    for ch_time, ch_title in chapters:
        fade_out = ch_time + 1.8
        filters_on_main.append(
            f"drawtext=text='{ch_title}':"
            f"fontfile='C\\:/Windows/Fonts/msyh.ttc':"
            f"fontsize=28:fontcolor=white:borderw=3:bordercolor=black@0.7:"
            f"x=(w-text_w)/2:y=30:"
            f"alpha='if(lt(t,{ch_time}),0,if(lt(t,{ch_time}+0.4),(t-{ch_time})/0.4,"
            f"if(lt(t,{fade_out}-0.4),1,if(lt(t,{fade_out}),({fade_out}-t)/0.4,0))))':"
            f"enable='between(t,{ch_time-0.3},{fade_out})'"
        )

    if filters_on_main:
        fc_lines.append(f"[main]{','.join(filters_on_main)}[maindb]")
    else:
        fc_lines.append(f"[main]null[maindb]")

    # Overlay PIPs
    if n > 0:
        prev = "maindb"
        for i, (start, dur, cx, cy, cw, ch) in enumerate(highlights):
            end = start + dur
            out = f"ov{i}" if i < n-1 else "vout"
            fc_lines.append(
                f"[{prev}][pip{i}s]overlay=x={pip_x}:y={pip_y}:"
                f"enable='between(t,{start},{end})'[{out}]"
            )
            prev = out
    else:
        fc_lines.append(f"[maindb]null[vout]")

    # Speed
    fc_lines.append(f"[vout]setpts=PTS/{speed}[vfinal]")
    fc_lines.append(f"[0:a]atempo={speed}[afinal]")

    return ';\n'.join(fc_lines)


def run_ffmpeg(cmd, label=""):
    r = subprocess.run(cmd, capture_output=True)
    if r.returncode != 0:
        err = r.stderr.decode('utf-8', errors='replace')
        print(f"  FAIL [{label}]: {err[-1500:]}")
        raise SystemExit(1)


def main():
    if not INPUT:
        print("ERROR: Set VIDEO_INPUT environment variable or edit CONFIG section")
        sys.exit(1)

    os.makedirs(WORK, exist_ok=True)

    # Step 1: Adjust SRT speed
    srt_speed = None
    if SRT and os.path.exists(SRT):
        srt_speed = os.path.join(WORK, 'subtitles_speed_adjusted.srt')
        count = adjust_srt_speed(SRT, srt_speed, SPEED)
        print(f"SRT adjusted: {count} segments at {SPEED}x")

    # Step 2: Build filter_complex
    fc = build_filter_complex(
        highlights, chapters, W, H, SPEED,
        PIP_W, PIP_H, PIP_X, PIP_Y, PIP_PAD_COLOR
    )
    fc_file = os.path.join(WORK, 'filter_complex.txt')
    with open(fc_file, 'w', encoding='utf-8') as f:
        f.write(fc)
    print(f"Filter complex written ({len(highlights)} PIPs, {len(chapters)} chapters)")

    # Step 3: Pass 1 - main encode
    intermediate = os.path.join(WORK, 'intermediate_nosub.mp4')
    cmd = [
        'ffmpeg', '-y', '-i', INPUT,
        '-filter_complex_script', fc_file,
        '-map', '[vfinal]', '-map', '[afinal]',
        '-c:v', 'libx264', '-preset', PRESET, '-crf', str(CRF),
        '-c:a', 'aac', '-b:a', '128k',
        '-pix_fmt', 'yuv420p',
        intermediate
    ]
    print("Pass 1: Encoding with effects...")
    run_ffmpeg(cmd, "pass1")
    print("  Done.")

    # Step 4: Pass 2 - burn subtitles (if SRT provided)
    if srt_speed:
        srt_path = srt_speed.replace('\\', '/').replace(':', '\\:')
        sub_vf = (
            f"subtitles='{srt_path}':"
            f"force_style='FontSize=13,FontName=Microsoft YaHei,"
            f"PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,"
            f"Outline=2,Shadow=1,MarginV=22,Bold=1'"
        )
        cmd = [
            'ffmpeg', '-y', '-i', intermediate,
            '-vf', sub_vf,
            '-c:v', 'libx264', '-preset', PRESET, '-crf', str(CRF),
            '-c:a', 'copy', '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
            OUTPUT
        ]
        print("Pass 2: Burning subtitles...")
        run_ffmpeg(cmd, "pass2")
        os.remove(intermediate)
    else:
        os.rename(intermediate, OUTPUT)

    # Report
    size = os.path.getsize(OUTPUT) / 1024 / 1024
    probe = subprocess.run(
        ['ffprobe', '-v', 'quiet', '-print_format', 'json', '-show_format', OUTPUT],
        capture_output=True
    )
    info = json.loads(probe.stdout)
    dur = float(info['format']['duration'])
    print(f"\n=== DONE ===")
    print(f"Output: {OUTPUT}")
    print(f"Size: {size:.1f} MB | Duration: {dur:.1f}s ({int(dur//60)}:{int(dur%60):02d})")


if __name__ == '__main__':
    main()
