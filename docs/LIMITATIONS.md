# Model Limitations & Scientific Ground Rules — Diwali AirSense

To ensure rigorous environmental modeling integrity, Diwali AirSense enforces explicit scientific boundaries and transparent limitation reporting.

---

## 1. Non-Causal Predictive Association

> [!WARNING]
> **Predictive Correlation is NOT Causal Source Attribution.**
> Tree-based machine learning models (such as XGBoost) and feature importance scores describe statistical correlations in observational data. A high feature weight for traffic congestion or fire proximity does NOT prove that a specific vehicle class or agricultural plot caused a pollution spike.

- The system does **not** simulate hydrodynamic Navier-Stokes atmospheric fluid mechanics or photochemical secondary aerosol transformation.
- No legal, regulatory, or punitive source attribution should be derived solely from model feature rankings.

---

## 2. Satellite AOD vs. Ground-Level PM2.5

> [!IMPORTANT]
> **Column-Integrated Satellite Measurements vs Ground-Level Concentrations.**
> Satellite sensors (e.g. Sentinel-5P TROPOMI, MODIS) measure **column-integrated** optical extinction (Aerosol Optical Depth) and aerosol indices through the entire atmospheric column down to the surface.

- High column AOD can occur due to elevated smoke layers (1–3 km aloft) that never mix down to breathing level.
- Conversely, extreme surface nocturnal inversions during Diwali night can trap particulate matter in the lowest 100 meters while upper column air remains clear.
- Sentinel-5P features are ingested strictly as atmospheric opacity indicators, never as interchangeable substitutes for ground-level PM2.5 observations.

---

## 3. Directional Screening Weights

The directional screening formula:
$$w(i,j,t) = \exp\left(-\frac{d_{ij}}{L}\right) \times \max\left(0, \cos(\theta_{\text{transport}} - \phi_{ij})\right)$$
is an empirical geometric proximity filter.
- It calculates whether prevailing surface wind is oriented towards a receptor station.
- It assumes a single characteristic spatial decay length ($L = 150\text{ km}$).
- It does **not** account for complex 3D wind shear, terrain friction, plume rise, atmospheric stability classes (Pasquill-Gifford), or boundary-layer venting.

---

## 4. Multi-Year Extrapolation Boundaries

Diwali dates shift significantly from year to year on the Gregorian calendar (late October to mid-November) following the Hindu lunar calendar:
- When Diwali occurs in late October (e.g., Oct 24, 2022 or Oct 31, 2024), ambient temperatures are higher and nocturnal inversions are less severe.
- When Diwali occurs in mid-November (e.g., Nov 12, 2023), ambient temperatures are colder, nocturnal inversions are lower, and peak agricultural stubble burning is more advanced.
- Therefore, three years of historical data do **not** establish a deterministic trend for the next three years. Multi-year progression charts show historical empirical distributions, not deterministic future trajectories.

---

## 5. Small-Dataset Safeguards

When working with limited historical observation sets:
1. **Chronological Splitting Only**: Random K-fold cross-validation leaks temporal autocorrelation and episode dynamics across train and test sets. Diwali AirSense strictly enforces forward chronological validation splits.
2. **Persistence Baseline Dominance**: For short horizons ($+1\text{h}$), persistence baseline ($\hat{C}_{t+1} = C_t$) is exceptionally competitive. If XGBoost fails to outperform the baseline by more than 2% out-of-sample, the engine explicitly falls back to the baseline.
3. **Conservative Tree Depths**: Deep tree ensembles quickly overfit episodic spikes. Tree depths are restricted ($\text{max\_depth} \le 3$, $n_{\text{estimators}} \le 40$) with L2 regularization ($\lambda = 2.0$).
4. **Empirical Uncertainty Quantiles**: Prediction intervals are computed directly from held-out validation residual errors at the 80th and 95th percentiles.

---

## 6. Hypothetical Scenario Lab Caveats

The Scenario Comparison interface permits adjusting environmental sliders (e.g., wind speed, traffic volume, fire counts).
- These adjustments produce **model-conditioned sensitivity forecasts**, not physically validated counterfactual realities.
- Changing wind speed without re-computing atmospheric turbulence and stability represents a statistical thought experiment, not a certified physical simulation.
- Every scenario comparison displays a mandatory scientific notice clarifying these assumptions.
