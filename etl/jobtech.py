"""JobTech (Arbetsförmedlingen) client — open job ads per occupation field × kommun.

This is the dual-career differentiator: how many jobs exist for each person's field,
in each commune. Free, no key. Docs: https://jobsearch.api.jobtechdev.se/

Approach (few calls, full coverage): one JobSearch call per municipality with
`stats=occupation-field` returns the open-ad count per field for that kommun. The
taxonomy gives the JobTech municipality id ↔ SCB kommunkod (lau-2) mapping.

Note: JobSearch returns a LIVE snapshot of currently open ads, not a historical total.
"""

from __future__ import annotations

import time

import httpx

TAXONOMY = "https://taxonomy.api.jobtechdev.se/v1/taxonomy"
JOBSEARCH = "https://jobsearch.api.jobtechdev.se/search"


def fetch_municipality_map(client: httpx.Client) -> dict[str, dict]:
    """{ scb_kommunkod: {"id": jobtech_concept_id, "label": name} } for all 290."""
    r = client.get(f"{TAXONOMY}/specific/concepts/municipality")
    r.raise_for_status()
    out = {}
    for c in r.json():
        scb = c.get("taxonomy/lau-2-code-2015")
        if scb:
            out[scb] = {"id": c["taxonomy/id"], "label": c["taxonomy/preferred-label"]}
    return out


def fetch_occupation_fields(client: httpx.Client) -> dict[str, str]:
    """{ occupation_field_concept_id: label } — the 21 fields."""
    r = client.get(f"{TAXONOMY}/main/concepts", params={"type": "occupation-field"})
    r.raise_for_status()
    return {c["taxonomy/id"]: c["taxonomy/preferred-label"] for c in r.json()}


def fetch_field_counts(client: httpx.Client, jobtech_municipality_id: str) -> dict[str, int]:
    """Open-ad count per occupation field for one municipality.

    Returns { occupation_field_concept_id: count }.
    """
    r = client.get(
        JOBSEARCH,
        params={
            "municipality": jobtech_municipality_id,
            "limit": 0,
            "stats": "occupation-field",
            "stats.limit": 30,  # API max; there are only 21 fields
        },
    )
    r.raise_for_status()
    stats = r.json().get("stats", [])
    field_stat = next((s for s in stats if s["type"] == "occupation-field"), None)
    if not field_stat:
        return {}
    return {v["concept_id"]: v["count"] for v in field_stat["values"]}


def fetch_all_field_counts(
    client: httpx.Client, muni_map: dict[str, dict], pause: float = 0.1
) -> dict[str, dict[str, int]]:
    """{ scb_kommunkod: { field_id: count } } across all municipalities.

    ~290 polite calls. `pause` keeps us friendly to the free endpoint.
    """
    out: dict[str, dict[str, int]] = {}
    for i, (scb, info) in enumerate(sorted(muni_map.items()), 1):
        try:
            out[scb] = fetch_field_counts(client, info["id"])
        except httpx.HTTPError as e:
            print(f"  ! {scb} {info['label']}: {e}")
            out[scb] = {}
        if i % 50 == 0:
            print(f"  jobtech: {i}/{len(muni_map)} municipalities")
        time.sleep(pause)
    return out
