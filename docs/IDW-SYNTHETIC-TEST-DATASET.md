# NDWQ synthetic IDW test dataset and instructions

**Prepared:** 22 November 2026  
**Purpose:** Software acceptance testing of the Groundwater Sample IDW workflow  
**Dataset size:** 8 fabricated sample records

> **Important:** Every value in this dataset is synthetic. These are not field measurements, laboratory results, or evidence of groundwater quality. Do not use them for environmental assessment, regulatory reporting, drinking-water decisions, or thesis conclusions.

## 1. Dataset

The CSV file `ndwq-synthetic-idw-test-data.csv` has four columns:

- `sample_id`: unique test sample identifier
- `latitude_dd`: latitude in WGS84 decimal degrees
- `longitude_dd`: longitude in WGS84 decimal degrees
- `tds_mg_l`: fabricated total dissolved solids concentration in mg/L

| Sample ID | Latitude (DD) | Longitude (DD) | TDS (mg/L) |
|---|---:|---:|---:|
| SYN-01 | 4.9700 | 6.1000 | 260 |
| SYN-02 | 4.9720 | 6.1040 | 315 |
| SYN-03 | 4.9750 | 6.0980 | 225 |
| SYN-04 | 4.9780 | 6.1060 | 390 |
| SYN-05 | 4.9660 | 6.1080 | 275 |
| SYN-06 | 4.9800 | 6.0950 | 460 |
| SYN-07 | 4.9630 | 6.0970 | 190 |
| SYN-08 | 4.9740 | 6.1120 | 335 |

## 2. Enter the eight records

The current Spatial Analysis screen offers a synthetic CSV download, but does not expose a direct CSV-to-sample import control. Create eight separate water-quality records manually:

1. Open the sample workspace and choose **Register a sample**.
2. Copy the CSV `sample_id` into the Sample code field.
3. Enter `latitude_dd` as latitude and `longitude_dd` as longitude. Do not swap them.
4. Enter the row's `tds_mg_l` value as the measured TDS result, with unit **mg/L**.
5. Save the record, then repeat for all eight rows.

Leave all other unmeasured parameters blank; do not enter zero for them. Enter coordinates in decimal degrees exactly as supplied. These points are clustered around the Niger Delta University / Amassoma area for software testing only.

## 3. Run the interpolation

Open **GIS & Spatial Analysis → Groundwater sample IDW interpolation** and use:

| Setting | Test value |
|---|---:|
| Data source | Water-quality samples only |
| Measured parameter | TDS |
| IDW power | 2 |
| Neighbour count | 8 |
| Maximum neighbour distance | 5,000 m |
| Grid resolution | 20 × 20 |

Before generating the surface, confirm that the page reports **8** records with valid coordinates and measured TDS, all from the water-quality source.

Select **Generate IDW surface**.

## 4. Acceptance checks

A successful software test should show:

- Interpolation diagnostics report 8 samples.
- At least some grid cells are generated within the sample convex hull.
- Coverage is greater than 0% and no greater than 100%.
- Interpolated values remain within the input range of **190–460 mg/L**.
- The map displays the interpolation cells and sample locations.
- **Export grid CSV** produces the fields `latitude_dd`, `longitude_dd`, `parameter`, `value`, `unit`, and `neighbours_used`.

The exact number of cells and exact interpolated extrema depend on the grid and coverage rules. Do not assume a fixed cell count.

## 5. Troubleshooting

- **Fewer than 8 records:** reopen the sample list and confirm every record was saved with both coordinates and a measured TDS value.
- **Duplicate coordinates:** check that no two rows were entered with the same latitude/longitude pair.
- **Too few nearby neighbours:** verify the 5,000 m distance limit and recheck coordinate order and values.
- **“neighbors is not defined”:** capture a screenshot and note the installed app build. The current source explicitly maps the UI's neighbour setting to the engine's `neighbors` option and includes a regression test for this wiring; a screenshot/build identifier helps distinguish a stale installed build from a remaining runtime defect.

## 6. Scientific limits

IDW is a distance-weighted exploratory interpolation, not a groundwater-flow model. The current implementation restricts the surface to the convex hull of the sample locations and omits cells that do not satisfy the neighbour-distance rule. Results depend on sampling geometry, measurement quality, coordinate accuracy and the selected settings. A successful synthetic test verifies software behaviour only; it does not validate IDW for a real study area.
