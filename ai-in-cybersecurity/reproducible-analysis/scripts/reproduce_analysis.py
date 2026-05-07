#!/usr/bin/env python3
import csv
import json
import subprocess
import sys
from collections import Counter
from pathlib import Path

import generate_figures


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "research" / "data"
ARTIFACTS_DIR = ROOT / "research" / "artifacts"
LATEX_FIG_DIR = ROOT / "publish" / "tex" / "figures"
REGISTRY_PATH = ROOT / "manuscript" / "shared" / "references-registry.md"
PAPER_MD_PATH = ROOT / "publish" / "markdown" / "paper.md"
VERIFY_SCRIPT = ROOT / "tools" / "verify.sh"
BUILD_SCRIPT = ROOT / "tools" / "build.sh"

EVIDENCE_MATRIX_COLUMNS = [
    "claim_id",
    "section",
    "claim_text",
    "source_key",
    "source_type",
    "verification_status",
    "accessed_on",
    "direct_or_inferred",
    "notes",
]
EVIDENCE_MAP_COLUMNS = [
    "task_class",
    "evidence_strength",
    "source_mix",
    "operational_maturity",
    "governance_burden",
    "best_supported_mode",
    "supporting_claim_ids",
    "notes",
]
VALID_SOURCE_TYPES = {
    "peer_reviewed",
    "official_advisory",
    "official_standard",
    "official_regulation",
    "vendor_official",
    "official_framework",
    "preprint_survey",
    "book",
}
VALID_VERIFICATION_STATUS = {"verified"}
VALID_DIRECTNESS = {"direct", "inferred"}
VALID_EVIDENCE_STRENGTH = {"weak", "moderate", "moderate_to_strong"}
VALID_GOVERNANCE_BURDEN = {"high", "very_high"}
VALID_OPERATIONAL_MATURITY = {
    "in_production",
    "experimental",
    "early_real_use",
    "bounded_use",
    "not_supported",
}
VALID_SUPPORTED_MODE = {
    "reviewed_assistance",
    "analyst_assist",
    "operator_plus_tools",
    "validated_discovery",
    "collaborative_workflow",
    "escalation_only",
}


