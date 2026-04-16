# Round 12 — Codex Challenge

## Finding 1
**Verdict**: AGREE
**Reason**: install.sh/install.ps1の二重メンテナンス構造による同期ズレは、setup-project.ps1:181のagent-source/agentsズレという実証済みの証拠がある。`scripts/features.json`による単一定義場所の設置という推奨は方向性として正しい。ただしJSONをsh/ps1両方から読む実装は、shではjqが必須になり（Alpine/Busyboxではjqがデフォルトでない）、依存関係が増える点に注意が必要。
**Alternative/Supplement**: `features.json`の代わりに`scripts/config.sh`（shとps1がsourceまたはdot-sourceで読む共通変数ファイル）にする方が外部ツール依存を増やさない。ps1は`.`ではなく`. config.sh`を読めないためps1向けには`config.ps1`を自動生成するmakeターゲットを設ける構成が現実的。

## Finding 2
**Verdict**: PARTIAL
**Reason**: additive-only設計でdeprecatedなMCPが永遠に残留する問題は実在する。`.mcp.json.example`にdeprecation markを付けるルールの設置という推奨は運用として合理的。ただし「明示的リスト管理」は人手による台帳管理であり、Round10 Finding2（キーリネームの警告チェック）と合わせると管理箇所が分散するリスクがある。
**Alternative/Supplement**: deprecated管理の単一ソースを`.mcp.json.example`内の`_deprecated`キーに統一する。install時にこのキー配下のエントリを検出し、ユーザーの設定から同名キーがあれば削除確認プロンプトを出す。台帳ファイルを別途作らず例示ファイル自体を仕様書として機能させる。

## Finding 3
**Verdict**: AGREE
**Reason**: hookをハードコードでリスト管理する検証スクリプトは、新hook追加時の検証もれが構造的に避けられない。`.claude/hooks/`ディレクトリの動的スキャンによる自動化という推奨は正確かつ実装コストも低い。
**Alternative/Supplement**: 動的スキャンに加え、各hookファイルの先頭に`# hook-type: pre-tool`等のメタコメントを付けるルールを設けると、スキャン時にhookの種別・必須/任意の判定も自動化できる。単純な存在確認から「意図した種別のhookが正しく配置されているか」の検証に格上げできる。
