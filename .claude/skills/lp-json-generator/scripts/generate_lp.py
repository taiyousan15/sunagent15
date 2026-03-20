#!/usr/bin/env python3
"""
LP JSON Generator - メインスクリプト

参考画像のデザインスタイルを維持しながら、テキストのみを変更したLP画像を生成。

Usage:
    python generate_lp.py --template templates/basic_lp.json --output output/my_lp.png
    python generate_lp.py --template templates/basic_lp.json --text-file texts/my_texts.json --output output/my_lp.png
"""

import argparse
import json
import os
import subprocess
import sys
from pathlib import Path


# パス設定
SCRIPT_DIR = Path(__file__).parent
SKILL_DIR = SCRIPT_DIR.parent
NANOBANANA_DIR = SKILL_DIR.parent / "nanobanana-pro"


def load_json(file_path: str) -> dict:
    """JSONファイルを読み込む"""
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)


def save_json(data: dict, file_path: str) -> None:
    """JSONファイルを保存する"""
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def merge_texts(template: dict, texts: dict) -> dict:
    """テンプレートにテキストをマージする"""
    result = template.copy()

    # topBar
    if "topBar" in texts and "topBar" in result:
        result["topBar"]["text"] = texts["topBar"].get("text", result["topBar"]["text"])

    # textElements
    if "textElements" in texts and "textElements" in result:
        for i, text_elem in enumerate(texts["textElements"]):
            if i < len(result["textElements"]):
                if "text" in text_elem:
                    result["textElements"][i]["text"] = text_elem["text"]

    # ctaButton
    if "ctaButton" in texts and "ctaButton" in result:
        result["ctaButton"]["text"] = texts["ctaButton"].get("text", result["ctaButton"]["text"])

    # bottomBar
    if "bottomBar" in texts and "bottomBar" in result:
        if "text1" in texts["bottomBar"]:
            result["bottomBar"]["text1"] = texts["bottomBar"]["text1"]
        if "text2" in texts["bottomBar"]:
            result["bottomBar"]["text2"] = texts["bottomBar"]["text2"]

    # personPhoto description
    if "personPhoto" in texts and "personPhoto" in result:
        if "description" in texts["personPhoto"]:
            result["personPhoto"]["description"] = texts["personPhoto"]["description"]

    return result


def json_to_prompt(design_json: dict) -> str:
    """JSON仕様をGeminiプロンプトに変換する"""
    json_str = json.dumps(design_json, ensure_ascii=False)

    prompt = f"""Generate a Japanese marketing LP header image exactly according to this JSON specification:

{json_str}

Create this exact layout with all Japanese text rendered clearly. The decorative elements (like golden oval brush stroke) are important."""

    return prompt


def generate_image(prompt: str, output_path: str, timeout: int = 180, show_browser: bool = False) -> bool:
    """NanoBanana Proで画像を生成する"""

    # NanoBanana Proのパスを確認
    run_script = NANOBANANA_DIR / "scripts" / "run.py"
    if not run_script.exists():
        print(f"❌ NanoBanana Pro not found at: {NANOBANANA_DIR}")
        print("   Please install: git clone https://github.com/RenTonoduka/NanobananaPro-skill.git nanobanana-pro")
        return False

    # コマンド構築
    cmd = [
        sys.executable,
        str(run_script),
        "image_generator.py",
        "--prompt", prompt,
        "--output", output_path,
        "--timeout", str(timeout)
    ]

    if show_browser:
        cmd.append("--show-browser")

    # 実行
    print(f"🎨 Generating LP image...")
    print(f"   Output: {output_path}")
    print(f"   Timeout: {timeout}s")

    try:
        # NanoBanana Proディレクトリで実行
        result = subprocess.run(
            cmd,
            cwd=str(NANOBANANA_DIR),
            capture_output=False,
            text=True
        )

        if result.returncode == 0:
            print(f"\n✅ Image generated successfully: {output_path}")
            return True
        else:
            print(f"\n❌ Generation failed with exit code: {result.returncode}")
            return False

    except Exception as e:
        print(f"\n❌ Error: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(
        description="LP JSON Generator - 参考画像のスタイルでLP画像を生成",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # テンプレートから直接生成
  python generate_lp.py --template templates/basic_lp.json --output output/my_lp.png

  # テキストファイルで上書き
  python generate_lp.py --template templates/basic_lp.json --text-file texts/custom.json --output output/my_lp.png

  # ブラウザ表示（デバッグ用）
  python generate_lp.py --template templates/basic_lp.json --output output/my_lp.png --show-browser
        """
    )

    parser.add_argument(
        "--template", "-t",
        required=True,
        help="JSONテンプレートファイルのパス"
    )

    parser.add_argument(
        "--text-file", "-f",
        help="テキスト上書き用JSONファイルのパス（オプション）"
    )

    parser.add_argument(
        "--output", "-o",
        required=True,
        help="出力画像ファイルのパス"
    )

    parser.add_argument(
        "--timeout",
        type=int,
        default=180,
        help="生成タイムアウト秒数（デフォルト: 180）"
    )

    parser.add_argument(
        "--show-browser",
        action="store_true",
        help="ブラウザを表示（デバッグ用）"
    )

    parser.add_argument(
        "--save-merged",
        help="マージ後のJSONを保存するパス（オプション）"
    )

    args = parser.parse_args()

    # テンプレート読み込み
    print(f"📄 Loading template: {args.template}")
    template = load_json(args.template)

    # テキスト上書き（指定された場合）
    if args.text_file:
        print(f"📝 Loading text overrides: {args.text_file}")
        texts = load_json(args.text_file)
        design_json = merge_texts(template, texts)
    else:
        design_json = template

    # マージ後のJSONを保存（オプション）
    if args.save_merged:
        save_json(design_json, args.save_merged)
        print(f"💾 Merged JSON saved: {args.save_merged}")

    # プロンプト生成
    prompt = json_to_prompt(design_json)

    # 出力ディレクトリ作成
    output_dir = Path(args.output).parent
    output_dir.mkdir(parents=True, exist_ok=True)

    # 画像生成
    success = generate_image(
        prompt=prompt,
        output_path=args.output,
        timeout=args.timeout,
        show_browser=args.show_browser
    )

    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
