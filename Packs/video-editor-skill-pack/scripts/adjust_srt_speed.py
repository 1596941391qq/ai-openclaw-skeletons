"""
SRT Speed Adjustment Script
调整字幕时间轴以匹配视频加速

Usage:
    python adjust_srt_speed.py input.srt output.srt --speed 1.2
"""
import argparse, sys

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

def main():
    parser = argparse.ArgumentParser(description='Adjust SRT timecodes for speed change')
    parser.add_argument('input', help='Input SRT file')
    parser.add_argument('output', help='Output SRT file')
    parser.add_argument('--speed', type=float, default=1.2, help='Speed factor (default: 1.2)')
    args = parser.parse_args()

    with open(args.input, 'r', encoding='utf-8') as f:
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
            new_start = parse_time(start_s) / args.speed
            new_end = parse_time(end_s) / args.speed
            adjusted.append(f"{idx}\n{fmt_time(new_start)} --> {fmt_time(new_end)}\n{text}")

    with open(args.output, 'w', encoding='utf-8') as f:
        f.write('\n\n'.join(adjusted) + '\n')

    print(f"Adjusted {len(adjusted)} segments at {args.speed}x speed")
    print(f"Output: {args.output}")

if __name__ == '__main__':
    main()
