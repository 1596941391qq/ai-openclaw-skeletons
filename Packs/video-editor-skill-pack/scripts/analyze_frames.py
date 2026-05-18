"""
Frame Analysis Script
提取关键帧并输出分析报告，用于确定 PIP 放大镜目标和章节边界

Usage:
    python analyze_frames.py <video_path> [--interval 5] [--output-dir frames/]
"""
import argparse, os, subprocess, sys, json

def extract_frames(video_path, output_dir, interval=5):
    """Extract keyframes at fixed intervals."""
    os.makedirs(output_dir, exist_ok=True)
    cmd = [
        'ffmpeg', '-y', '-i', video_path,
        '-vf', f'fps=1/{interval}',
        '-q:v', '2',
        os.path.join(output_dir, 'frame_%03d.jpg')
    ]
    r = subprocess.run(cmd, capture_output=True)
    if r.returncode != 0:
        print(f"Error: {r.stderr.decode('utf-8', errors='replace')[-300:]}")
        sys.exit(1)

def get_video_info(video_path):
    """Get video metadata."""
    cmd = [
        'ffprobe', '-v', 'quiet', '-print_format', 'json',
        '-show_format', '-show_streams', video_path
    ]
    r = subprocess.run(cmd, capture_output=True)
    return json.loads(r.stdout)

def main():
    parser = argparse.ArgumentParser(description='Extract and analyze video keyframes')
    parser.add_argument('video', help='Input video path')
    parser.add_argument('--interval', type=int, default=5, help='Seconds between frames (default: 5)')
    parser.add_argument('--output-dir', default=None, help='Output directory for frames')
    args = parser.parse_args()

    work_dir = os.path.dirname(os.path.abspath(args.video))
    output_dir = args.output_dir or os.path.join(work_dir, 'frames')

    # Get video info
    info = get_video_info(args.video)
    duration = float(info['format']['duration'])
    for stream in info['streams']:
        if stream['codec_type'] == 'video':
            width = stream['width']
            height = stream['height']
            fps = eval(stream['r_frame_rate'])
            break

    print(f"Video: {width}x{height} @ {fps:.1f}fps, {duration:.1f}s")
    print(f"Extracting frames every {args.interval}s...")

    extract_frames(args.video, output_dir, args.interval)

    frame_count = len([f for f in os.listdir(output_dir) if f.startswith('frame_')])
    print(f"\nExtracted {frame_count} frames to {output_dir}/")
    print(f"\nFrame timeline:")
    for i in range(1, frame_count + 1):
        t = (i - 1) * args.interval
        print(f"  frame_{i:03d}.jpg = {t}s ({int(t//60)}:{int(t%60):02d})")

    print(f"\n下一步：用视觉分析这些帧，确定：")
    print(f"  1. 章节边界（画面内容明显切换的时间点）")
    print(f"  2. PIP 放大镜目标（重要 UI 元素的坐标区域）")
    print(f"  3. 高光时刻（需要强调的操作步骤）")

if __name__ == '__main__':
    main()
