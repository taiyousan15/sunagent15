// C-3 canary: JSON でない stdout を返して正常終了（fail-open 誤合格の防止検証:
// 「stdout が空/JSON であること」を期待する契約がこの出力を不合格にできること）
process.stdout.write('this-is-not-json {{{');
process.exit(0);
