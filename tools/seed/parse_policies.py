#!/usr/bin/env python3
"""
Parse Aetna Clinical Policy Bulletins (CPBs) and UnitedHealthcare Prior
Authorization requirement lists (from -layout pdftotext output) into a single
normalized policy library JSON.

Two ingestion adapters, one normalized schema. This is the *reference* parser
that the TypeScript Policy Engine's ingestion adapters mirror; it also produces
the seed library the engine loads in mock mode.
"""
import json
import os
import re
import sys

TXT_DIR = "/home/claude/policywork/txt"
OUT = "/home/claude/policywork/policy_library.json"

# ---------- helpers ----------

def collapse_spaced(line: str) -> str:
    """Aetna renders some headers with letter-spacing: 'C P T c o d e s'.
    Collapse runs of single chars separated by single spaces back to words."""
    # Heuristic: if line has many 'X ' single-char tokens, join them.
    tokens = line.split()
    if not tokens:
        return line
    singles = sum(1 for t in tokens if len(t) == 1)
    if singles >= max(6, len(tokens) * 0.6):
        return "".join(tokens)
    return line

CPT_RE = re.compile(r"^\d{4}[0-9A-Z]$")          # 5 char CPT (e.g., 75557, 0523T)
HCPCS_RE = re.compile(r"^[A-Z]\d{4}$")            # e.g., A9576, J0151, Q0138
ICD10_RE = re.compile(r"^[A-Z]\d{2}(?:\.[0-9A-Z]{1,4})?$")  # e.g., A18.89, I42, Z95.811

def extract_codes_from_token(tok: str):
    tok = tok.strip().strip(",;")
    out = {"cpt": [], "hcpcs": [], "icd10": []}
    if CPT_RE.match(tok):
        out["cpt"].append(tok)
    elif HCPCS_RE.match(tok):
        out["hcpcs"].append(tok)
    elif ICD10_RE.match(tok):
        out["icd10"].append(tok)
    return out

# ---------- Aetna CPB adapter ----------

AETNA_SECTIONS = [
    ("cptCovered", re.compile(r"CPTcodescoveredifselectioncriteriaaremet", re.I)),
    ("cptNotCovered", re.compile(r"CPTcodesnotcovered", re.I)),
    ("cptOther", re.compile(r"OtherCPTcodesrelated", re.I)),
    ("hcpcsCovered", re.compile(r"HCPCScodescoveredifselectioncriteriaaremet", re.I)),
    ("hcpcsNotCovered", re.compile(r"HCPCScodesnotcovered", re.I)),
    ("hcpcsOther", re.compile(r"OtherHCPCScodesrelated", re.I)),
    ("icd10Covered", re.compile(r"ICD-?10codescoveredifselectioncriteriaaremet", re.I)),
    ("icd10NotCovered", re.compile(r"ICD-?10codesnotcovered", re.I)),
]

