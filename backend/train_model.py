"""
Train a cognitive load classifier on synthetic developer telemetry data.
Outputs model weights as JSON that the Node.js backend uses for predictions.

Features:
  - typing_speed      (WPM)
  - pause_duration    (seconds, avg gap between bursts)
  - keystroke_variance (0-1, rhythm irregularity)
  - window_switches   (count per 30s window)

Labels: low | moderate | high
"""

import json, random, math
import numpy as np
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import cross_val_score
from sklearn.metrics import classification_report

random.seed(42)
np.random.seed(42)

# ─── Dataset generation ──────────────────────────────────────────────────────

def clamp(v, lo=0.0, hi=1.0):
    return max(lo, min(hi, v))

def jitter(base, scale):
    return base + random.gauss(0, scale)

samples = []

def add(label, n, speed_range, pause_range, var_range, sw_range):
    for _ in range(n):
        s = random.uniform(*speed_range)
        p = random.uniform(*pause_range)
        v = random.uniform(*var_range)
        w = random.randint(*sw_range)
        # add small gaussian noise so boundaries overlap naturally
        s = max(0, s + random.gauss(0, 3))
        p = max(0, p + random.gauss(0, 0.3))
        v = clamp(v + random.gauss(0, 0.03))
        w = max(0, w + random.randint(-1, 1))
        samples.append([s, p, v, w, label])

# LOW cognitive load — fast typing, short pauses, steady rhythm, few switches
# Classic "in the zone" or "familiar task" state
add('low',      220, (55, 100), (0.1, 1.5), (0.01, 0.12), (0, 1))

# LOW — very fast burst typist (low variance even at high speed)
add('low',       80, (70, 110), (0.0, 1.0), (0.01, 0.09), (0, 0))

# MODERATE — medium typing, moderate pauses, some variance
add('moderate', 220, (25, 60),  (1.0, 4.0), (0.10, 0.35), (1, 3))

# MODERATE — slow but steady — reading code, reviewing
add('moderate',  80, (10, 30),  (1.5, 5.0), (0.05, 0.20), (0, 2))

# MODERATE — lots of switching but typing fast (reading/researching)
add('moderate',  80, (35, 65),  (0.5, 2.5), (0.10, 0.30), (3, 5))

# HIGH — very slow typing, long pauses, irregular — struggling or overloaded
add('high',     220, (5,  22),  (4.0, 12.0),(0.30, 0.85), (3, 8))

# HIGH — lots of frantic switching, irregular typing — context overload
add('high',      80, (10, 35),  (2.5, 8.0), (0.35, 0.80), (5, 10))

# HIGH — almost not typing, very long pauses — blocked/overwhelmed
add('high',      80, (0,  10),  (6.0, 15.0),(0.40, 0.90), (0, 4))

random.shuffle(samples)

X = np.array([[s[0], s[1], s[2], s[3]] for s in samples])
y = np.array([s[4] for s in samples])

print(f"Dataset: {len(X)} samples")
print("  low     :", (y == 'low').sum())
print("  moderate:", (y == 'moderate').sum())
print("  high    :", (y == 'high').sum())

# ─── Scaling ─────────────────────────────────────────────────────────────────

scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# ─── Train ───────────────────────────────────────────────────────────────────

clf = GradientBoostingClassifier(
    n_estimators=200,
    max_depth=4,
    learning_rate=0.08,
    subsample=0.85,
    random_state=42
)
clf.fit(X_scaled, y)

cv_scores = cross_val_score(clf, X_scaled, y, cv=5, scoring='accuracy')
print(f"\nCV Accuracy: {cv_scores.mean():.3f} ± {cv_scores.std():.3f}")

print("\nClassification report:")
from sklearn.model_selection import train_test_split
X_tr, X_te, y_tr, y_te = train_test_split(X_scaled, y, test_size=0.2, random_state=42, stratify=y)
clf_check = GradientBoostingClassifier(n_estimators=200, max_depth=4, learning_rate=0.08, subsample=0.85, random_state=42)
clf_check.fit(X_tr, y_tr)
print(classification_report(y_te, clf_check.predict(X_te)))

