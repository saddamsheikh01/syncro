# Sprint 1 – Expats Funnel + Onboarding + City Scoring

## Backend – Included Features (reference)

| Feature | Status |
|--------|--------|
| Expats Landing Page (backend logic) | ✅ |
| Micro-onboarding without registration | ✅ |
| Anonymous user persistence | ✅ |
| Anonymous → registered user conversion | ✅ |
| Post-registration Activation Page | ✅ |
| Relocation data collection | ✅ |
| Progressive data saving | ✅ |
| Onboarding progress status | ✅ |
| Relocation profile snapshot | ✅ |
| City compatibility calculation | ✅ |
| Score breakdown (cost of living, work, social, stress) | ✅ |
| Compatibility history tracking | ✅ |

## Frontend – Must Be Live by End of Sprint 1

| Page / Flow | Route / Area | Status |
|-------------|--------------|--------|
| Expats Landing Page | `/expats` | ✅ |
| Micro-onboarding (no login) | `/expats/funnel/1` … `/expats/funnel/10` | ✅ |
| Basic compatibility results (WOW) | `/expats/wow` | ✅ |
| Activation Page | `/expats/activation` | ✅ |
| Registered onboarding flow | `/expats/onboarding-preferences` (post-login) | ✅ |
| City compatibility screen with breakdown | WOW page (comparison + economic impact + CTAs) | ✅ |

## Translations – Sprint 1 Requirement

**Requirement:** Every page must be translated into all languages available on Syncro: **Italian, Spanish, Portuguese, French, Albanian** (and English).

| Locale | Code | Phrases file | Expats keys |
|--------|------|--------------|-------------|
| English | en | phrases.en.json | ✅ |
| Italian | it | phrases.it.json | ✅ |
| Spanish | es | phrases.es.json | ✅ |
| Portuguese | pt | phrases.pt.json | ✅ |
| French | fr | phrases.fr.json | ✅ |
| Albanian | sq | phrases.sq.json | ✅ |

### Pages to translate

- **Expats Landing** – hero, pain, solution, features, CTAs, disclaimers
- **Funnel** – step titles, option labels, Back / Continue / Generate My Strategy, Step X Of Y
- **WOW (compatibility results)** – title, subtitle, section titles, macroarea labels, economic impact, CTAs (Build My X Relocation Plan, Compare Another City)
- **Activation** – EXPATS MODE banner, variant titles (Planning Move / Recently Moved / Already There), strategy months, professionals, starter kit, events
- **Registered onboarding** – any copy on `/expats/onboarding-preferences`

### Implementation

- Use `useT()` from `@/hooks/i18n/useT` and `t("key")` (or `t("key", { param: value })`) in all Expats components.
- Add phrase keys to `frontend/src/i18n/messages/phrases.{en,it,es,pt,fr,sq}.json`.
- Keys follow existing convention: English string as key; other locales provide translated value.

---

*Last updated: Sprint 1 scope.*
