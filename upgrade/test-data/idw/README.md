# Synthetic IDW training dataset (Niger Delta University area)

**Training data only — not field observations.** These nine records are fabricated to exercise NDWQ's exploratory IDW workflow. They are not measurements from Niger Delta University, not a groundwater-quality survey, and must not be cited or used for environmental conclusions.

## Files

- `ndu-campus-synthetic-idw.csv`: nine sample records with WGS84 decimal-degree coordinates and example TDS, EC, nitrate, iron and chloride concentrations.

## Entering the data in NDWQ

The current IDW page reads saved sample records; it does not bulk-import this CSV directly. Create nine sample records manually:

1. Open **Register a sample**.
2. Copy one `sample_code` into Sample code.
3. Enter `latitude_dd` and `longitude_dd` as **Decimal Degrees (DD)**. Use WGS84 geographic coordinates (EPSG:4326); the app stores the geographic coordinates and handles the UTM projection for IDW.
4. Under Water quality parameters, enter the row's values:
   - `tds_mg_l` → Total dissolved solids, unit mg/L.
   - `ec_us_cm` → Electrical conductivity, unit µS/cm.
   - `no3_mg_l` → Nitrate, unit mg/L.
   - `fe_mg_l` → Iron, unit mg/L.
   - `cl_mg_l` → Chloride, unit mg/L.
5. Save the sample, then repeat for all nine rows. Keep the `SYN-IDW-` prefix so the training records remain identifiable.
6. Open **IDW** and select **Total dissolved solids (mg/L)**.
7. Use the requested demonstration settings:
   - IDW power: **2**
   - Maximum neighbours: **8**
   - Maximum distance: **5000 m**
   - Grid rows: **20**
   - Grid columns: **20**
8. Generate the grid. The nine points lie in one UTM zone (zone 32N, EPSG:32632) and form a 3 × 3 rectangular sample layout. Cells outside the convex hull remain masked. Export the grid CSV if required.

## Interpretation cautions

- The CSV's coordinates and chemistry are synthetic. They are designed for software testing, not to represent the real campus boundary or aquifer conditions.
- IDW is an exploratory interpolation of the selected measured parameter only. It is **not** a groundwater-potential or vulnerability prediction.
- IDW does not estimate uncertainty. Review sample spacing, outliers, analytical quality, projection and search radius before interpreting any real dataset.
- Do not mix these training records with independent field observations in research outputs.
