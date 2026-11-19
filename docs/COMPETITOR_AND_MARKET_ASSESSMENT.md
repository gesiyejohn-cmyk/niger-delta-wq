# NDWQ Competitor and Market Assessment

**Assessment date:** 18 November 2026  
**Repository branch:** `feature/ert-geological-interpretation`  
**Status:** Preliminary desk research; not a completed customer, pricing, procurement, legal, or technical benchmark study.

## 1. Executive summary

Niger Delta WQ (NDWQ) is entering an established software landscape. Existing products already provide important parts of the proposed workflow: water-point monitoring and offline data collection; groundwater chemistry and water-quality analysis; electrical resistivity tomography (ERT) processing; GIS-based groundwater vulnerability mapping; and borehole/well data management.

The preliminary review did **not** establish that NDWQ is the first or only product to combine these capabilities. It did identify a credible product opportunity: a mobile-first, offline-capable, integrated workflow designed around practical groundwater and environmental investigations, with explicit links between field samples, water chemistry, geophysics, geological interpretation, borehole logs, vulnerability assessment, maps and technical reports.

This is a hypothesis to validate, not a claim of market uniqueness or commercial demand.

## 2. Competitor and adjacent-product landscape

### 2.1 mWater Surveyor and Portal — water-point monitoring and field data

**What it does:** mWater provides configurable field surveys, water-point and infrastructure records, mapping, dashboards, data management, exports and online/offline collection. Its documentation describes an offline relational database on mobile devices with later synchronisation. mWater states that its platform is free to use for core data collection and monitoring.

**Strengths to learn from:** accessible field data capture; offline-first workflows; configurable forms; site histories; maps and dashboards; data export; broad institutional use.

**Gap relative to NDWQ's proposed specialist scope:** mWater is a broad water, sanitation and infrastructure monitoring platform. Its public product description is not evidence of an integrated ERT inversion/geological interpretation and hydrogeological vulnerability-analysis workflow comparable to NDWQ's intended specialist combination.

**Strategic implication:** Do not compete with mWater merely on forms, GPS points, water-point registers or generic dashboards. NDWQ must demonstrate added value through scientific analysis, data provenance and connected hydrogeological interpretation. Interoperability/export should be considered rather than assuming users will abandon existing monitoring systems.

Sources:
- https://www.mwater.co/platform
- https://portal.mwater.co/resource_center/app_overview.html
- https://www.mwater.co/work-with-us

### 2.2 AquaChem — groundwater chemistry and water-quality analysis

**What it does:** AquaChem by Waterloo Hydrogeologic manages and analyses groundwater chemistry data. Public product materials describe unit transformations, charge/ion balance, statistics, geochemical plots (including Piper, Schoeller and Stiff diagrams), water-type calculations, exceedance reporting against standards, quality-control reports and PHREEQC-related geochemical modelling workflows. Version 15.0 was announced on 28 September 2026.

**Strengths to learn from:** mature groundwater chemistry workflows; quality-control features; handling of laboratory datasets; geochemical plots; standards/exceedance reporting; repeatable calculations and report generation.

**Gap/opportunity for NDWQ:** NDWQ should not claim to replace AquaChem's mature geochemical capabilities without implementing and validating comparable methods. A possible differentiator is connecting field collection and simpler water-quality indicators/WQI workflows with GIS, vulnerability, ERT and borehole evidence in an Android-friendly offline-capable application. Advanced geochemical speciation should be treated as a separate, carefully scoped capability, not assumed to exist.

**Strategic implication:** Prioritise transparent WQI methods, unit handling, missing/non-detect data rules, parameter-level standards, QA/QC flags, reproducible calculations and clear exports. Consider exchange formats compatible with specialist chemistry tools.

Sources:
- https://www.waterloohydrogeologic.com/products/aquachem/
- https://www.waterloohydrogeologic.com/aquachem-15-0-product-release/

