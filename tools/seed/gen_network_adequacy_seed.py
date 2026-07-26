#!/usr/bin/env python3
"""
Generate the Network Adequacy seed deterministically for TWO states:

  - GA (Atlanta metro + a rural county) — the storyboard demo.
  - SD (Maria's state: Sioux Falls, Rapid City, Aberdeen, plus the Pine Ridge /
    Rosebud reservation counties) — frontier access ties to the rural
    total-cost-of-care context of the member (MARIA_SD_001).

County "profile" drives provider placement: urban = well-staffed & near; rural =
sparse & far; frontier (reservation) = an IHS-style primary-care clinic only,
specialists far away → severe, realistic gaps. Output feeds src/lib/networkAdequacy.
"""
import json
import os

OUT = os.path.join(os.path.dirname(__file__), "..", "..",
                   "src", "lib", "networkAdequacy", "data", "network-adequacy.seed.json")

# name, fips, state, type, profile, lat, lng, pop, medicaid, medicare, commercial
COUNTIES = [
    # Georgia — Atlanta metro + rural
    ("Fulton",        "13121", "GA", "large-metro", "urban",    33.79, -84.47, 1066000, 20000, 12000, 45000),
    ("DeKalb",        "13089", "GA", "large-metro", "urban",    33.77, -84.23,  764000, 18000, 10000, 38000),
    ("Gwinnett",      "13135", "GA", "large-metro", "urban",    33.96, -84.02,  957000, 19000,  9000, 42000),
    ("Cobb",          "13067", "GA", "metro",       "urban",    33.94, -84.58,  766000, 14000, 11000, 40000),
    ("Clay",          "13061", "GA", "rural",       "rural",    31.62, -84.98,    2900,  1200,   700,   500),
    # South Dakota — Maria's state
    ("Minnehaha",     "46099", "SD", "metro",       "urban",    43.67, -96.79,  197000, 16000, 14000, 55000),
    ("Pennington",    "46103", "SD", "micro",       "urban",    44.00, -102.82, 113000, 11000, 12000, 38000),
    ("Brown",         "46013", "SD", "micro",       "rural",    45.59, -98.35,   38000,  5000,  6000, 15000),
    ("Oglala Lakota", "46102", "SD", "ccn",         "frontier", 43.33, -102.55,  14000,  8000,  1200,   800),
    ("Todd",          "46121", "SD", "rural",       "frontier", 43.19, -100.72,  10000,  5500,   900,   600),
]

# specialty: maxDistanceMiles, requiredPer100k, maxWaitDays, minInNetworkPct, targetAdequacyPct
STANDARDS = {
    "Pediatrics":    (15, 15, 10, 90, 85),
    "Primary Care":  (10, 25, 10, 90, 85),
    "Mental Health": (15, 12, 10, 90, 85),
    "Cardiology":    (20,  5, 20, 90, 85),
    "OB/GYN":        (15,  8, 15, 90, 85),
}

BASE_T = {"Pediatrics": 6, "Primary Care": 8, "Mental Health": 4, "Cardiology": 3, "OB/GYN": 4}
MEDICAID_FRAC = {"Pediatrics": 0.35, "Primary Care": 0.5, "Mental Health": 0.3, "Cardiology": 0.5, "OB/GYN": 0.4}
MEDICARE_FRAC = 0.6

FIRST = ["Sarah", "Michael", "Emily", "James", "Maria", "David", "Aisha", "John",
         "Priya", "Robert", "Lena", "Carlos", "Nina", "Omar", "Grace", "Tom",
         "Dawn", "Elk", "Rose", "Joseph"]
LAST = ["Johnson", "Chen", "Rodriguez", "Wilson", "Patel", "Nguyen", "Smith",
        "Garcia", "Brown", "Davis", "Lee", "Martin", "Clark", "Lewis", "Walker",
        "Hall", "Yellow Hawk", "Two Bulls", "Bordeaux", "Standing Bear"]


def lobs_for(idx, t, medicaid_frac):
    lobs = ["Commercial"]
    if idx < round(MEDICARE_FRAC * t):
        lobs.append("Medicare")
    if idx < round(medicaid_frac * t):
        lobs.append("Medicaid")
    return lobs


def main():
    geo, standards, providers = [], [], []
    for name, fips, state, ctype, profile, lat, lng, pop, mcd, mcr, com in COUNTIES:
        geo.append({
            "fips": fips, "name": name, "state": state, "countyType": ctype,
            "lat": lat, "lng": lng, "population": pop,
            "members": {"Medicaid": mcd, "Medicare": mcr, "Commercial": com},
        })
    standards = [{
        "specialty": s, "maxDistanceMiles": v[0], "requiredPer100k": v[1],
        "maxWaitDays": v[2], "minInNetworkPct": v[3], "targetAdequacyPct": v[4],
    } for s, v in STANDARDS.items()]

    npi, n = 1000000001, 0
    for name, fips, state, ctype, profile, lat, lng, *_ in COUNTIES:
        for spec, t in BASE_T.items():
            if profile == "urban":
                count = t
            elif profile == "rural":
                count = max(1, round(t * 0.3))
            else:  # frontier: only a primary-care (IHS-style) clinic in county
                count = 1 if spec == "Primary Care" else 0
            for i in range(count):
                if profile == "urban":
                    plat, plng = lat + (i % 4) * 0.012, lng + ((i // 4) % 4) * 0.012
                    lobs = lobs_for(i, t, MEDICAID_FRAC[spec])
                elif profile == "rural":
                    plat, plng = lat + 0.36, lng + 0.05  # ~25 mi
                    lobs = ["Commercial", "Medicare"] if i == 0 else ["Commercial"]
                else:  # frontier primary-care clinic accepts all LOBs (safety net)
                    plat, plng = lat + 0.02, lng + 0.02
                    lobs = ["Medicaid", "Medicare", "Commercial"]
                providers.append({
                    "npi": str(npi),
                    "name": f"Dr. {FIRST[n % len(FIRST)]} {LAST[(n // 3) % len(LAST)]}",
                    "specialty": spec, "county": name,
                    "lat": round(plat, 4), "lng": round(plng, 4),
                    "lobs": lobs, "acceptingNewPatients": True,
                    "status": "active" if (n % 5) else "credentialing",
                })
                npi += 1
                n += 1

    wait_times = [
        {"county": "Fulton", "specialty": "Mental Health", "lob": "Medicaid", "avgWaitDays": 18},
        {"county": "Fulton", "specialty": "Pediatrics", "lob": "Medicaid", "avgWaitDays": 12},
        {"county": "DeKalb", "specialty": "Mental Health", "lob": "Medicaid", "avgWaitDays": 15},
        {"county": "Oglala Lakota", "specialty": "Mental Health", "lob": "Medicaid", "avgWaitDays": 34},
        {"county": "Todd", "specialty": "Primary Care", "lob": "Medicaid", "avgWaitDays": 21},
        {"county": "Minnehaha", "specialty": "Primary Care", "lob": "Commercial", "avgWaitDays": 7},
    ]

    seed = {
        "version": "1.0",
        "states": ["GA", "SD"],
        "generator": "gen_network_adequacy_seed.py",
        "geo": geo,
        "standards": standards,
        "providers": providers,
        "waitTimes": wait_times,
    }
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w") as fh:
        json.dump(seed, fh, indent=2)
    print(f"Wrote {OUT}: {len(geo)} counties (GA+SD), {len(standards)} specialties, {len(providers)} providers")


if __name__ == "__main__":
    main()
