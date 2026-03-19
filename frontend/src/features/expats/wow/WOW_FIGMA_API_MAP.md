# WOW comparison screen — Figma sections → APIs

| Figma section | Data source | API / endpoint |
|---------------|-------------|----------------|
| **Title** (“From X To Y”) | Current + target labels | `POST /relocation/cities/compare` → `currentCity`, `targetCity`; fallback: funnel `currentCityName` / `targetCityName` |
| **Subtitle** (priorities copy) | Narrative summary | Compare: `priorityAlignment.summary`, `overallImpact.summary`; scoring: `insights.suggestions[0]` |
| **Better match card** (trophy, target city, bullets) | Why target fits | Compare: `tradeOffs[]` (messages), `overallImpact.compatibilityLevelTarget`, scores |
| **City hero images** | Place labels | UI-only banners; optional future: city image URL from catalog |
| **Macro comparison table** (6 rows) | Per-macro scores | Compare: `macroareeComparison[]` (`macroarea`, `currentCityScore`, `targetCityScore`, `direction`) |
| **Monthly life simulation** | EUR costs + savings | Compare: `economicImpact` (`currentCityCost`, `targetCityCost`, `monthlySaving`, `summary`) |
| **Compatibility radar** | 6 macro % | `POST /relocation/city-scoring/compute` → `scores[]` for target city → `radarValues` |
| **Target city fit / readiness** | Overall fit | Compare: `overallImpact.scoreTargetCity`; scoring: `scoreTotal`, `compatibilityLevel` |
| **Districts (both cities)** | Neighborhood list | `GET /relocation/cities/{id}` → `districts` (per resolved city UUID) |
| **Structural / “90-day plan” bullets** | Tips | Scoring: `budgetCheck.suggestions`, `insights.strengths`, `insights.warnings` |
| **Community / mentors / counts** | Social proof | **Not in API yet** — placeholder CTA until mentor/community endpoints exist |
| **Algorithm line** | Version | Compare: `algorithmVersion`; scoring: `algorithmVersion` |

### Implementation status (Figma alignment)

- **Implemented with API:** Title, subtitle, better match card, neighborhoods (districts), 90-Day Structural Plan, city banners, macro table, monthly + yearly simulation, compatibility radar, relocation readiness score + summary, algorithm version. Daily life difference uses `tradeOffs` (improvement = target upsides, decline = current downsides).
- **Placeholder (no API):** Community / mentors (counts, avatars). Country/language selector in topbar is UI-only.
- **Config fix:** Backend uses config key `city_scoring_v1` (see RelocationScoringConfigKeys); compute/compare 500 if that row is missing.

## Call order (anonymous WOW)

1. Session: `POST /expats/anonymous/sessions`, store token.
2. Onboarding: `GET /relocation/onboarding`, `GET /relocation/onboarding/status`, `GET /relocation/activation-state`.
3. **Compute** (required for radar + budget insights): `POST /relocation/city-scoring/compute` — needs active snapshot + scoring config row `city_scoring_v1`.
4. **Compare** (required for table + economy): `POST /relocation/cities/compare` with both city UUIDs.
5. City detail (districts): `GET /relocation/cities/{id}` for current and target IDs from compare response.

## Backend scoring config

Engine loads config key **`city_scoring_v1`** (`relocation_scoring_config`). If missing, compute returns 500.