### 2.3 Res2DInv / Res3DInv — specialist ERT and IP inversion

**What it does:** Res2DInv and Res3DInv provide specialist 2D/3D electrical resistivity and induced-polarisation inversion, data processing, model visualisation and data import/export. Public materials describe support for multiple electrode configurations, topography, borehole and cross-borehole surveys, time-lapse workflows and constrained inversion options.

**Strengths to learn from:** depth and sophistication of inversion methods; survey configuration support; data quality control; model-data comparison; established geophysical file formats; advanced 2D/3D visualisation.

**Gap/opportunity for NDWQ:** NDWQ's current ERT/geological interpretation work must not be presented as equivalent to a mature professional inversion engine unless it actually implements and validates the relevant inversion mathematics. The near-term opportunity may be to import, preserve, display and interpret outputs from established ERT packages, while making the geological interpretation and borehole/water-quality context more accessible.

**Strategic implication:** Define exactly whether NDWQ performs inversion, visualises externally inverted models, edits geological interfaces, or performs some combination. Label each operation precisely. Support documented import/export workflows and retain raw input files and processing provenance.

Sources:
- https://www.aarhusgeosoftware.dk/res2dinv
- https://www.aarhusgeosoftware.dk/res3dinv
- https://www.bentley.com/en/products/res2dinv-and-res3dinv/

### 2.4 Aarhus Workbench — integrated geophysics, GIS and borehole interpretation

**What it does:** Aarhus Workbench combines geophysical processing/inversion workflows with an integrated GIS interface, cross-sections, 3D visualisation, borehole lithology and geophysical log display, model quality control and PDF reporting. Its Borehole Logs functionality can display borehole logs on GIS, sections and in a 3D viewer.

**Importance:** This is one of the closest architectural benchmarks for NDWQ's intended integration of ERT, GIS, geological sections and borehole records.

**Strengths to learn from:** linking geophysical models to borehole evidence; GIS-based interpretation; section digitisation; quality-control visualisation; 3D context; report generation.

**Potential NDWQ positioning:** simpler field-to-report workflow on mobile devices, offline data capture, and a water-quality/vulnerability-centred project workspace. This remains a proposed distinction and must be tested against real workflows and users.

Sources:
- https://www.aarhusgeosoftware.dk/aarhus-workbench
- https://www.aarhusgeosoftware.dk/workbench-borehole-logs
- https://www.aarhusgeosoftware.dk/workbench-essentials

### 2.5 QGIS and DRASTIC plugin — GIS-based groundwater vulnerability

**What it does:** QGIS is a general-purpose GIS platform. A DRASTIC plugin in the QGIS plugin repository provides a way to calculate groundwater vulnerability using DRASTIC factors.

**Strengths to learn from:** established GIS tools, spatial data handling, reproducible mapping, broad data-format support and extensibility.

**Caution:** The repository listing reviewed describes the DRASTIC plugin as experimental, version 0.1, and lists an older QGIS compatibility range. Its existence proves that GIS-based DRASTIC workflows are not new; it does not establish that this particular plugin is currently suitable for production use.

**Strategic implication:** NDWQ should make vulnerability calculations auditable: expose factor values, ratings, weights, input sources, missing-data treatment, model version and uncertainty. Provide GIS-standard exports so users can inspect results independently.

Source:
- https://plugins.qgis.org/plugins/DRASTIC/

### 2.6 Hydro GeoAnalyst and wider Waterloo Hydrogeologic suite — environmental data management

**What it does:** Waterloo Hydrogeologic describes Hydro GeoAnalyst as supporting regional water-well management, regulatory compliance, cross-boundary data sharing, aquifer vulnerability mapping and environmental site assessment. Its broader product suite includes groundwater modelling, chemistry and pumping-test analysis.

**Strategic implication:** NDWQ should benchmark project/data management, traceability, data sharing, QA/QC and report workflows—not assume that one application can immediately match the depth of a mature suite.