def parse_aetna(path: str, text: str) -> dict:
    lines = text.splitlines()
    joined = "\n".join(lines)

    number = None
    m = re.search(r"Number:\s*(\d{3,4})", joined)
    if m:
        number = m.group(1)

    url = None
    m = re.search(r"https://www\.aetna\.com/cpb/medical/data/\S+", joined)
    if m:
        url = m.group(0).strip()

    # title: first two content lines after the aetna.com header block
    title = None
    for i, ln in enumerate(lines[:40]):
        s = ln.strip()
        if s and "aetna.com" not in s and "-->" not in s and not s.startswith("("):
            # the header title is usually split across 2 lines
            nxt = lines[i + 1].strip() if i + 1 < len(lines) else ""
            if "Clinical Policy Bulletin" in nxt or "Cardiovascular" in s or "Cardiac" in s or "Magnetic" in s:
                title = s
                if nxt and "Clinical Policy Bulletin" not in nxt and "aetna.com" not in nxt and len(nxt) < 80:
                    title = (s + " " + nxt).strip()
                break
    if not title:
        base = os.path.basename(path)
        title = base.replace("AETNA__", "").replace(" - Medical Clinical Policy Bulletins Aetna.txt", "")

    # dates (label may be inline "Label: mm/dd/yyyy" OR label then date on a
    # later line, as Aetna renders "Last Review \n 08/01/2023")
    def find_date(label):
        m = re.search(label + r"\s*:?\s*(\d{2}/\d{2}/\d{4})", joined)
        if not m:
            m = re.search(label + r"[\s\S]{0,180}?(\d{2}/\d{2}/\d{4})", joined)
        if m:
            mm, dd, yy = m.group(1).split("/")
            return f"{yy}-{mm}-{dd}"
        return None
    last_review = find_date(r"Last Review")
    effective = find_date(r"Effective")
    next_review = find_date(r"Next Review")

    # code sections: walk lines, tracking current section by collapsed header
    codes = {k: [] for k, _ in AETNA_SECTIONS}
    current = None
    in_code_zone = False
    for raw in lines:
        col = collapse_spaced(raw.strip())
        matched = False
        for key, rx in AETNA_SECTIONS:
            if rx.search(col.replace(" ", "")):
                current = key
                in_code_zone = True
                matched = True
                break
        if matched:
            continue
        # stop code zone at Background/References big sections
        if re.match(r"^(Background|References|Definitions|The above policy)", raw.strip()):
            in_code_zone = False
            current = None
        if current and in_code_zone:
            for tok in re.split(r"[\s]+", raw.strip()):
                ec = extract_codes_from_token(tok)
                # route to the right family for this section
                fam = "cpt" if current.startswith("cpt") else ("hcpcs" if current.startswith("hcpcs") else "icd10")
                for c in ec[fam]:
                    if c not in codes[current]:
                        codes[current].append(c)

    # medical-necessity indications: capture lettered items under "I. Medical Necessity"
    indications = []
    mn = re.search(r"I\.\s*Medical Necessity", joined)
    if mn:
        seg = joined[mn.end(): mn.end() + 8000]
        for im in re.finditer(r"\n\s*([A-Z])\.\s+([A-Z][^\n]{3,90})", seg):
            label, ttl = im.group(1), im.group(2).strip()
            if ttl.lower().startswith("for example"):
                continue
            indications.append({"label": label, "title": ttl})
            if len(indications) >= 30:
                break

    # A CPB requires a medical-necessity / PA review when it defines codes that
    # are "covered if selection criteria are met" or lettered MN indications.
    # A CPB with ONLY "not covered" codes is an experimental/investigational
    # determination (auto-deny basis), not a criteria-gated one.
    has_covered = bool(codes["cptCovered"] or codes["hcpcsCovered"])
    has_notcovered = bool(codes["cptNotCovered"] or codes["hcpcsNotCovered"])
    requires_pa = has_covered or bool(indications)
    experimental = (not has_covered) and has_notcovered and not indications
    determination_basis = (
        "experimental-investigational-not-covered" if experimental
        else "medical-necessity-criteria"
    )

    category = "Cardiac / Diagnostic Imaging" if "/Diagnostic/" in path or "Diagnostic" in path else "Cardiac / Medical & Procedural"

    pid = f"aetna-cpb-{number}" if number else "aetna-cpb-" + re.sub(r"[^a-z0-9]+", "-", title.lower())[:40]
    return {
        "policyId": pid,
        "source": "Aetna",
        "sourceType": "medical-clinical-policy-bulletin",
        "number": number,
        "title": title,
        "category": category,
        "url": url,
        "effectiveDate": effective,
        "reviewLastDate": last_review,
        "nextReviewDate": next_review,
        "requiresPA": requires_pa,
        "experimental": experimental,
        "determinationBasis": determination_basis,
        "codes": codes,
        "indications": indications,
        "indicationCount": len(indications),
        "rawTextChars": len(text),
        "sourceFile": os.path.basename(path),
    }

# ---------- UnitedHealthcare PA-list adapter ----------

