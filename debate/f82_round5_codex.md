1) Serial/Parallel=alternative: 編集は直列、棚卸しReadのみ並列可。根拠「merge conflictリスク」f82_round5_opus.md:L6, Pattern8「全パスのフロー図を書いて検証」mistakes.md:L67。
2) Phase split=disagree: 2PR案f82_round5_opus.md:L17は「単独PR必須」指示書.md:L130, 指示書.md:L283と衝突。Pattern10回避で単一PR＋途中実測(工数推定注意)指示書.md:L112, mistakes.md:L79。
3) Frontmatter同PR=agree: 「前提となる frontmatter fix」として同PR内で区分commitは可f82_round5_opus.md:L24。非前提修正は「他項目と混在禁止」指示書.md:L130に従い別PR。
