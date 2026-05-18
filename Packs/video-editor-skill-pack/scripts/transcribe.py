"""
Whisper Transcription Script
提取音频并用 Whisper 转录为 SRT 字幕文件

Usage:
    python transcribe.py <video_path> [--model base] [--language zh] [--output subtitles.srt]
"""
import argparse, os, subprocess, sys

def extract_audio(video_path, audio_path):
    """Extract mono 16kHz WAV for Whisper."""
    cmd = [
        'ffmpeg', '-y', '-i', video_path,
        '-vn', '-ac', '1', '-ar', '16000', '-acodec', 'pcm_s16le',
        audio_path
    ]
    r = subprocess.run(cmd, capture_output=True)
    if r.returncode != 0:
        print(f"ffmpeg error: {r.stderr.decode('utf-8', errors='replace')[-500:]}")
        sys.exit(1)

def transcribe(audio_path, model_name='base', language='zh'):
    """Run Whisper transcription."""
    import whisper
    print(f"Loading Whisper model: {model_name}")
    model = whisper.load_model(model_name)
    print(f"Transcribing ({language})...")
    result = model.transcribe(audio_path, language=language)
    return result

def segments_to_srt(segments):
    """Convert Whisper segments to SRT format."""
    lines = []
    for i, seg in enumerate(segments, 1):
        start = seg['start']
        end = seg['end']
        text = seg['text'].strip()
        lines.append(f"{i}")
        lines.append(f"{fmt_time(start)} --> {fmt_time(end)}")
        lines.append(text)
        lines.append("")
    return '\n'.join(lines)

def fmt_time(sec):
    h = int(sec // 3600)
    m = int((sec % 3600) // 60)
    s = sec % 60
    ms = int((s - int(s)) * 1000)
    return f"{h:02d}:{m:02d}:{int(s):02d},{ms:03d}"

def main():
    parser = argparse.ArgumentParser(description='Whisper video transcription')
    parser.add_argument('video', help='Input video path')
    parser.add_argument('--model', default='base', choices=['tiny', 'base', 'small', 'medium', 'large'])
    parser.add_argument('--language', default='zh')
    parser.add_argument('--output', default=None, help='Output SRT path')
    args = parser.parse_args()

    work_dir = os.path.dirname(os.path.abspath(args.video))
    audio_path = os.path.join(work_dir, 'audio_temp.wav')
    output_path = args.output or os.path.join(work_dir, 'subtitles_raw.srt')

    print(f"Input: {args.video}")
    print(f"Model: {args.model} | Language: {args.language}")

    extract_audio(args.video, audio_path)
    print(f"Audio extracted: {audio_path}")

    result = transcribe(audio_path, args.model, args.language)

    srt_content = segments_to_srt(result['segments'])
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(srt_content)

    print(f"\nDone: {len(result['segments'])} segments")
    print(f"Output: {output_path}")
    print("\n⚠️  请人工校准字幕（专有名词、时间轴漂移、同音字）")

    # Cleanup
    os.remove(audio_path)

if __name__ == '__main__':
    main()
