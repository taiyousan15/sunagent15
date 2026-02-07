#!/usr/bin/env python3
"""
スライドバッチ生成スクリプト
NanoBanana Pro + 日本語テキストオーバーレイ
"""

import os
import sys
import subprocess
import argparse
import importlib.util

# スキルディレクトリを追加
SKILL_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, SKILL_DIR)

from japanese_slide_generator import create_slide_with_telop

# NanoBanana Pro パス
NANOBANANA_PATH = os.path.expanduser("~/.claude/skills/nanobanana-pro")


def generate_background(prompt, output_path, timeout=180):
    """NanoBanana Pro で背景画像を生成"""
    try:
        result = subprocess.run(
            ["python3", "scripts/run.py", "image_generator.py",
             "--prompt", prompt,
             "--output", output_path],
            cwd=NANOBANANA_PATH,
            capture_output=True,
            text=True,
            timeout=timeout
        )

        if os.path.exists(output_path):
            return True
        return False
    except Exception as e:
        print(f"   Error: {e}")
        return False


def generate_single_slide(config, output_dir):
    """1枚のスライドを生成"""
    num = config["num"]
    name = config["name"]
    bg_prompt = config["bg_prompt"]
    title_texts = config["title_texts"]
    telop = config["telop"]

    os.makedirs(output_dir, exist_ok=True)

    bg_path = os.path.join(output_dir, f"{name}_bg.png")
    final_path = os.path.join(output_dir, f"{name}.png")

    print(f"\n{'='*60}")
    print(f"Slide {num}: {name}")
    print(f"{'='*60}")

    # 1. 背景画像生成
    print("1. Generating background...")
    if not generate_background(bg_prompt, bg_path):
        print(f"   ✗ Background generation failed")
        return None

    print(f"   ✓ Background: {bg_path}")

    # 2. テキストオーバーレイ
    print("2. Adding text overlay...")
    try:
        create_slide_with_telop(bg_path, final_path, title_texts, telop)
        print(f"   ✓ Slide complete: {final_path}")
        return final_path
    except Exception as e:
        print(f"   ✗ Overlay error: {e}")
        return None


def generate_batch(configs, output_dir, batch_name="Batch"):
    """バッチでスライドを生成"""
    print(f"\n{'#'*60}")
    print(f"# {batch_name}")
    print(f"{'#'*60}")

    results = []
    for config in configs:
        result = generate_single_slide(config, output_dir)
        results.append({
            "num": config["num"],
            "name": config["name"],
            "success": result is not None,
            "path": result
        })

    # サマリー
    print(f"\n{'='*60}")
    print(f"{batch_name} - Results")
    print(f"{'='*60}")
    success = sum(1 for r in results if r["success"])
    print(f"Success: {success}/{len(results)}")
    for r in results:
        status = "✓" if r["success"] else "✗"
        print(f"  {status} [{r['num']:03d}] {r['name']}")

    return results


def load_config_module(config_path):
    """設定ファイルを動的に読み込み"""
    spec = importlib.util.spec_from_file_location("config", config_path)
    config_module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(config_module)
    return config_module


def main():
    parser = argparse.ArgumentParser(description="Generate anime-style slides")
    parser.add_argument("--config", required=True, help="Path to config file (.py)")
    parser.add_argument("--output", required=True, help="Output directory")
    parser.add_argument("--batch", default="Slides", help="Batch name")
    parser.add_argument("--var", default="SLIDES_CONFIG", help="Config variable name")

    args = parser.parse_args()

    # 設定ファイルを読み込み
    config_module = load_config_module(args.config)
    slides_config = getattr(config_module, args.var)

    # バッチ生成
    results = generate_batch(slides_config, args.output, args.batch)

    print(f"\nOutput: {args.output}")

    # 失敗したスライドがあれば警告
    failed = [r for r in results if not r["success"]]
    if failed:
        print(f"\n⚠ Failed slides ({len(failed)}):")
        for r in failed:
            print(f"  - [{r['num']:03d}] {r['name']}")


if __name__ == "__main__":
    main()
