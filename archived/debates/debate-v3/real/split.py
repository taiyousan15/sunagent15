#!/usr/bin/env python3
"""Split v3_opus_15rounds.md into 15 individual round files for REAL 15-round debate."""
import os
import re

base = "/Users/matsumototoshihiko/Desktop/dev04/taisun_agent/debate-v3"
src = os.path.join(base, "v3_opus_15rounds.md")
dst = os.path.join(base, "real")
os.makedirs(dst, exist_ok=True)

with open(src, "r", encoding="utf-8") as f:
    content = f.read()

# Split by "## Round N:" headers (1-15)
pattern = re.compile(r"^## Round (\d+): ([^\n]+)$", re.MULTILINE)
matches = list(pattern.finditer(content))

# Keep pre-debate preamble
preamble_end = matches[0].start() if matches else len(content)
preamble = content[:preamble_end].strip()

# Save pre-debate facts separately
with open(os.path.join(dst, "_preamble_opus_facts.md"), "w", encoding="utf-8") as f:
    f.write(preamble + "\n")

# Extract each round
for i, m in enumerate(matches):
    round_num = int(m.group(1))
    topic = m.group(2).strip()
    start = m.start()
    end = matches[i + 1].start() if i + 1 < len(matches) else len(content)
    round_content = content[start:end].strip()

    out_path = os.path.join(dst, f"round{round_num:02d}_opus.md")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(f"# Round {round_num}: {topic} — Opus 4.6 Analysis\n\n")
        # Remove the duplicate title if present
        lines = round_content.split("\n")
        if lines and lines[0].startswith(f"## Round {round_num}:"):
            lines = lines[1:]
        f.write("\n".join(lines).strip() + "\n")
    print(f"  wrote {out_path}")

print(f"\nDone. Created {len(matches)} round files + preamble in {dst}")