Sources:
- https://www.waterloohydrogeologic.com/
- https://www.waterloohydrogeologic.com/products/aquachem/

### 2.7 NGWATER — Nigerian groundwater data and reporting initiative (status requires validation)

A Nigerian-facing website at ngwater.app describes a proposed national-grade platform for borehole documentation, groundwater monitoring, mobile field capture, offline support, analytics and reporting. Its stated audience includes geoscientists, drilling contractors, water agencies, regulators, NGOs and research institutions.

The public pages reviewed do not provide enough independently verifiable evidence to establish the platform's operational deployment, adoption, data quality, ownership, institutional endorsement or actual feature performance. Some public-facing impact counters appear inconsistent or unsubstantiated. It must therefore be treated as a **potential local adjacent product/initiative requiring direct verification**, not as a confirmed fully operational competitor.

**Strategic implication:** Monitor the initiative and investigate possible interoperability or collaboration. NDWQ should distinguish specialist scientific analysis from national borehole registry/coordination functions, if that distinction is borne out by product demonstrations.

Sources:
- https://www.ngwater.app/
- https://www.ngwater.app/professionals.php

### 2.8 NIHSA — important Nigerian stakeholder, not a software competitor

The Nigeria Hydrological Services Agency describes a national mandate covering collection, storage, analysis and dissemination of hydrological and hydrogeological data, including groundwater quantity, quality, availability and distribution.

NIHSA is better treated as a potential standards, data, institutional engagement and partnership stakeholder than as a direct commercial software competitor based on the public material reviewed.

Source:
- https://www.nihsa.gov.ng/

## 3. Comparison matrix

This matrix reflects publicly described capabilities, not hands-on product testing. “Not established” means the reviewed public evidence did not establish the capability; it does not prove the product lacks it.

| Product/platform | Offline field capture | Water chemistry / WQI | ERT processing | GIS / mapping | Borehole records / logs | Vulnerability assessment |
|---|---|---|---|---|---|---|
| mWater | Yes | Water monitoring data capture; full WQI analysis not established | Not established | Yes | Water-point/site records | Not established |
| AquaChem | Not established as a mobile offline field app | Strong groundwater chemistry analysis; WQI specifically not established | Not established | Geochemical plots and mapping features | Groundwater sample/well data | Hydrogeologic suite includes vulnerability via Hydro GeoAnalyst |
| Res2DInv / Res3DInv | Not a general field survey app | Not established | Core strength | Model visualisation/export; Workbench adds GIS | Borehole/cross-borehole support | Not core advertised function |
| Aarhus Workbench | Not established as a mobile offline field app | Not core advertised function | Integrated geophysical processing workflows | Strong integrated GIS | Strong borehole log integration | Not established as a primary workflow |
| QGIS + DRASTIC plugin | Depends on configuration and field tools | Requires other tools/plugins | Requires other tools | Core strength | Via data layers/plugins | DRASTIC plugin exists; plugin maturity must be checked |
| NGWATER (website-described) | Claims offline-first capture | Water-quality parameters/data fields described; analytical depth not established | Not established | Mapping/coverage claims | Core stated focus | Not established |
| NDWQ (planned/current repository scope) | Offline-first design; device acceptance still needs evidence | WQI module exists in source inventory; scientific validation and usability remain necessary | ERT workflow exists; exact inversion scope must be stated accurately | GIS/mapping modules exist in project scope | Dedicated module planned | Vulnerability module exists in source inventory; validation needed |

## 4. Preliminary market opportunity

### 4.1 Potential user groups

