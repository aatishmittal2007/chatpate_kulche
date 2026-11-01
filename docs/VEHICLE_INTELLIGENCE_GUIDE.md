# Vehicle Intelligence & Clean Route Exposure Guide

## 1. Overview
Vehicular exhaust constitutes between 18% and 22% of localized primary particulate matter (PM2.5) and over 50% of oxides of nitrogen (NOx) across Delhi-NCR during the Diwali festival period.

The **Diwali AirSense Vehicle Intelligence Module** provides:
1. Video stream vehicle classification (Cars, Buses, Trucks, Motorcycles, 3-Wheelers).
2. Road segment congestion indices across 7 critical Delhi arterial corridors.
3. Hourly particulate and NOx emission estimation using India-specific emission factors.
4. **Clean Route Exposure Solver**: Direct mathematical calculation of personal inhalation exposure comparing conventional arterial routes against clean green bypasses.

---

## 2. Emission Factors (CPCB / COPERT India Norms)

| Vehicle Class | PM2.5 Emission Factor (g/km) | NOx Emission Factor (g/km) |
|---|---|---|
| Diesel Freight Trucks | 0.45 | 4.20 |
| Heavy Transit Buses | 0.38 | 3.80 |
| Auto-Rickshaws (3-Wheelers) | 0.15 | 0.40 |
| Passenger Cars | 0.08 | 0.60 |
| Two-Wheelers / Motorcycles | 0.05 | 0.30 |

Hourly emission loads for each corridor are calculated as:
$$\text{Emission (kg/h)} = \frac{1}{1000} \sum_{k \in \text{classes}} N_k \times L \times \text{EF}_k$$

---

## 3. Clean Route Inhalation Exposure Formulation
Given an origin and destination, the platform compares the standard highway corridor against cleaner secondary routes using cumulative particulate inhalation:

$$\text{Cumulative Exposure Index} = \sum_{s \in \text{segments}} C_s \times \Delta t_s = \sum_{s \in \text{segments}} C_s \times \frac{L_s}{V_s}$$

Where:
- $C_s$: Ambient PM2.5 concentration along corridor $s$ ($\mu\text{g/m}^3$)
- $L_s$: Length of segment $s$ (km)
- $V_s$: Traffic travel speed along segment $s$ (km/h)

The solver quantifies the exposure reduction percentage:
$$\text{Exposure Reduction \%} = \frac{\text{Exposure}_{\text{standard}} - \text{Exposure}_{\text{clean}}}{\text{Exposure}_{\text{standard}}} \times 100\%$$

Taking the green corridor (e.g. via Barapullah Elevated / DND bypass) routinely yields a **35% to 45% reduction in total inhaled aerosol mass** with minimal impact on overall travel time.
