# Niger Delta WQ — Intellectual Property and Licensing Readiness Register

**Repository:** https://github.com/gesiyejohn-cmyk/niger-delta-wq  
**Working branch:** `feature/ert-geological-interpretation`  
**Purpose:** Preserve evidence and decisions needed for future ownership review, licensing, partnerships and commercial distribution.

> This is an administrative project record, not a legal opinion, proof of ownership, patent filing or grant of rights. Do not make ownership or exclusivity claims until the relevant facts and legal position have been reviewed.

## 1. Product identity and scope

- Product name currently used: **Niger Delta WQ**.
- Product category: environmental / water-quality and geoscience software.
- Intended capabilities include water-quality assessment, WQI workflows, GIS and spatial analysis, ERT/geological interpretation, borehole logging and groundwater vulnerability assessment.
- Intended user groups may include environmental consultants, researchers, universities, water-resource organisations and relevant public/private institutions.
- Product roadmap items are not to be represented as completed features until implemented and tested.

## 2. Evidence to preserve

Maintain an auditable record of:

- Repository creation and access/ownership settings.
- Every commit SHA, branch, pull request, review and release tag.
- Original design notes, requirements, architecture decisions and dated specifications.
- Contributor identities and the work each person or organisation supplied.
- Contracts, employment terms, consultancy agreements and written IP assignments, where relevant.
- External code, libraries, datasets, fonts, icons, maps, images and other third-party assets, with exact versions, sources and applicable licences.
- Test evidence, release artifacts and checksums.
- Product name, logo and brand-development records.
- Any research collaboration, institutional funding, grant conditions or sponsor terms that may affect rights.

A Git history is valuable evidence of software evolution, but by itself it does not settle legal ownership of every contribution or third-party component.

## 3. Contributor and rights register

Create one entry for every person or organisation that contributes code, designs, documentation, datasets or other protectable material.

| Field | Record |
|---|---|
| Contributor / organisation | To be completed |
| Contribution and files / deliverables | To be completed |
| Dates and relevant commit / PR | To be completed |
| Relationship (founder, employee, contractor, volunteer, institution, etc.) | To be completed |
| Agreement / assignment / permission | To be reviewed and recorded |
| Restrictions or obligations | To be reviewed |
| Evidence location | To be recorded securely |

Before commercial licensing, obtain appropriate written agreements and professional advice for contributions where ownership or permission is unclear. Do not assume that payment, repository access or authorship alone automatically transfers all rights.

## 4. Third-party software and asset register

For each dependency or asset, record:

- Name, version and source URL.
- Copyright holder / author, where known.
- Licence name and licence text or authoritative link.
- Whether source disclosure, attribution, notices, offer of source, or other obligations apply.
- Whether the licence permits the intended commercial distribution and modification.
- Whether the component is bundled, linked, hosted or used only during development.
- Review date and reviewer.

Generate and retain a software bill of materials (SBOM) for release candidates. Review all direct and transitive dependencies, not only the packages listed in the main manifest. Do not remove required notices or assume all open-source licences have identical terms.

## 5. Data rights, privacy and scientific provenance

- Identify who owns or controls every dataset used in the product.
- Distinguish synthetic test data, public datasets, licensed datasets and user-supplied field observations.
- Obtain permission and document lawful grounds before redistributing third-party or customer data.
- Do not embed confidential field data, personal information, credentials or secrets in source code or test fixtures.
- Record data sources, collection dates, coordinate reference systems, units, quality checks and transformations.
- Label simulated data clearly; never present it as measured field evidence.
- Define customer data ownership, retention, export, deletion, backup and access controls in commercial terms.

## 6. Licensing strategy to evaluate

Potential approaches for legal review:

1. **Proprietary commercial licence:** customers receive defined rights to use the software; ownership remains with the rights holder.
2. **Institutional licence:** terms for universities, agencies or organisations, including user/site limits and support.
3. **Subscription or hosted service:** recurring access, service levels, data processing and availability terms.
4. **Consultancy/service agreement:** software-assisted assessment deliverables, with clear ownership of software, methods, reports and client data.
5. **Open-core or dual licensing:** only if the codebase, dependency licences and business objectives support it.

The selected model should specify permitted users, devices, installations, sites, duration, fees, updates, support, redistribution, reverse engineering restrictions where lawful, termination, warranties, liability, confidentiality and data protection.

## 7. Pre-commercial release checklist

- [ ] Confirm repository owner and administrator access; enable strong account security.
- [ ] Review all contributors and document rights/permissions.
- [ ] Review university, employer, grant, sponsor and collaboration obligations.
- [ ] Inventory dependencies, assets and licences; produce an SBOM.
- [ ] Review datasets and data-protection obligations.
- [ ] Check for exposed secrets and confidential information in current files and Git history.
- [ ] Decide software licence and customer licensing model with qualified legal advice.
- [ ] Review product name and trademark availability before investing in branding.
- [ ] Prepare end-user licence agreement, privacy notice and terms of service as applicable.
- [ ] Prepare release notes, user documentation, support policy and versioned release artifacts.
- [ ] Validate scientific methods and clearly disclose limitations and intended use.
- [ ] Create a release archive and preserve source commit, tag, checksum and test evidence.

## 8. Important ownership and legal review questions

Before licensing, obtain advice from a qualified Nigerian intellectual-property professional (and other relevant jurisdictions if distributing internationally) on:

- Copyright ownership and written assignments for all contributors.
- Whether any university, employer, funder or collaboration agreement creates rights or restrictions.
- Trademark protection for the product name and logo.
- Patentability, if any genuinely novel technical invention is identified; public disclosure can affect options.
- Open-source licence compatibility and distribution obligations.
- Applicable privacy, cybersecurity, consumer, contract and sector-specific requirements.

## 9. Change control

Update this register whenever a new contributor joins, a dependency or data source is added, a licence decision changes, a commercial agreement is signed, or a release is prepared. Record the date, responsible person, evidence and decision. Keep signed agreements and sensitive records in an access-controlled location; do not commit confidential contracts or personal information to a public repository.