1. **Hydrogeologists and geoscientists:** field sample records, borehole logs, geophysical interpretation and groundwater assessments.
2. **Environmental consultants:** traceable field investigations, water-quality screening, vulnerability mapping and technical reporting.
3. **Universities and research groups:** student projects, MSc/PhD research datasets, repeatable calculations and exportable figures.
4. **Government water and environmental agencies:** monitoring, structured datasets, maps and reporting; procurement and data-governance requirements would need careful engagement.
5. **Water and borehole service providers:** borehole records, water-source histories and basic quality documentation.
6. **Petroleum and industrial environmental teams:** groundwater baseline and monitoring workflows, subject to rigorous QA/QC, regulatory requirements and validated methods.

These are candidate segments, not proven customers. No willingness-to-pay or market-size evidence has yet been collected.

### 4.2 Regional relevance

The Niger Delta provides a meaningful context for product validation because groundwater investigations may need to consider complex unconsolidated sediments, shallow aquifers, saline influence in some settings, petroleum-related contamination concerns, settlement growth and variable field connectivity. These are reasons to test the software locally, not grounds to hard-code assumptions or label every location contaminated.

NDWQ should support configurable regional project templates while preserving the ability to use the software elsewhere.

## 5. Proposed NDWQ positioning

**Working positioning statement:**

“NDWQ is an offline-capable environmental hydrogeology field and analysis platform that connects groundwater sampling and water-quality assessment with GIS, geophysical interpretation, borehole evidence and groundwater vulnerability workflows.”

This is a working description, not a claim of proven superiority.

### Potential differentiators to validate

- One connected project record linking samples, boreholes, ERT profiles, coordinates, maps and reports.
- Mobile-first and offline operation for field settings with unreliable connectivity.
- Coordinate entry and display in DD, DMS and DDM, with validated conversion and explicit CRS/datum.
- Transparent WQI and vulnerability calculations with visible formulas, standards, input values and method versions.
- Borehole logs linked spatially and by profile distance to ERT interpretation, while distinguishing measured evidence from interpretation.
- Export of raw and processed data to common formats to avoid locking users into NDWQ.
- Clear separation of real observations, imported data, interpreted outputs and synthetic test data.
- A workflow tailored to environmental and groundwater investigations, with Niger Delta validation as an initial use case.

## 6. Product gaps and priorities arising from the review

### Priority 1 — Scientific credibility and traceability
- Publish calculation methods, equations, units, standards and version identifiers for WQI and vulnerability indices.
- Add input validation, QA/QC flags, detection-limit and missing-data handling, and audit trails.
- Preserve original measurements and never silently overwrite them with derived or interpreted values.
- Record data source, date, analyst, coordinate reference system, assumptions and uncertainty.
- Ensure geological interpretation is not inferred from resistivity alone; require corroborating evidence and confidence labels.

### Priority 2 — ERT and borehole interoperability
- Define supported ERT input/output formats and test against real files from established instruments and software.
- Distinguish ERT inversion from tomogram display and geological boundary interpretation.
- Complete the dedicated borehole logging module: borehole identity, coordinates, ground elevation, drilled depth, dates, depth intervals, lithology descriptions, water strikes, static water level, sample references, source/confidence and attachments.
- Link boreholes to ERT stations/sections using explicit spatial and distance rules.
- Keep imported borehole observations separate from interpreted geological layers.

### Priority 3 — Mobile/offline reliability
- Test complete create/edit/delete, backup/restore, import/export and migration workflows on physical Android devices.
- Test large projects and low-memory devices.
- Provide visible backup status and data recovery guidance.
- Do not equate an emulator launch test with full field acceptance.

### Priority 4 — Reports and interoperability
- Produce clear, reproducible technical reports showing data, methods, assumptions, maps, units, standards and limitations.
- Support CSV, XLSX, GeoJSON and common GIS formats where technically appropriate.
- Provide a clean project export/backup so users can retain their records independently.

### Priority 5 — Product usability
- Observe hydrogeologists using the app on real field tasks.
- Reduce duplicate data entry and prevent invalid geological boundary configurations.
- Use plain-language validation errors and guided workflows.
- Support project templates without forcing one geological or regulatory assumption on every user.