def parse_uhc(path: str, text: str) -> dict:
    lines = text.splitlines()
    joined = "\n".join(lines)

    base = os.path.basename(path)
    plan = "Commercial Advance Notification" if "Commercial" in base else (
        "Texas STAR" if "Texas STAR" in base else base)

    eff = None
    m = re.search(r"Effective\s+([A-Za-z]+\s+\d{1,2},\s*\d{4})", joined)
    if m:
        eff = m.group(1)

    # Extract all CPT/HCPCS codes that appear in the requirements grid.
    # Categories are lines in Title Case at left margin; codes are 5-char tokens.
    pa_items = []
    all_codes = set()
    current_cat = None
    cat_codes = {}
    cat_dates = {}

    date_re = re.compile(r"([A-Z][a-z]{2,8}\.?\s+\d{1,2},\s*\d{4})")
    for raw in lines:
        s = raw.rstrip()
        if not s.strip():
            continue
        # skip page headers/footers
        if re.search(r"Prior authorization|UHCprovider|PCA-|Diagnosis|Category|effective date|Additional information", s):
            # but a category name might share a line; still try to capture a leading category
            pass
        # capture codes on this line
        toks = re.findall(r"\b[A-Z]?\d{4}[0-9A-Z]?\b", s)
        line_cpt = [t for t in toks if CPT_RE.match(t) or HCPCS_RE.match(t)]
        # capture a category label: leading text before lots of spaces, alphabetic
        mcat = re.match(r"^([A-Z][A-Za-z][A-Za-z &/,'\-\(\)]{3,60}?)\s{2,}", s)
        lead = s.strip()
        # A category line typically starts at col 0-1 with a capitalized phrase and
        # few/no codes, OR shares its first cell with codes.
        if mcat and not re.match(r"^\s*[A-Z]?\d{4}", s):
            cand = mcat.group(1).strip()
            if not re.search(r"authorization|Diagnosis|Additional|Portal|call|submit|Please|codes|Prior", cand, re.I):
                current_cat = cand
                cat_codes.setdefault(current_cat, [])
                d = date_re.search(s)
                if d and current_cat not in cat_dates:
                    cat_dates[current_cat] = d.group(1)
        if current_cat and line_cpt:
            for c in line_cpt:
                if c not in cat_codes[current_cat]:
                    cat_codes[current_cat].append(c)
                all_codes.add(c)
            d = date_re.search(s)
            if d and current_cat not in cat_dates:
                cat_dates[current_cat] = d.group(1)
        elif line_cpt:
            all_codes.update(line_cpt)

    for cat, cds in cat_codes.items():
        if cds:
            pa_items.append({"category": cat, "codes": cds, "effectiveDate": cat_dates.get(cat)})

    pid = "uhc-" + re.sub(r"[^a-z0-9]+", "-", plan.lower()).strip("-")
    return {
        "policyId": pid,
        "source": "UnitedHealthcare",
        "sourceType": "prior-authorization-requirements-list",
        "plan": plan,
        "title": f"UnitedHealthcare Prior Authorization Requirements — {plan}",
        "category": "Payer PA-required code list",
        "effectiveDate": eff,
        "requiresPA": True,
        "determinationBasis": "code-on-pa-required-list",
        "paItems": pa_items,
        "paCategoryCount": len(pa_items),
        "allPaCodes": sorted(all_codes),
        "allPaCodeCount": len(all_codes),
        "rawTextChars": len(text),
        "sourceFile": base,
    }

# ---------- driver ----------

def main():
    policies = []
    for fn in sorted(os.listdir(TXT_DIR)):
        if not fn.endswith(".txt"):
            continue
        path = os.path.join(TXT_DIR, fn)
        with open(path, encoding="utf-8", errors="replace") as fh:
            text = fh.read()
        if fn.startswith("UHC__"):
            policies.append(parse_uhc(path, text))
        else:
            policies.append(parse_aetna(path, text))

    lib = {
        "libraryVersion": "1.0",
        "generator": "parse_policies.py",
        "sourceCorpus": "Aetna Cardiac CPBs + UnitedHealthcare PA requirement lists",
        "policyCount": len(policies),
        "policies": policies,
    }
    with open(OUT, "w") as fh:
        json.dump(lib, fh, indent=2)
    print(f"Wrote {OUT} with {len(policies)} policies")
    # quick summary
    for p in policies:
        if p["source"] == "Aetna":
            print(f"  [Aetna #{p['number']}] {p['title'][:55]:55s} "
                  f"cptCov={len(p['codes']['cptCovered'])} "
                  f"icd10Cov={len(p['codes']['icd10Covered'])} "
                  f"ind={p['indicationCount']}")
        else:
            print(f"  [UHC {p['plan'][:28]:28s}] paCats={p['paCategoryCount']} "
                  f"paCodes={p['allPaCodeCount']}")

if __name__ == "__main__":
    main()