def load_csv(path):
    with path.open(newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


def validate_columns(rows, expected_columns, path, errors):
    if not rows:
        errors.append(f"{path.name}: file is empty")
        return
    actual = list(rows[0].keys())
    if actual != expected_columns:
        errors.append(
            f"{path.name}: expected columns {expected_columns}, found {actual}"
        )


def validated_registry_keys(path):
    keys = set()
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line.startswith("| `"):
            continue
        parts = [part.strip() for part in line.split("|")]
        if len(parts) < 4:
            continue
        key = parts[1].strip("`")
        status = parts[2]
        if status == "verified":
            keys.add(key)
    return keys


def validate_evidence_matrix(rows, registry_keys, errors):
    claim_ids = set()
    source_type_counts = Counter()
    directness_counts = Counter()

    for idx, row in enumerate(rows, start=2):
        claim_id = row["claim_id"].strip()
        if not claim_id:
            errors.append(f"evidence-matrix.csv:{idx}: missing claim_id")
        elif claim_id in claim_ids:
            errors.append(f"evidence-matrix.csv:{idx}: duplicate claim_id {claim_id}")
        else:
            claim_ids.add(claim_id)

        source_key = row["source_key"].strip()
        if source_key not in registry_keys:
            errors.append(
                f"evidence-matrix.csv:{idx}: source_key {source_key} is not marked verified"
            )

        source_type = row["source_type"].strip()
        if source_type not in VALID_SOURCE_TYPES:
            errors.append(
                f"evidence-matrix.csv:{idx}: invalid source_type {source_type}"
            )
        else:
            source_type_counts[source_type] += 1

        verification_status = row["verification_status"].strip()
        if verification_status not in VALID_VERIFICATION_STATUS:
            errors.append(
                f"evidence-matrix.csv:{idx}: invalid verification_status {verification_status}"
            )

        directness = row["direct_or_inferred"].strip()
        if directness not in VALID_DIRECTNESS:
            errors.append(
                f"evidence-matrix.csv:{idx}: invalid direct_or_inferred {directness}"
            )
        else:
            directness_counts[directness] += 1

    return claim_ids, source_type_counts, directness_counts


def validate_evidence_map(rows, claim_ids, errors):
    task_rows = []
    for idx, row in enumerate(rows, start=2):
        task_class = row["task_class"].strip()

        evidence_strength = row["evidence_strength"].strip()
        if evidence_strength not in VALID_EVIDENCE_STRENGTH:
            errors.append(
                f"evidence-map.csv:{idx}: invalid evidence_strength {evidence_strength}"
            )

        operational_maturity = row["operational_maturity"].strip()
        if operational_maturity not in VALID_OPERATIONAL_MATURITY:
            errors.append(
                f"evidence-map.csv:{idx}: invalid operational_maturity {operational_maturity}"
            )

        governance_burden = row["governance_burden"].strip()
        if governance_burden not in VALID_GOVERNANCE_BURDEN:
            errors.append(
                f"evidence-map.csv:{idx}: invalid governance_burden {governance_burden}"
            )

        supported_mode = row["best_supported_mode"].strip()
        if supported_mode not in VALID_SUPPORTED_MODE:
            errors.append(
                f"evidence-map.csv:{idx}: invalid best_supported_mode {supported_mode}"
            )

        supporting_claim_ids = [
            claim_id.strip()
            for claim_id in row["supporting_claim_ids"].split(";")
            if claim_id.strip()
        ]
        if not supporting_claim_ids:
            errors.append(f"evidence-map.csv:{idx}: missing supporting_claim_ids")
        for claim_id in supporting_claim_ids:
            if claim_id not in claim_ids:
                errors.append(
                    f"evidence-map.csv:{idx}: missing claim reference {claim_id}"
                )

        task_rows.append(
            {
                "task_class": task_class,
                "evidence_strength": evidence_strength,
                "operational_maturity": operational_maturity,
                "governance_burden": governance_burden,
                "best_supported_mode": supported_mode,
                "supporting_claim_ids": supporting_claim_ids,
            }
        )
    return task_rows


def ensure_paper_md():
    if PAPER_MD_PATH.exists():
        return
    subprocess.run([str(BUILD_SCRIPT)], cwd=ROOT, check=True)


def run_verify(errors):
    result = subprocess.run(
        [str(VERIFY_SCRIPT)],
        cwd=ROOT,
        capture_output=True,
        text=True,
    )
    stdout = result.stdout.strip()
    stderr = result.stderr.strip()
    if result.returncode != 0:
        if stdout:
            errors.append(f"verify.sh failed: {stdout}")
        if stderr:
            errors.append(f"verify.sh stderr: {stderr}")
    return {
        "exit_code": result.returncode,
        "stdout": stdout,
        "stderr": stderr,
    }


def write_report(report):
    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
    json_path = ARTIFACTS_DIR / "reproducibility-report.json"
    md_path = ARTIFACTS_DIR / "reproducibility-report.md"

    json_path.write_text(
        json.dumps(report, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )

    lines = [
        "# Reproducibility Report",
        "",
        f"- Status: {'passed' if report['validation_passed'] else 'failed'}",
        f"- Verified claims: {report['verified_claim_count']}",
        f"- Task classes: {report['task_class_count']}",
        "",
        "## Source Type Counts",
        "",
    ]
    for source_type, count in report["source_type_counts"].items():
        lines.append(f"- `{source_type}`: {count}")

    lines.extend(
        [
            "",
            "## Task-Level Summary",
            "",
        ]
    )
    for task in report["task_classifications"]:
        lines.append(
            "- `{task_class}`: evidence=`{evidence_strength}`, maturity=`{operational_maturity}`, governance=`{governance_burden}`, mode=`{best_supported_mode}`".format(
                **task
            )
        )

    lines.extend(
        [
            "",
            "## Generated Assets",
            "",
        ]
    )
    for asset in report["generated_assets"]:
        lines.append(f"- `{asset}`")

    if report["errors"]:
        lines.extend(["", "## Errors", ""])
        for error in report["errors"]:
            lines.append(f"- {error}")

    md_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return json_path, md_path


def main():
    errors = []
    evidence_matrix_path = DATA_DIR / "evidence-matrix.csv"
    evidence_map_path = DATA_DIR / "evidence-map.csv"

    evidence_rows = load_csv(evidence_matrix_path)
    evidence_map_rows = load_csv(evidence_map_path)
    validate_columns(evidence_rows, EVIDENCE_MATRIX_COLUMNS, evidence_matrix_path, errors)
    validate_columns(evidence_map_rows, EVIDENCE_MAP_COLUMNS, evidence_map_path, errors)

    registry_keys = validated_registry_keys(REGISTRY_PATH)
    claim_ids, source_type_counts, directness_counts = validate_evidence_matrix(
        evidence_rows, registry_keys, errors
    )
    task_rows = validate_evidence_map(evidence_map_rows, claim_ids, errors)

    ensure_paper_md()
    verify_result = run_verify(errors)

    generate_figures.main()

    report = {
        "validation_passed": not errors,
        "verified_claim_count": len(evidence_rows),
        "task_class_count": len(task_rows),
        "source_type_counts": dict(sorted(source_type_counts.items())),
        "directness_counts": dict(sorted(directness_counts.items())),
        "task_classifications": task_rows,
        "generated_assets": [
            str((LATEX_FIG_DIR / "fig1_evidence_map.tex").relative_to(ROOT)),
            str((LATEX_FIG_DIR / "fig2_source_mix.tex").relative_to(ROOT)),
        ],
        "verify_script": verify_result,
        "errors": errors,
    }
    json_path, md_path = write_report(report)

    print("Reproducibility summary")
    print(f"- Status: {'passed' if report['validation_passed'] else 'failed'}")
    print(f"- Verified claims: {report['verified_claim_count']}")
    print(f"- Task classes: {report['task_class_count']}")
    print("- Source types:")
    for source_type, count in report["source_type_counts"].items():
        print(f"  - {source_type}: {count}")
    print("- Generated assets:")
    for asset in report["generated_assets"]:
        print(f"  - {asset}")
    print(f"- JSON report: {json_path.relative_to(ROOT)}")
    print(f"- Markdown report: {md_path.relative_to(ROOT)}")

    if errors:
        print("- Errors:")
        for error in errors:
            print(f"  - {error}")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
