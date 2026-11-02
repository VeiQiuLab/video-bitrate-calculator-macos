"""Developer-only: python -B generate_reference.py. Standard library only."""
from pathlib import Path
import importlib.util
import itertools
import json
import sys

folder = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("original_bitrate_core", folder / "original" / "bitrate_core.py")
bc = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = bc
spec.loader.exec_module(bc)

budgets = []
for duration, target, audio, overhead in itertools.product(
    ("1", "9:38", "10:30.5", "1:09:38", "60:00", "35", "9：38", "0:00.125"),
    ("20", "170", "500"), ("0", "128", "256"), ("0", "1.5", "15")
):
    o = dict(timeMode="output", duration=duration, limit="1000", target=target,
             audio=audio, overhead=overhead, unit="MB", extra="0")
    try:
        b = bc.calculate(duration, "1000", target, audio, overhead)
        budgets.append(dict(input=o, video=b.video_kbps, seconds=b.seconds,
                            estimatedBytes=b.estimated_mb * 1_000_000))
    except ValueError:
        budgets.append(dict(input=o, error=True))

recommendations = []
for new, old in (("hevc", "H.265 / HEVC"), ("h264", "H.264 / AVC"), ("av1", "AV1"), ("vp9", "VP9")):
    for profile, original_profile in (("normal", "综合（一般游戏）"), ("fast", "高速战斗 / 大量粒子"), ("slow", "风景 / 慢节奏")):
        rates = {100, 2189, 30000}
        factor = bc.PROFILES[original_profile]
        for threshold in bc.CODECS[old]["thresholds"]:
            exact = int(threshold * factor)
            rates.update((exact - 1, exact, exact + 1))
        for rate in sorted(rates):
            recommendations.append(dict(codec=new, profile=profile, rate=rate,
                                        expected=bc.recommend(old, rate, original_profile)[0]))

path = folder / "reference_vectors.json"
path.write_text(json.dumps(dict(budgets=budgets, recommendations=recommendations),
                           ensure_ascii=False, indent=2), encoding="utf-8")
print(f"Generated {len(budgets)} budget cases and {len(recommendations)} recommendation cases")
