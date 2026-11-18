# Niger Delta WQ — Technical Architecture and Source-Code Inventory

**Repository:** https://github.com/gesiyejohn-cmyk/niger-delta-wq  
**Inspected branch:** `feature/ert-geological-interpretation`  
**Inspection basis:** GitHub recursive tree and selected source-file review on 18 November 2026.  
**Status:** Initial source inventory; not a complete audit of every module, runtime dependency or historical version.

> This document describes files visible in the inspected branch. It does not claim that every product feature is complete, scientifically validated or production-ready. Recheck this inventory after material architectural changes.

## 1. Product overview

The repository README describes Niger Delta WQ as an offline-capable water-quality assessment and groundwater vulnerability application intended to support environmental monitoring and research in Nigeria's Niger Delta region.

The README identifies React, Vite, JavaScript, Capacitor and Electron as the technology stack. The inspected source includes application pages, calculation/interpretation engines, browser storage adapters, automated tests and GitHub Actions workflows.

## 2. High-level architecture

```text
User interface (React pages)
        |
        +--> Scientific / geospatial engines
        |      - coordinates
        |      - WQI
        |      - vulnerability
        |      - geophysics / VES / ERT
        |      - geological interpretation
        |
        +--> Persistence and backup
        |      - IndexedDB database
        |      - domain-specific storage adapters
        |      - backup / restore
        |
        +--> Platform / delivery
               - Web build and tests
               - Android via Capacitor
               - Windows desktop via Electron
               - GitHub Actions CI workflows
```

This is a conceptual map inferred from the tracked source paths and inspected imports. It is not a formal runtime/data-flow verification.

## 3. Source inventory

### 3.1 Application entry and navigation

| File | Observed responsibility |
|---|---|
| `upgrade/src/App.jsx` | React route composition and top-level navigation. It imports and routes to sample, map, import, settings, reports, geophysics, analytics, backup, vulnerability and WQI pages. |

**Inventory limitation:** Some page imports visible in `App.jsx` (including Dashboard, SampleEditor, SampleDetail, MapPage, ImportPage, SettingsPage and ReportsPage) were not present as separate files in the recursive tree returned for this branch. Confirm whether they are supplied by another branch, generated source, omitted package/archive or an incomplete branch snapshot before claiming a complete source package.

### 3.2 Scientific and geospatial engine modules

| File | Observed / named responsibility |
|---|---|
| `upgrade/src/engine/coordinates.js` | Coordinate parsing/conversion and validation logic. |
| `upgrade/src/engine/wqi.js` | Water Quality Index calculation logic. |
| `upgrade/src/engine/vulnerability.js` | Groundwater vulnerability calculation logic. README identifies DRASTIC methods; confirm method implementation and parameter conventions through scientific review. |
| `upgrade/src/engine/geophysics.js` | Geophysical processing / interpretation logic. |
| `upgrade/src/engine/ert.js` | ERT-specific processing logic. |
| `upgrade/src/engine/ertIntegration.js` | ERT integration helper logic. |
| `upgrade/src/engine/geologicalInterpretation.js` | Geological interpretation validation and model logic. |
 
### 3.3 User-interface pages

| File | Observed / named responsibility |
|---|---|
| `upgrade/src/pages/AnalyticsPage.jsx` | Analytics interface. |
| `upgrade/src/pages/CoordinateFields.jsx` | Coordinate-entry interface component. |
| `upgrade/src/pages/DataBackupPage.jsx` | Backup and restore interface. |
| `upgrade/src/pages/ERTTomogram.jsx` | ERT tomogram interface. |
| `upgrade/src/pages/GeologicalInterpretationEditor.jsx` | Manual geological interpretation editor linked to ERT data. |
| `upgrade/src/pages/GeophysicsPage.jsx` | Geophysics / VES / ERT workspace. |
| `upgrade/src/pages/VESInterpretation.jsx` | VES interpretation interface. |
| `upgrade/src/pages/VulnerabilityPage.jsx` | Groundwater vulnerability interface. |
| `upgrade/src/pages/WQIPage.jsx` | WQI assessment interface. |

The responsibilities above are based on filenames and reviewed imports/source context. Detailed behaviour should be verified against the full implementation and tests.

### 3.4 Storage and persistence

| File | Observed responsibility |
|---|---|
| `upgrade/src/storage/db.js` | Opens IndexedDB database `niger-delta-wq`, schema version 8 in the inspected file, and creates object stores for samples, settings, sync queue, VES, ERT, vulnerability and WQI records. |
| `upgrade/src/storage/backup.js` | Backup / restore functions. |
| `upgrade/src/storage/geophysics.js` | Geophysics-related persistence functions. |
| `upgrade/src/storage/vulnerability.js` | Vulnerability-record persistence functions. |
| `upgrade/src/storage/wqi.js` | WQI assessment persistence functions. |

