#!/usr/bin/env python3
"""
サンプル設定ファイル
このファイルをコピーしてカスタマイズしてください
"""

SLIDES_CONFIG = [
    # スライド1: 表紙
    {
        "num": 1,
        "name": "p01_cover",
        "bg_prompt": "anime style illustration, futuristic technology cityscape, robots and humans working together, bright hopeful atmosphere, no text, high quality",
        "title_texts": [
            {
                "text": "プレゼンテーションタイトル",
                "position": "top-center",
                "font_size": 56,
                "color": (255, 255, 255, 255),
                "outline_color": (0, 80, 120, 255),
                "outline_width": 5
            }
        ],
        "telop": "サブタイトルや説明文をここに記載"
    },

    # スライド2: 目次
    {
        "num": 2,
        "name": "p02_toc",
        "bg_prompt": "anime style illustration, organized bookshelf with glowing sections, knowledge library concept, warm lighting, no text, high quality",
        "title_texts": [
            {
                "text": "目次",
                "position": "top-center",
                "font_size": 60,
                "color": (255, 255, 255, 255),
                "outline_color": (80, 60, 0, 255),
                "outline_width": 5
            }
        ],
        "telop": "1. はじめに / 2. 本題 / 3. まとめ"
    },

    # スライド3: ステップ説明の例
    {
        "num": 3,
        "name": "p03_step1",
        "bg_prompt": "anime style illustration, robot assistant helping with task, step by step guide visualization, helpful atmosphere, no text, high quality",
        "title_texts": [
            {
                "text": "STEP 1",
                "position": (30, 25),
                "font_size": 32,
                "color": (100, 200, 255, 255),
                "outline_color": (0, 50, 100, 255),
                "outline_width": 3
            },
            {
                "text": "最初のステップ",
                "position": (30, 65),
                "font_size": 48,
                "color": (255, 255, 255, 255),
                "outline_color": (0, 80, 120, 255),
                "outline_width": 5
            }
        ],
        "telop": "ステップの詳細説明をここに記載"
    },

    # スライド4: まとめ
    {
        "num": 4,
        "name": "p04_summary",
        "bg_prompt": "anime style illustration, celebration scene with achievement icons, success visualization, bright cheerful atmosphere, no text, high quality",
        "title_texts": [
            {
                "text": "まとめ",
                "position": "top-center",
                "font_size": 60,
                "color": (255, 220, 100, 255),
                "outline_color": (100, 60, 0, 255),
                "outline_width": 6
            }
        ],
        "telop": "重要なポイントをまとめた説明文"
    },
]

# 設定オプション
#
# position の指定方法:
#   - "top-center": 上部中央
#   - "center": 中央
#   - "bottom-center": 下部中央
#   - (x, y): 座標指定（ピクセル）
#
# color / outline_color: RGBA形式 (R, G, B, A)
#   - 白: (255, 255, 255, 255)
#   - 黒: (0, 0, 0, 255)
#   - 青: (0, 80, 120, 255)
#   - 金: (255, 220, 100, 255)
#
# bg_prompt のコツ:
#   - 必ず "no text, high quality" を含める
#   - "anime style illustration" で始める
#   - シーンを具体的に説明
