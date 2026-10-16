import json, glob, sys
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment
from openpyxl.utils import get_column_letter

# Usage: python3 research/build_regs.py research research/roadkill-salvage-regs.xlsx src/data/regs.json
SRC = sys.argv[1]; XLSX = sys.argv[2]; APPJSON = sys.argv[3]
rows = []
for f in sorted(glob.glob(f"{SRC}/batch*.json")):
    rows += json.load(open(f))
rows.sort(key=lambda r: r["state"])
assert len(rows) == 50

CODES = dict(zip("Alabama Alaska Arizona Arkansas California Colorado Connecticut Delaware Florida Georgia Hawaii Idaho Illinois Indiana Iowa Kansas Kentucky Louisiana Maine Maryland Massachusetts Michigan Minnesota Mississippi Missouri Montana Nebraska Nevada NewHampshire NewJersey NewMexico NewYork NorthCarolina NorthDakota Ohio Oklahoma Oregon Pennsylvania RhodeIsland SouthCarolina SouthDakota Tennessee Texas Utah Vermont Virginia Washington WestVirginia Wisconsin Wyoming".split(),
"AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY".split()))

# Normalized for the app: status, report-within hours, and per-category Y/N/U
# (big game, bear, turkey, other upland birds, small game, furbearers).
# Hand-coded from the research text; U = not confirmed, so the app says "check first".
N = {
 "AL": ("discretion", None, "UUUUUU"), "AK": ("discretion", None, "UUUUUU"),
 "AZ": ("permit", None, "YYYNNN"), "AR": ("notify", None, "YYYNNN"),
 "CA": ("prohibited", None, "NNNNNN"), "CO": ("permit", 48, "YUYYUU"),
 "CT": ("notify", None, "YYNNNN"), "DE": ("permit", None, "YNNNNN"),
 "FL": ("open", None, "YNNNNN"), "GA": ("open", 48, "YYYYYY"),
 "HI": ("prohibited", None, "NNNNNN"), "ID": ("notify", 24, "YYYYYY"),
 "IL": ("notify", 24, "YNNNNU"), "IN": ("permit", None, "YUUUUU"),
 "IA": ("permit", None, "YUYYUU"), "KS": ("permit", None, "YUYUUU"),
 "KY": ("notify", 24, "YYYUUU"), "LA": ("discretion", None, "UUUUUU"),
 "ME": ("permit", None, "YYYNNN"), "MD": ("notify", 24, "YNYNNN"),
 "MA": ("permit", 24, "YNNNNN"), "MI": ("permit", None, "YYNYYU"),
 "MN": ("permit", None, "YYUUYU"), "MS": ("discretion", None, "UUUUUU"),
 "MO": ("permit", 24, "YUUUUU"), "MT": ("permit", 24, "YNNNNN"),
 "NE": ("permit", 24, "YNNNNN"), "NV": ("permit", 48, "YNUUUU"),
 "NH": ("permit", None, "YYYUUU"), "NJ": ("permit", None, "YNNNNN"),
 "NM": ("discretion", None, "UUUUUU"), "NY": ("permit", 24, "YYNNNN"),
 "NC": ("permit", None, "YYYYYU"), "ND": ("permit", None, "YUUUUU"),
 "OH": ("notify", 24, "YNUUUU"), "OK": ("discretion", None, "UUUUUU"),
 "OR": ("permit", 24, "YNNNNN"), "PA": ("notify", 24, "YNYUUU"),
 "RI": ("permit", 24, "YNYYYY"), "SC": ("discretion", None, "UUUUUU"),
 "SD": ("permit", None, "YNNNNN"), "TN": ("notify", 48, "YYYYUU"),
 "TX": ("prohibited", None, "NNNNNN"), "UT": ("discretion", None, "UUUUUU"),
 "VT": ("discretion", None, "UUUUUU"), "VA": ("notify", None, "YYYNNN"),
 "WA": ("permit", 24, "YNNNNN"), "WV": ("notify", 12, "YYYYYU"),
 "WI": ("notify", None, "YYYUUU"), "WY": ("permit", None, "YNYNNN"),
}
STATUS_LABEL = {"permit": "Legal, permit required", "notify": "Legal, must report", "open": "Legal, no permit",
                "discretion": "Officer's call", "prohibited": "Not allowed"}
YN = {"Y": "yes", "N": "no", "U": "unclear"}
CATS = ["bigGame", "bear", "turkey", "uplandBirds", "smallGame", "furbearers"]
VERSION = "2026-10-16"

app_states = []
for r in rows:
    code = CODES[r["state"].replace(" ", "")]
    status, hours, cats = N[code]
    r["code"], r["status"], r["hours"], r["cats"] = code, status, hours, cats
    label = STATUS_LABEL[status]
    if code == "FL": label = "Legal, deer only, no permit"
    r["label"] = label
    app_states.append({
        "code": code, "name": r["state"], "status": status, "statusLabel": label,
        "reportWithinHours": hours,
        "categories": {k: YN[c] for k, c in zip(CATS, cats)},
        "saleOfParts": r["sale_of_parts"], "howTo": r["permit_process"], "timing": r["timing"],
        "excluded": r["excluded_species"], "gameBirdsNote": r["game_birds"],
        "otherRestrictions": r["other_restrictions"], "citation": r["statute_or_reg"],
        "agency": r["agency"], "url": r["source_url"], "confidence": r["confidence"],
    })