# ─── Export for Node.js ──────────────────────────────────────────────────────
# We export:
#  - scaler mean/std for normalisation
#  - the tree structure serialised as decision rules (too complex)
# Instead we precompute a dense lookup table over the feature grid and store
# that as a calibrated soft-classifier JSON that Node.js can evaluate quickly.

# Actually: export the GBM as a set of test predictions + a simple formula.
# Best approach: export scaler params + per-class boundary thresholds by
# computing the model's decision surface at representative grid points, then
# fitting simple linear boundaries the Node.js side reconstructs.

# Simpler and accurate: export the scaler + serialize the sklearn model's
# predict_proba into a JSON callable via a feature lookup table (1000 points).

# We export model metadata + a calibration table the Node.js side interpolates.
# Grid: typing_speed x pause_duration x keystroke_variance x window_switches

print("\nGenerating calibration grid...")

SPEEDS     = [0, 5, 10, 15, 20, 30, 40, 55, 70, 90, 110]
PAUSES     = [0, 0.5, 1, 2, 3, 5, 7, 10, 15]
VARIANCES  = [0, 0.05, 0.1, 0.2, 0.35, 0.5, 0.7, 0.9]
SWITCHES   = [0, 1, 2, 3, 5, 7, 10]

grid_X = []
grid_keys = []
for sp in SPEEDS:
    for pa in PAUSES:
        for va in VARIANCES:
            for sw in SWITCHES:
                grid_X.append([sp, pa, va, sw])
                grid_keys.append([sp, pa, va, sw])

grid_X = np.array(grid_X)
grid_X_sc = scaler.transform(grid_X)
grid_proba = clf.predict_proba(grid_X_sc)
classes = list(clf.classes_)

table = []
for i, key in enumerate(grid_keys):
    proba = {classes[j]: round(float(grid_proba[i][j]), 4) for j in range(len(classes))}
    table.append({
        "speed": key[0],
        "pause": key[1],
        "variance": key[2],
        "switches": key[3],
        "proba": proba
    })

output = {
    "version": "1.0",
    "trained_on": len(X),
    "cv_accuracy": round(float(cv_scores.mean()), 4),
    "scaler": {
        "mean": scaler.mean_.tolist(),
        "std": scaler.scale_.tolist()
    },
    "classes": classes,
    "grid_axes": {
        "speeds": SPEEDS,
        "pauses": PAUSES,
        "variances": VARIANCES,
        "switches": SWITCHES
    },
    "calibration_table": table
}

out_path = "src/model_weights.json"
with open(out_path, "w") as f:
    json.dump(output, f, indent=2)

print(f"\nModel exported to backend/{out_path}")
print(f"Calibration table: {len(table)} grid points")

# ─── Sanity checks ───────────────────────────────────────────────────────────

tests = [
    ("Deep focus (low)",    [75, 0.3, 0.05, 0], "low"),
    ("Normal coding (mod)", [35, 2.5, 0.18, 2], "moderate"),
    ("Struggling (high)",   [8,  7.0, 0.55, 5], "high"),
    ("Slow review (mod)",   [15, 3.0, 0.10, 1], "moderate"),
    ("Context chaos (high)",[20, 4.5, 0.45, 7], "high"),
    ("Fast flow (low)",     [85, 0.2, 0.04, 0], "low"),
]

print("\n--- Sanity checks ---")
for name, feats, expected in tests:
    f_sc = scaler.transform([feats])
    pred = clf.predict(f_sc)[0]
    proba = clf.predict_proba(f_sc)[0]
    proba_str = " | ".join(f"{cls}: {p:.2f}" for cls, p in zip(clf.classes_, proba))
    status = "✓" if pred == expected else "✗"
    print(f"  {status} {name}: pred={pred} expected={expected}  [{proba_str}]")
