# Round 12: 保守性 — Codex独立レビュー

## 測定対象（存在確認済み）
- /Users/matsumototoshihiko/Desktop/dev04/taisun_agent/scripts/install.sh（543行）
- /Users/matsumototoshihiko/Desktop/dev04/taisun_agent/scripts/setup-project.sh（246行）
- /Users/matsumototoshihiko/Desktop/dev04/taisun_agent/scripts/install.ps1（615行）
- /Users/matsumototoshihiko/Desktop/dev04/taisun_agent/scripts/setup-project.ps1（255行）

## 実測コマンド（comm -12, sort後）
- `sort install.sh > /tmp/a; sort setup-project.sh > /tmp/b; comm -12 /tmp/a /tmp/b | wc -l` = **110**
- `sort install.ps1 > /tmp/a; sort setup-project.ps1 > /tmp/b; comm -12 /tmp/a /tmp/b | wc -l` = **140**

### Finding 1
`install.sh` と `setup-project.sh` の共通行は **110**。`setup-project.sh` 246行の **44.7%** 相当が同一行として再出現。Opusの「~80行重複」より実測は大きい。共通処理（スキル/エージェント/MCP登録）を抽出しない限り、将来変更の同期コストは高い。

### Finding 2
`install.ps1` と `setup-project.ps1` の共通行は **140**。`setup-project.ps1` 255行の **54.9%** 相当。C3の「同様重複がある」という方向性は一致するが、実測値は「~80」より大きい。PowerShell側も共通モジュール化しないと差分管理が難しい。

### Finding 3
`comm -12` は「同一テキスト行の個数」を数える指標で、連続ブロック一致や意味的重複の全量は別途確認が必要。ただし本測定でも 110/140 と高く、重複が保守性リスクという結論は実データで支持される。