Storage schema changes require migration tests and careful preservation of existing user records. Do not clear application data as a debugging shortcut.

### 3.5 Automated tests

Tracked test files in the inspected tree:

- `upgrade/tests/android-emulator-script.test.js`
- `upgrade/tests/backup.test.js`
- `upgrade/tests/coordinates.test.js`
- `upgrade/tests/ert-integration-script.test.js`
- `upgrade/tests/ert.test.js`
- `upgrade/tests/geologicalInterpretation.test.js`
- `upgrade/tests/geophysics.test.js`
- `upgrade/tests/indexeddb-migration.test.js`
- `upgrade/tests/storage-integration.test.js`
- `upgrade/tests/vulnerability.test.js`
- `upgrade/tests/wqi-storage.test.js`
- `upgrade/tests/wqi.test.js`

Presence of a test file does not mean all test cases pass or that the module is fully covered. Record actual run IDs, commit SHAs and results in the milestone register.

### 3.6 Build, automation and release support

| File | Observed responsibility |
|---|---|
| `.github/workflows/build.yml` | Build automation workflow. |
| `.github/workflows/inspect-source.yml` | Source inspection workflow. |
| `.github/workflows/upgrade-build.yml` | Upgrade build / platform artifact workflow. |
| `upgrade-build.yml` | Additional build workflow file at repository root. |
| `upgrade/scripts/android-emulator-boot-and-smoke-test.sh` | Android emulator boot and smoke-test automation. |
| `upgrade/scripts/android-emulator-smoke-test.sh` | Android emulator smoke-test automation. |
| `upgrade/scripts/integrate-ert-tomogram.mjs` | ERT tomogram integration script. |

### 3.7 Other tracked repository assets

- `README.md`: product summary, stated features, technology stack and scientific-use caution.
- `NDWQ-Source-Compact.zip`: compact source archive tracked in the branch. Its contents and correspondence to the live tree must be verified before treating it as a complete release source archive.
- `docs/DEVICE-ACCEPTANCE-AND-RELEASE.md`: device acceptance and release evidence/checklist.
- `docs/PROJECT_MILESTONE_REGISTER.md`: engineering milestone and source traceability register.
- `docs/LICENSING_AND_IP_REGISTER.md`: IP and licensing readiness register.
- `docs/TECHNICAL_ARCHITECTURE_AND_SOURCE_INVENTORY.md`: this architecture and source inventory.

## 4. Key data and scientific integrity principles

- Preserve coordinate reference system, datum, units and original coordinate-entry representation wherever relevant; validate conversions before spatial analysis.
- Keep measured field/laboratory data distinct from synthetic fixtures and illustrative examples.
- Do not infer lithology solely from resistivity values; record evidence, uncertainty and interpretation confidence.
- Keep raw measurements, processed values, assumptions, method versions and derived outputs traceable.
- Validate WQI and vulnerability methods against documented standards, parameter ranges, weights, units and cited scientific sources.
- Treat reports as decision-support outputs, not substitutes for accredited laboratory analysis or qualified professional judgement.

## 5. Architecture and inventory gaps to close

The current branch tree response did not show root package manifests (for example, `package.json`), lockfiles, Capacitor/Electron configuration files, all UI imports, styling/assets, or a complete application source tree. Therefore this inventory is not yet sufficient for a third-party developer to reproduce every build from a clean checkout.

Before a licensing or investor technical review, verify and document:

1. The complete canonical source tree and the role of `NDWQ-Source-Compact.zip`.
2. Package manifests, lockfiles, Node/runtime versions and exact build commands.
3. Capacitor and Electron configuration, application identifiers and platform-specific settings.
4. Every route's implementation and all referenced static assets.
5. All direct and transitive dependencies, versions and licence obligations; produce an SBOM.
6. Data model diagrams, IndexedDB schema, migrations, backup format and recovery guarantees.
7. Scientific equations, method references, units, assumptions, input validation and known limitations.
8. Automated test commands, coverage, CI workflow mapping and reproducible release instructions.
9. Security, privacy, offline behaviour, data export and device compatibility boundaries.
10. Release tagging, artifact checksums, signing process and archival/backup procedure.

## 6. Maintenance rules

- Update this file when modules are added, removed, renamed or materially redesigned.
- Each substantive code change must be traceable to a commit and preferably an issue / pull request.
- Keep architecture diagrams and data-flow descriptions aligned with actual code.
- Record confirmed behaviour separately from intended or planned behaviour.
- Do not put credentials, signing keys, private field data or confidential customer data in this document or public repository.