## 7. Commercial model hypotheses (not yet validated)

Possible models to test with prospective users:
- Free or low-cost individual/student edition with project-size or export limits.
- Paid professional licence for consultants and independent practitioners.
- Institutional/team licences for universities, agencies and companies.
- Paid onboarding, training, report templates, data migration and support.
- Optional hosted collaboration/synchronisation service, while preserving local/offline access and user data export.

Pricing should not be set until interviews, competitor licence checks, support-cost estimates and willingness-to-pay tests have been completed. mWater's free core platform is an important benchmark for generic field data collection; NDWQ's paid value, if any, must come from specialist analysis, workflow integration, reliability and support.

## 8. Validation plan before making market or uniqueness claims

1. Arrange guided demonstrations or trials of mWater, AquaChem, Res2DInv/Res3DInv, Aarhus Workbench and relevant QGIS workflows.
2. Verify NGWATER's operational status by requesting a live demonstration, documentation, data standards, deployment references and a clear explanation of its current scope.
3. Interview at least 5–10 people across hydrogeology, environmental consulting, university research, government water agencies and borehole services. Record actual workflow pain points and existing tools.
4. Ask users to complete the same representative task in their existing toolchain and in NDWQ; measure time, errors, steps and output quality.
5. Obtain current licence/pricing quotes directly from vendors; do not infer price from old listings or third-party resellers.
6. Test NDWQ using real, permissioned datasets from the Niger Delta and at least one dataset from outside the region.
7. Have independent hydrogeology/geophysics reviewers inspect calculations, geological interpretation and reports.
8. Revisit the positioning statement after evidence is collected. Do not use “first,” “only,” “best,” “more accurate” or “industry-leading” without defensible evidence.

## 9. Limitations of this assessment

- This is desk research based primarily on public vendor pages, documentation and public product descriptions accessed on 18 November 2026.
- No competing product was installed or subjected to hands-on benchmarking for this report.
- Public feature descriptions may omit limitations or reflect marketing claims.
- NGWATER's real deployment and operational status have not been independently confirmed.
- No systematic patent, trademark, academic literature, procurement, customer, market-size or pricing study has been completed.
- This report is not legal advice, an IP clearance opinion, or evidence that NDWQ is novel or patentable.
- The feature comparison is provisional and should be updated as products are tested and NDWQ changes.

## 10. Source register

1. mWater, Platform: https://www.mwater.co/platform
2. mWater, Surveyor app overview: https://portal.mwater.co/resource_center/app_overview.html
3. mWater, Work with Us: https://www.mwater.co/work-with-us
4. Waterloo Hydrogeologic, AquaChem: https://www.waterloohydrogeologic.com/products/aquachem/
5. Waterloo Hydrogeologic, AquaChem 15.0 release (28 September 2026): https://www.waterloohydrogeologic.com/aquachem-15-0-product-release/
6. Aarhus GeoSoftware, Res2DInv: https://www.aarhusgeosoftware.dk/res2dinv
7. Aarhus GeoSoftware, Res3DInv: https://www.aarhusgeosoftware.dk/res3dinv
8. Aarhus GeoSoftware, Aarhus Workbench: https://www.aarhusgeosoftware.dk/aarhus-workbench
9. Aarhus GeoSoftware, Borehole Logs: https://www.aarhusgeosoftware.dk/workbench-borehole-logs
10. QGIS Python Plugins Repository, DRASTIC: https://plugins.qgis.org/plugins/DRASTIC/
11. NGWATER, main site: https://www.ngwater.app/
12. NGWATER, professionals page: https://www.ngwater.app/professionals.php
13. Nigeria Hydrological Services Agency: https://www.nihsa.gov.ng/

---
**Maintenance rule:** Update this document when a competitor's capabilities, pricing/licensing, or NDWQ's feature scope changes. Record the date and evidence for each material change. Keep verified observations separate from vendor claims, assumptions and user interview findings.