json.dump({"version": VERSION, "states": app_states}, open(APPJSON, "w"), indent=1)

wb = Workbook()
ws = wb.active; ws.title = "State regs"
cols = [("State", "state", 14), ("Code", "code", 6), ("Bottom line", "label", 20), ("Report / permit within (hrs)", "hours", 12),
        ("Big game", 0, 9), ("Bear", 1, 9), ("Wild turkey", 2, 9), ("Other upland birds", 3, 10), ("Small game", 4, 9), ("Furbearers", 5, 10),
        ("Confidence", "confidence", 11), ("Agency status (as researched)", "legal_status", 22),
        ("Game mammals", "game_mammals", 60), ("Game birds", "game_birds", 60), ("How to (permit / notify)", "permit_process", 60),
        ("Timing", "timing", 40), ("Excluded species", "excluded_species", 45), ("Selling parts", "sale_of_parts", 45),
        ("Other restrictions", "other_restrictions", 50), ("Law / regulation", "statute_or_reg", 30), ("Agency", "agency", 30),
        ("Source", "source_url", 40), ("Notes", "notes", 60)]
ws.append([c[0] for c in cols])
fills = {"Y": "C6EFCE", "N": "FFC7CE", "U": "FFEB9C"}
bl = {"open": "C6EFCE", "notify": "C6EFCE", "permit": "FFEB9C", "discretion": "FFEB9C", "prohibited": "FFC7CE"}
for r in rows:
    vals = []
    for _, key, _ in cols:
        if isinstance(key, int): vals.append(YN[r["cats"][key]].capitalize())
        else:
            v = r.get(key); vals.append(", ".join(v) if isinstance(v, list) else v)
    ws.append(vals)
    i = ws.max_row
    ws.cell(i, 3).fill = PatternFill("solid", fgColor=bl[r["status"]])
    for j in range(6):
        ws.cell(i, 5 + j).fill = PatternFill("solid", fgColor=fills[r["cats"][j]])
    src = ws.cell(i, 22)
    if src.value and str(src.value).startswith("http"):
        src.hyperlink = src.value; src.font = Font(color="0563C1", underline="single")
for j, (_, _, w) in enumerate(cols, 1):
    ws.column_dimensions[get_column_letter(j)].width = w
for row in ws.iter_rows(min_row=2):
    for c in row: c.alignment = Alignment(wrap_text=True, vertical="top")
for c in ws[1]:
    c.font = Font(bold=True, color="FFFFFF"); c.fill = PatternFill("solid", fgColor="333333")
    c.alignment = Alignment(wrap_text=True, vertical="center")
ws.freeze_panes = "C2"; ws.auto_filter.ref = ws.dimensions

rm = wb.create_sheet("Read me", 0)
lines = [
 ["Roadkill salvage rules, all 50 states"],
 [f"Researched {VERSION} from state agency pages, statutes and regulations. Summary only, not legal advice."],
 [],
 ["Federal rule that applies everywhere"],
 ["Migratory birds (ducks, geese, doves, woodcock, cranes, raptors, songbirds) are protected by the Migratory Bird Treaty Act. Possessing one, or its feathers, without a federal permit is illegal in every state, whatever state law says."],
 [],
 ["Bottom line column"],
 ["Legal, no permit: keep it, follow any notice rule (green)"],
 ["Legal, must report: keep it, but report to the agency or police within the stated window (green)"],
 ["Legal, permit required: get a permit, tag or officer authorization, usually before or within 24 hours of possession (yellow)"],
 ["Officer's call: no general program; only a warden or officer can release it (yellow)"],
 ["Not allowed: salvage is illegal (red)"],
 [],
 ["Species columns"],
 ["Yes = expressly allowed; No = not covered or excluded; Unclear = not confirmed in official sources, so call the agency first."],
 [],
 ["States to double-check (Low confidence)"],
 [", ".join(r["state"] for r in rows if r["confidence"] == "Low")],
 [],
 ["Selling parts"],
 ["Almost every state bars selling roadkill meat. A few allow selling hides or antlers (e.g., Nebraska; Idaho for most non-meat parts). See the Selling parts column before building any buy/sell feature."],
]
for l in lines: rm.append(l)
for i in (1, 4, 7, 14, 17, 20): rm.cell(i, 1).font = Font(bold=True, size=13 if i == 1 else 11)
rm.column_dimensions["A"].width = 120
for row in rm.iter_rows():
    for c in row: c.alignment = Alignment(wrap_text=True, vertical="top")
wb.save(XLSX)
from collections import Counter
print(Counter(r["status"] for r in rows)); print(Counter(r["confidence"] for r in rows))
