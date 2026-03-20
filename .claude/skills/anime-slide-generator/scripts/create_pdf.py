#!/usr/bin/env python3
"""
スライド画像をPDFに変換
"""

import os
import glob
import argparse
from fpdf import FPDF
from PIL import Image


def get_slide_number(path):
    """ファイル名からスライド番号を抽出"""
    name = os.path.basename(path)
    # p01_xxx.png, p36_xxx.png, p100_xxx.png 形式
    num_part = name.split("_")[0]  # p01, p36, p100
    try:
        return int(num_part[1:])  # "p01" -> 1
    except ValueError:
        return 0


def create_pdf(input_dir, output_path, orientation='L', format='A4'):
    """スライド画像からPDFを生成"""
    # 完成版スライドを取得（_bg.pngを除外）
    all_pngs = glob.glob(os.path.join(input_dir, "*.png"))
    slides = [f for f in all_pngs if not f.endswith("_bg.png")]

    if not slides:
        print(f"Error: No slides found in {input_dir}")
        return None

    # スライド番号でソート
    slides.sort(key=get_slide_number)

    print(f"Slides: {len(slides)}")
    print(f"First: {os.path.basename(slides[0])}")
    print(f"Last: {os.path.basename(slides[-1])}")

    # PDF作成
    pdf = FPDF(orientation=orientation, unit='mm', format=format)
    pdf.set_auto_page_break(False)

    # ページサイズ
    if orientation == 'L':
        page_w, page_h = 297, 210  # A4横
    else:
        page_w, page_h = 210, 297  # A4縦

    for i, slide_path in enumerate(slides):
        pdf.add_page()

        # 画像サイズ取得
        with Image.open(slide_path) as img:
            img_w, img_h = img.size

        # アスペクト比を維持してフィット
        ratio = min(page_w / img_w, page_h / img_h)
        new_w = img_w * ratio
        new_h = img_h * ratio

        # 中央配置
        x = (page_w - new_w) / 2
        y = (page_h - new_h) / 2

        pdf.image(slide_path, x=x, y=y, w=new_w, h=new_h)

        if (i + 1) % 20 == 0:
            print(f"  {i + 1}/{len(slides)} processed")

    # PDF保存
    pdf.output(output_path)

    file_size = os.path.getsize(output_path) / 1024 / 1024
    print(f"\n✓ PDF created: {output_path}")
    print(f"  Size: {file_size:.1f} MB")
    print(f"  Pages: {len(slides)}")

    return output_path


def main():
    parser = argparse.ArgumentParser(description="Create PDF from slide images")
    parser.add_argument("--input", required=True, help="Input directory with slide images")
    parser.add_argument("--output", required=True, help="Output PDF path")
    parser.add_argument("--orientation", default="L", choices=["L", "P"],
                        help="Page orientation (L=Landscape, P=Portrait)")
    parser.add_argument("--format", default="A4", help="Page format")

    args = parser.parse_args()

    create_pdf(args.input, args.output, args.orientation, args.format)


if __name__ == "__main__":
    main()
