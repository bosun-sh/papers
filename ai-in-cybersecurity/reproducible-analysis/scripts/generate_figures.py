#!/usr/bin/env python3
import csv
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "research" / "data"
FIG_DIR = ROOT / "publish" / "tex" / "figures"


def load_csv(path):
    with path.open(newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def task_label(value):
    return {
        "secure_code_generation_risk": "Secure code\\\\generation risk",
        "vulnerability_management": "Vulnerability\\\\management",
        "penetration_testing_workflows": "Penetration testing\\\\workflows",
        "vulnerability_discovery_and_disclosure": "Vulnerability discovery\\\\and disclosure",
        "incident_response_summarization": "Incident response\\\\summarization",
        "autonomous_security_decision_making": "Autonomous security\\\\decisions",
    }[value]


def mode_label(value):
    return {
        "reviewed_assistance": "Reviewed assistance",
        "analyst_assist": "Analyst assist",
        "operator_plus_tools": "Operator + tools",
        "validated_discovery": "Validated discovery",
        "collaborative_workflow": "Collaborative workflow",
        "escalation_only": "Escalation only",
    }[value]


def mode_color(value):
    return {
        "reviewed_assistance": "blue!70!black",
        "analyst_assist": "cyan!70!black",
        "operator_plus_tools": "green!60!black",
        "validated_discovery": "green!45!black",
        "collaborative_workflow": "orange!85!black",
        "escalation_only": "red!75!black",
    }[value]


def evidence_x(value):
    return {
        "weak": 1.0,
        "moderate": 2.0,
        "moderate_to_strong": 2.8,
    }[value]


def governance_y(value):
    return {
        "high": 2.0,
        "very_high": 2.75,
    }[value]


def make_evidence_map():
    rows = load_csv(DATA_DIR / "evidence-map.csv")
    ordered_rows = sorted(
        rows,
        key=lambda r: (
            governance_y(r["governance_burden"]),
            evidence_x(r["evidence_strength"]),
        ),
        reverse=True,
    )
    lines = [
        r"\begin{tikzpicture}[x=1cm,y=1cm,font=\small]",
        r"\fill[green!5] (0.9,-0.1) rectangle (4.3,-6.25);",
        r"\fill[orange!5] (4.3,-0.1) rectangle (6.6,-6.25);",
        r"\draw[gray!80, line width=0.5pt] (0.9,-0.1) rectangle (10.9,-6.25);",
        r"\draw[gray!60] (4.3,-0.1) -- (4.3,-6.25);",
        r"\draw[gray!60] (6.6,-0.1) -- (6.6,-6.25);",
        r"\draw[gray!60] (8.75,-0.1) -- (8.75,-6.25);",
        r"\draw[gray!60] (10.0,-0.1) -- (10.0,-6.25);",
        r"\node[anchor=west, font=\bfseries] at (0.0,0.32) {Task class};",
        r"\node[font=\scriptsize\bfseries] at (2.6,0.32) {Supported deployment posture};",
        r"\node[font=\scriptsize\bfseries] at (5.45,0.32) {Evidence};",
        r"\node[font=\scriptsize\bfseries] at (7.68,0.32) {Governance};",
        r"\node[font=\scriptsize\bfseries] at (9.38,0.32) {Evidence};",
        r"\node[font=\scriptsize\bfseries] at (10.45,0.32) {Gov.};",
    ]

    for idx, row in enumerate(ordered_rows):
        y = -0.65 - idx * 0.95
        evidence = row["evidence_strength"]
        governance = row["governance_burden"]
        mode = row["best_supported_mode"]
        evidence_label = {
            "weak": "Weak",
            "moderate": "Moderate",
            "moderate_to_strong": "Moderate to strong",
        }[evidence]
        gov_label = {
            "high": "High",
            "very_high": "Very high",
        }[governance]
        mode_text = {
            "reviewed_assistance": "Reviewed assistance",
            "analyst_assist": "Analyst assist",
            "operator_plus_tools": "Operator + tools",
            "validated_discovery": "Validated discovery",
            "collaborative_workflow": "Collaborative workflow",
            "escalation_only": "Escalation only",
        }[mode]
        mode_fill = {
            "reviewed_assistance": "blue!7",
            "analyst_assist": "cyan!9",
            "operator_plus_tools": "green!8",
            "validated_discovery": "green!14",
            "collaborative_workflow": "orange!12",
            "escalation_only": "red!10",
        }[mode]
        lines.append(rf"\node[anchor=west, align=left, text width=3.7cm, font=\small] at (0.0,{y:.2f}) {{{task_label(row['task_class'])}}};")
        lines.append(rf"\node[draw, rounded corners=2pt, fill={mode_fill}, text width=3.2cm, minimum height=0.7cm, align=center, font=\scriptsize\bfseries] at (2.6,{y:.2f}) {{{mode_text}}};")
        lines.append(rf"\node[draw, rounded corners=2pt, fill=green!15, minimum width=1.9cm, minimum height=0.7cm, align=center, font=\scriptsize\bfseries] at (5.45,{y:.2f}) {{{evidence_label}}};")
        lines.append(rf"\node[draw, rounded corners=2pt, fill=orange!15, minimum width=1.9cm, minimum height=0.7cm, align=center, font=\scriptsize\bfseries] at (7.68,{y:.2f}) {{{gov_label}}};")
        lines.append(rf"\node[draw, rounded corners=2pt, fill=green!35, minimum width=1.0cm, minimum height=0.48cm, font=\scriptsize\bfseries] at (9.38,{y:.2f}) {{{'X' if evidence == 'moderate_to_strong' else ''}}};")
        lines.append(rf"\node[draw, rounded corners=2pt, fill=orange!35, minimum width=1.0cm, minimum height=0.48cm, font=\scriptsize\bfseries] at (10.45,{y:.2f}) {{{'X' if governance == 'very_high' else ''}}};")

    lines.append(r"\end{tikzpicture}")
    (FIG_DIR / "fig1_evidence_map.tex").write_text("\n".join(lines) + "\n", encoding="utf-8")


def make_source_mix():
    rows = load_csv(DATA_DIR / "evidence-matrix.csv")
    counts = Counter(row["source_type"] for row in rows)
    order = [
        "peer_reviewed",
        "official_advisory",
        "official_standard",
        "official_regulation",
        "vendor_official",
        "official_framework",
        "preprint_survey",
        "book",
    ]
    labels = {
        "peer_reviewed": "Peer\\\\reviewed",
        "official_advisory": "Official\\\\advisory",
        "official_standard": "Official\\\\standard",
        "official_regulation": "Official\\\\regulation",
        "vendor_official": "Vendor\\\\official",
        "official_framework": "Official\\\\framework",
        "preprint_survey": "Preprint\\\\survey",
        "book": "Book",
    }
    colors = {
        "peer_reviewed": "teal!70!black",
        "official_advisory": "blue!70!black",
        "official_standard": "violet!70!black",
        "official_regulation": "violet!55!black",
        "vendor_official": "orange!85!black",
        "official_framework": "cyan!70!black",
        "preprint_survey": "gray!65!black",
        "book": "gray!85!black",
    }
    max_count = max(counts.values())
    lines = [
        r"\begin{tikzpicture}[x=1.35cm,y=0.55cm,font=\small]",
        r"\draw[->, thick] (0.6,0.5) -- (8.8,0.5) node[below right] {Source type};",
        rf"\draw[->, thick] (0.7,0.4) -- (0.7,{max_count + 1.3}) node[above left] {{Claim count}};",
    ]
    for y in range(max_count + 1):
        lines.append(rf"\draw[densely dashed, gray!60] (0.7,{y + 0.5:.1f}) -- (8.6,{y + 0.5:.1f});")
        lines.append(rf"\node[left, font=\scriptsize] at (0.7,{y + 0.5:.1f}) {{{y}}};")

    x = 1
    for key in order:
        if not counts.get(key):
            continue
        val = counts[key]
        lines.append(rf"\fill[{colors[key]}] ({x:.2f},0.5) rectangle ({x + 0.72:.2f},{val + 0.5:.2f});")
        lines.append(rf"\node[font=\scriptsize\bfseries] at ({x + 0.36:.2f},{val + 0.75:.2f}) {{{val}}};")
        lines.append(rf"\node[align=center, anchor=north, font=\scriptsize] at ({x + 0.36:.2f},0.28) {{{labels[key]}}};")
        x += 0.95

    lines.append(r"\end{tikzpicture}")
    (FIG_DIR / "fig2_source_mix.tex").write_text("\n".join(lines) + "\n", encoding="utf-8")


def main():
    FIG_DIR.mkdir(parents=True, exist_ok=True)
    make_evidence_map()
    make_source_mix()


if __name__ == "__main__":
    main()
