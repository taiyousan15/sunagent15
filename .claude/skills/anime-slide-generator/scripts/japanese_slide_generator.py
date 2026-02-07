#!/usr/bin/env python3
"""
日本語テキストオーバーレイ機能
NanoBanana Pro で生成した背景画像に日本語テキストを追加

対応OS: macOS, Windows, Linux
"""

from PIL import Image, ImageDraw, ImageFont
import os
import platform
import urllib.request
import zipfile

# ============================================
# クロスプラットフォーム フォント設定
# ============================================

# macOS用フォントパス
FONT_PATHS_MAC = {
    "bold": [
        "/System/Library/Fonts/ヒラギノ角ゴシック W8.ttc",
        "/System/Library/Fonts/ヒラギノ角ゴシック W7.ttc",
        "/Library/Fonts/Arial Unicode.ttf",
    ],
    "normal": [
        "/System/Library/Fonts/ヒラギノ角ゴシック W6.ttc",
        "/System/Library/Fonts/ヒラギノ角ゴシック W4.ttc",
        "/Library/Fonts/Arial Unicode.ttf",
    ],
}

# Windows用フォントパス
FONT_PATHS_WIN = {
    "bold": [
        "C:/Windows/Fonts/YuGothB.ttc",      # 游ゴシック Bold
        "C:/Windows/Fonts/meiryob.ttc",      # メイリオ Bold
        "C:/Windows/Fonts/meiryo.ttc",       # メイリオ
        "C:/Windows/Fonts/msgothic.ttc",     # MS ゴシック
        "C:/Windows/Fonts/msmincho.ttc",     # MS 明朝
    ],
    "normal": [
        "C:/Windows/Fonts/YuGothM.ttc",      # 游ゴシック Medium
        "C:/Windows/Fonts/meiryo.ttc",       # メイリオ
        "C:/Windows/Fonts/msgothic.ttc",     # MS ゴシック
        "C:/Windows/Fonts/msmincho.ttc",     # MS 明朝
    ],
}

# Linux用フォントパス
FONT_PATHS_LINUX = {
    "bold": [
        "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc",
        "/usr/share/fonts/noto-cjk/NotoSansCJK-Bold.ttc",
        "/usr/share/fonts/google-noto-cjk/NotoSansCJK-Bold.ttc",
        "/usr/share/fonts/truetype/fonts-japanese-gothic.ttf",
        "/usr/share/fonts/truetype/takao-gothic/TakaoGothic.ttf",
    ],
    "normal": [
        "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
        "/usr/share/fonts/noto-cjk/NotoSansCJK-Regular.ttc",
        "/usr/share/fonts/google-noto-cjk/NotoSansCJK-Regular.ttc",
        "/usr/share/fonts/truetype/fonts-japanese-gothic.ttf",
        "/usr/share/fonts/truetype/takao-gothic/TakaoGothic.ttf",
    ],
}

# バンドルフォント（Noto Sans JP - 自動ダウンロード）
BUNDLED_FONT_DIR = os.path.join(os.path.dirname(__file__), "..", "fonts")
BUNDLED_FONT_URL = "https://github.com/googlefonts/noto-cjk/raw/main/Sans/OTF/Japanese/NotoSansCJKjp-Bold.otf"


def get_os_type():
    """OSタイプを取得"""
    system = platform.system().lower()
    if system == "darwin":
        return "mac"
    elif system == "windows":
        return "windows"
    else:
        return "linux"


def download_bundled_font():
    """バンドルフォントをダウンロード（フォールバック用）"""
    os.makedirs(BUNDLED_FONT_DIR, exist_ok=True)
    font_path = os.path.join(BUNDLED_FONT_DIR, "NotoSansCJKjp-Bold.otf")

    if os.path.exists(font_path):
        return font_path

    try:
        print(f"[anime-slide-generator] 日本語フォントをダウンロード中...")
        urllib.request.urlretrieve(BUNDLED_FONT_URL, font_path)
        print(f"[anime-slide-generator] フォントをダウンロードしました: {font_path}")
        return font_path
    except Exception as e:
        print(f"[anime-slide-generator] フォントダウンロード失敗: {e}")
        return None


def find_font(style="bold"):
    """利用可能なフォントを検索"""
    os_type = get_os_type()

    # OS別のフォントリストを取得
    if os_type == "mac":
        font_list = FONT_PATHS_MAC.get(style, [])
    elif os_type == "windows":
        font_list = FONT_PATHS_WIN.get(style, [])
    else:
        font_list = FONT_PATHS_LINUX.get(style, [])

    # 存在するフォントを検索
    for font_path in font_list:
        if os.path.exists(font_path):
            return font_path

    # バンドルフォントを試行
    bundled = os.path.join(BUNDLED_FONT_DIR, "NotoSansCJKjp-Bold.otf")
    if os.path.exists(bundled):
        return bundled

    # 自動ダウンロード
    downloaded = download_bundled_font()
    if downloaded:
        return downloaded

    return None


def get_font(style="bold", size=48):
    """フォントを取得（クロスプラットフォーム対応）"""
    font_path = find_font(style)

    if font_path:
        try:
            return ImageFont.truetype(font_path, size)
        except Exception as e:
            print(f"[anime-slide-generator] フォント読み込みエラー: {e}")

    # 最終フォールバック: デフォルトフォント
    print("[anime-slide-generator] 警告: 日本語フォントが見つかりません。デフォルトフォントを使用します。")
    return ImageFont.load_default()


def get_font_info():
    """フォント情報を取得（デバッグ用）"""
    os_type = get_os_type()
    bold_font = find_font("bold")
    normal_font = find_font("normal")

    return {
        "os": os_type,
        "bold_font": bold_font,
        "normal_font": normal_font,
        "bundled_available": os.path.exists(os.path.join(BUNDLED_FONT_DIR, "NotoSansCJKjp-Bold.otf")),
    }


def add_telop_area(image_path, output_path, telop_ratio=0.20, bg_color=(20, 25, 40, 240)):
    """画像の下部にテロップ用の余白を追加"""
    img = Image.open(image_path).convert("RGBA")
    orig_width, orig_height = img.size

    # テロップエリアの高さを計算
    telop_height = int(orig_height * telop_ratio / (1 - telop_ratio))
    new_height = orig_height + telop_height

    # 新しい画像を作成（テロップエリア付き）
    new_img = Image.new("RGBA", (orig_width, new_height), bg_color)
    new_img.paste(img, (0, 0))

    new_img.save(output_path)
    return output_path, orig_height, telop_height


def draw_text_with_outline(draw, position, text, font, fill_color, outline_color, outline_width):
    """アウトライン付きテキストを描画"""
    x, y = position

    # アウトラインを描画
    for dx in range(-outline_width, outline_width + 1):
        for dy in range(-outline_width, outline_width + 1):
            if dx != 0 or dy != 0:
                draw.text((x + dx, y + dy), text, font=font, fill=outline_color)

    # メインテキストを描画
    draw.text((x, y), text, font=font, fill=fill_color)


def calculate_position(position, img_width, img_height, text_bbox, font_size):
    """テキスト位置を計算"""
    text_width = text_bbox[2] - text_bbox[0]
    text_height = text_bbox[3] - text_bbox[1]

    if position == "top-center":
        x = (img_width - text_width) // 2
        y = int(font_size * 0.3)
    elif position == "center":
        x = (img_width - text_width) // 2
        y = (img_height - text_height) // 2
    elif position == "bottom-center":
        x = (img_width - text_width) // 2
        y = img_height - text_height - int(font_size * 0.5)
    elif isinstance(position, tuple):
        x, y = position
    else:
        x, y = 50, 50

    return x, y


def add_title_texts(image_path, output_path, title_texts):
    """タイトルテキストを追加"""
    img = Image.open(image_path).convert("RGBA")
    draw = ImageDraw.Draw(img)
    img_width, img_height = img.size

    for text_config in title_texts:
        text = text_config["text"]
        position = text_config.get("position", "top-center")
        font_size = text_config.get("font_size", 48)
        color = text_config.get("color", (255, 255, 255, 255))
        outline_color = text_config.get("outline_color", (0, 0, 0, 255))
        outline_width = text_config.get("outline_width", 5)

        font = get_font("bold", font_size)

        # テキストサイズを取得
        text_bbox = draw.textbbox((0, 0), text, font=font)

        # 位置を計算
        x, y = calculate_position(position, img_width, img_height, text_bbox, font_size)

        # アウトライン付きテキストを描画
        draw_text_with_outline(draw, (x, y), text, font, color, outline_color, outline_width)

    img.save(output_path)
    return output_path


def add_telop_text(image_path, output_path, telop_text, orig_height, telop_height):
    """テロップテキストを追加"""
    img = Image.open(image_path).convert("RGBA")
    draw = ImageDraw.Draw(img)
    img_width = img.size[0]

    # フォントサイズを自動調整（幅に収まるように）
    max_width = img_width - 60
    font_size = 36

    while font_size > 16:
        font = get_font("normal", font_size)
        text_bbox = draw.textbbox((0, 0), telop_text, font=font)
        text_width = text_bbox[2] - text_bbox[0]
        if text_width <= max_width:
            break
        font_size -= 2

    font = get_font("normal", font_size)
    text_bbox = draw.textbbox((0, 0), telop_text, font=font)
    text_width = text_bbox[2] - text_bbox[0]
    text_height = text_bbox[3] - text_bbox[1]

    # テロップエリアの中央に配置
    x = (img_width - text_width) // 2
    y = orig_height + (telop_height - text_height) // 2

    # アウトライン付きテキストを描画
    draw_text_with_outline(
        draw, (x, y), telop_text, font,
        fill_color=(255, 255, 255, 255),
        outline_color=(0, 0, 0, 255),
        outline_width=3
    )

    img.save(output_path)
    return output_path


def create_slide_with_telop(bg_image_path, output_path, title_texts, telop_text, telop_ratio=0.20):
    """背景画像からテロップ付きスライドを生成"""
    import tempfile

    # 1. テロップエリアを追加
    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp1:
        tmp1_path = tmp1.name

    _, orig_height, telop_height = add_telop_area(bg_image_path, tmp1_path, telop_ratio)

    # 2. タイトルテキストを追加
    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp2:
        tmp2_path = tmp2.name

    add_title_texts(tmp1_path, tmp2_path, title_texts)

    # 3. テロップテキストを追加
    add_telop_text(tmp2_path, output_path, telop_text, orig_height, telop_height)

    # 一時ファイルを削除
    os.unlink(tmp1_path)
    os.unlink(tmp2_path)

    return output_path


if __name__ == "__main__":
    # テスト用
    import sys

    if len(sys.argv) < 4:
        print("Usage: python japanese_slide_generator.py <bg_image> <output> <title> [telop]")
        sys.exit(1)

    bg_path = sys.argv[1]
    output_path = sys.argv[2]
    title = sys.argv[3]
    telop = sys.argv[4] if len(sys.argv) > 4 else "テロップテスト"

    title_texts = [
        {
            "text": title,
            "position": "top-center",
            "font_size": 56,
            "color": (255, 255, 255, 255),
            "outline_color": (0, 80, 120, 255),
            "outline_width": 5
        }
    ]

    create_slide_with_telop(bg_path, output_path, title_texts, telop)
    print(f"Generated: {output_path}")
