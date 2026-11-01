import zipfile, pandas as pd, numpy as np, os, json, time, warnings
from sklearn.metrics import mean_absolute_error, mean_squared_error
from sklearn.ensemble import RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.pipeline import make_pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.linear_model import Ridge
from sklearn.ensemble import HistGradientBoostingRegressor
from xgboost import XGBRegressor
from lightgbm import LGBMRegressor
warnings.filterwarnings('ignore')
zip_path='/mnt/data/archive (4).zip'
out='/mnt/data/diwali_air_quality_analysis'
os.makedirs(out, exist_ok=True)
usecols=['StationId','Datetime','PM2.5','PM10','NO2','NOx','CO','SO2','O3','AQI']
dtypes={c:'float32' for c in usecols if c not in ['StationId','Datetime']}
with zipfile.ZipFile(zip_path) as z:
    with z.open('station_hour.csv') as f:
        df=pd.read_csv(f, usecols=usecols, dtype=dtypes, parse_dates=['Datetime'], low_memory=False)
# Sort; compact memory
# Focus on 15 stations with the most non-missing PM2.5 observations to keep multi-model experiments tractable.
station_rank=df.groupby('StationId', observed=True)['PM2.5'].apply(lambda x: x.notna().sum()).sort_values(ascending=False)
selected_stations=set(station_rank.head(15).index)
df=df[df['StationId'].isin(selected_stations)].copy()
df['StationId']=df['StationId'].astype('category')
df=df.sort_values(['StationId','Datetime']).reset_index(drop=True)
# dates
for c in ['PM2.5','PM10','NO2','NOx','CO','SO2','O3','AQI']:
    df[c]=pd.to_numeric(df[c], errors='coerce').astype('float32')
dt=df['Datetime']
df['year']=dt.dt.year.astype('int16')
df['hour']=dt.dt.hour.astype('int8')
df['dayofweek']=dt.dt.dayofweek.astype('int8')
df['month']=dt.dt.month.astype('int8')
df['dayofyear']=dt.dt.dayofyear.astype('int16')
df['hour_sin']=np.sin(2*np.pi*df['hour']/24).astype('float32')
df['hour_cos']=np.cos(2*np.pi*df['hour']/24).astype('float32')
df['doy_sin']=np.sin(2*np.pi*df['dayofyear']/365.25).astype('float32')
df['doy_cos']=np.cos(2*np.pi*df['dayofyear']/365.25).astype('float32')
# Diwali dates for years represented
festival_dates={2015:'2015-11-11',2016:'2016-10-30',2017:'2017-10-19',2018:'2018-11-07',2019:'2019-10-27',2020:'2020-11-14'}
di=pd.to_datetime(df['year'].map(festival_dates))
delta=(dt-di).dt.total_seconds()/3600
df['hours_from_diwali']=delta.astype('float32')
df['diwali_window_3d']=(delta.abs()<=72).astype('int8')
df['diwali_window_7d']=(delta.abs()<=168).astype('int8')
df['is_diwali_day']=(dt.dt.date==di.dt.date).astype('int8')
# group-based features; row lags masked if timestamp gap is not exactly lag hours
g=df.groupby('StationId', observed=True, sort=False)
for lag in [1,3,6,24]:
    lag_val=g['PM2.5'].shift(lag)
    lag_dt=g['Datetime'].shift(lag)
    df[f'PM25_lag_{lag}h']=lag_val.where((dt-lag_dt)==pd.Timedelta(hours=lag)).astype('float32')
for win in [3,6,24]:
    # Rolling by row, only retain if the oldest included record is within the nominal window
    roll=g['PM2.5'].rolling(window=win,min_periods=max(2,win//2)).mean().reset_index(level=0,drop=True)
    old_dt=g['Datetime'].shift(win-1)
    df[f'PM25_roll_{win}h']=roll.where((dt-old_dt)<=pd.Timedelta(hours=win-1)).astype('float32')
df['PM25_rate_1h']=(df['PM2.5']-df['PM25_lag_1h']).astype('float32')
df['PM25_rate_3h']=((df['PM2.5']-df['PM25_lag_3h'])/3).astype('float32')
df['PM25_acceleration']=(df['PM25_rate_1h']-(df['PM25_lag_1h']-df['PM25_lag_3h'])/2).astype('float32')
# Target: next hourly PM2.5, only when next observation is exactly one hour later
g=df.groupby('StationId', observed=True, sort=False)
df['target_next_hour']=g['PM2.5'].shift(-1).astype('float32')
next_dt=g['Datetime'].shift(-1)
valid=(next_dt-dt)==pd.Timedelta(hours=1)
data=df.loc[valid & df['target_next_hour'].notna()].copy()
# Drop observations without current PM2.5 only for persistence baseline comparison? retain for models but no baseline metric on those rows.
feature_cols=['StationId','PM2.5','PM10','NO2','NOx','CO','SO2','O3','AQI','hour','dayofweek','month','dayofyear','hour_sin','hour_cos','doy_sin','doy_cos','hours_from_diwali','diwali_window_3d','diwali_window_7d','is_diwali_day','PM25_lag_1h','PM25_lag_3h','PM25_lag_6h','PM25_lag_24h','PM25_roll_3h','PM25_roll_6h','PM25_roll_24h','PM25_rate_1h','PM25_rate_3h','PM25_acceleration']
# Encode station as integer category code for tree models; station code is an identifier feature, not a continuous quantity.
data['StationCode']=data['StationId'].cat.codes.astype('int16')
feature_cols=[c for c in feature_cols if c!='StationId']+['StationCode']
# Chronological train/validation/test: train <=2017, validation 2018, final test 2019
train=data[data['year']<=2017].copy()
val=data[data['year']==2018].copy()
test=data[data['year']==2019].copy()
# use a deterministic sample for model training to keep computation manageable; preserve all val/test for metrics
rng=np.random.default_rng(42)
if len(train)>100000:
    train=train.iloc[np.sort(rng.choice(len(train),100000,replace=False))].copy()
# Feature medians fit on training only; tree models do not accept NaNs consistently (XGB/LGBM do but RF not)
X_train=train[feature_cols].copy(); y_train=train['target_next_hour'].to_numpy()
X_val=val[feature_cols].copy(); y_val=val['target_next_hour'].to_numpy()
X_test=test[feature_cols].copy(); y_test=test['target_next_hour'].to_numpy()
medians=X_train.median(numeric_only=True)
for X in [X_train,X_val,X_test]:
    X.fillna(medians, inplace=True)
# target feature is PM2.5 at current hour; residual learner predicts next-hour change
models={
 'RandomForest':RandomForestRegressor(n_estimators=35,max_depth=14,min_samples_leaf=4,max_features=0.8,n_jobs=-1,random_state=42),
 'XGBoost':XGBRegressor(n_estimators=120,max_depth=6,learning_rate=0.06,subsample=0.85,colsample_bytree=0.85,reg_lambda=2,objective='reg:squarederror',tree_method='hist',n_jobs=4,random_state=42),
 'LightGBM':LGBMRegressor(n_estimators=120,learning_rate=0.05,num_leaves=31,max_depth=-1,subsample=0.85,colsample_bytree=0.85,reg_lambda=2,n_jobs=4,random_state=42,verbosity=-1),
}
# Validation predictions trained only on data through 2017; used to estimate ensemble weights
val_preds={}
val_baseline=val['PM2.5'].to_numpy()
for name,model in models.items():
    t=time.time(); model.fit(X_train,y_train); p=model.predict(X_val)
    val_preds[name]=p
    print('validation model',name,'seconds',round(time.time()-t,1), flush=True)
# residual learning: model the change from current PM2.5, not absolute future level
# This is a residual correction over persistence, trained against target - current PM2.5.
resid_model=XGBRegressor(n_estimators=120,max_depth=5,learning_rate=0.05,subsample=0.85,colsample_bytree=0.85,reg_lambda=3,objective='reg:squarederror',tree_method='hist',n_jobs=4,random_state=42)
resid_mask=train['PM2.5'].notna().to_numpy()
resid_model.fit(X_train.loc[resid_mask], y_train[resid_mask] - train.loc[resid_mask,'PM2.5'].to_numpy())
val_delta=resid_model.predict(X_val)
val_resid=np.where(np.isfinite(val_baseline), val_baseline + val_delta, val_preds['XGBoost'])
val_preds['Residual_XGBoost']=val_resid
# weighted ensemble: choose nonnegative weights minimizing validation MSE via simple grid search over 0.05 increments
ensemble_names=['RandomForest','XGBoost','LightGBM','Residual_XGBoost']
valid_mask=np.isfinite(y_val)
P_all=np.column_stack([val_preds[n] for n in ensemble_names])
valid_mask=valid_mask & np.isfinite(P_all).all(axis=1)
P=P_all[valid_mask]
yv=y_val[valid_mask]
best=(float('inf'),None)
# optimize weights on 5% grid, weights sum to 1
for a in np.arange(0,1.0001,0.05):
  for b in np.arange(0,1-a+1e-9,0.05):
    for c in np.arange(0,1-a-b+1e-9,0.05):
      d=1-a-b-c
      w=np.array([a,b,c,d])
      mse=np.mean((P@w-yv)**2)
      if mse<best[0]: best=(mse,w.copy())
weights=best[1]
print('ensemble weights',dict(zip(ensemble_names,weights)), flush=True)
# Final held-out 2019 test uses models trained only through 2017; 2018 is reserved for validation and ensemble weighting.
# This conservative split prevents any use of 2019 information during training.
final_preds={}
for name,model in models.items():
    t=time.time(); final_preds[name]=model.predict(X_test)
    print('test prediction',name,'seconds',round(time.time()-t,1),flush=True)
test_current=test['PM2.5'].to_numpy()
test_delta=resid_model.predict(X_test)
final_preds['Residual_XGBoost']=np.where(np.isfinite(test_current),test_current+test_delta,final_preds['XGBoost'])
final_preds['Weighted_Ensemble']=sum(weights[i]*final_preds[n] for i,n in enumerate(ensemble_names))
final_preds['Persistence']=test_current
# metric helper
def metrics(y,p,mask=None):
    if mask is None: mask=np.isfinite(y)&np.isfinite(p)
    else: mask=mask & np.isfinite(y)&np.isfinite(p)
    if mask.sum()==0: return {'n':0,'MAE':np.nan,'RMSE':np.nan}
    return {'n':int(mask.sum()),'MAE':float(mean_absolute_error(y[mask],p[mask])),'RMSE':float(mean_squared_error(y[mask],p[mask])**0.5)}
# metrics full test and Diwali windows ±3d and ±7d
metric_rows=[]
ytest=test['target_next_hour'].to_numpy()
common_test=test['PM2.5'].notna().to_numpy()
for name,p in final_preds.items():
    for window,mask in [('All_2019',np.ones(len(test),dtype=bool)),('Diwali_7d',test['diwali_window_7d'].to_numpy().astype(bool)),('Diwali_3d',test['diwali_window_3d'].to_numpy().astype(bool))]:
        m=metrics(ytest,p,mask & common_test)
        metric_rows.append({'Model':name,'Evaluation':window,**m})
metrics_df=pd.DataFrame(metric_rows).sort_values(['Evaluation','MAE'])
metrics_df.to_csv(out+'/model_metrics.csv',index=False)
# Validation metrics and ensemble weights
val_rows=[]
common_val=val['PM2.5'].notna().to_numpy()
for name,p in val_preds.items():
    for window,mask in [('All_2018',np.ones(len(val),dtype=bool)),('Diwali_7d',val['diwali_window_7d'].to_numpy().astype(bool)),('Diwali_3d',val['diwali_window_3d'].to_numpy().astype(bool))]:
        m=metrics(y_val,p,mask & common_val)
        val_rows.append({'Model':name,'Evaluation':window,**m})
val_metrics=pd.DataFrame(val_rows).sort_values(['Evaluation','MAE'])
val_metrics.to_csv(out+'/validation_metrics.csv',index=False)
pd.DataFrame({'Model':ensemble_names,'Validation_Ensemble_Weight':weights}).to_csv(out+'/ensemble_weights.csv',index=False)
# feature importance from final models
fi=[]
for name,model in models.items():
    if hasattr(model,'feature_importances_'):
        fi.extend([{'Model':name,'Feature':f,'Importance':float(v)} for f,v in zip(feature_cols,model.feature_importances_)])
pd.DataFrame(fi).sort_values(['Model','Importance'],ascending=[True,False]).to_csv(out+'/feature_importance.csv',index=False)
# test predictions, limit to a sample to keep artifact small
pred_cols=['StationId','Datetime','PM2.5','target_next_hour','diwali_window_3d','diwali_window_7d']
pred_df=test[pred_cols].copy()
for name,p in final_preds.items(): pred_df[name+'_prediction']=p
pred_df.head(100000).to_csv(out+'/test_predictions_sample_100k.csv',index=False)
# summary and caveats
summary={
 'source_zip':os.path.basename(zip_path),'source_csv':'station_hour.csv','raw_rows':2589083,'modeling_subset_rows':int(len(df)),'modeling_station_count':int(df['StationId'].nunique()),'raw_columns':16,
 'date_min':str(df['Datetime'].min()),'date_max':str(df['Datetime'].max()),'stations':int(df['StationId'].nunique()),'selected_station_ids':sorted([str(x) for x in df['StationId'].cat.categories]),
 'pm25_nonmissing_rows':int(df['PM2.5'].notna().sum()),'pm25_nonmissing_pct':float(df['PM2.5'].notna().mean()*100),
 'valid_next_hour_target_rows':int(len(data)),'train_sample_rows':int(len(train)),'validation_rows':int(len(val)),'test_rows':int(len(test)),
 'training_strategy':'Chronological: train <=2017; validate on 2018 and estimate ensemble weights; test on 2019 without refitting. Model uses 15 stations with the most non-missing PM2.5 observations; training fit capped at 100,000 rows; all validation/test rows in selected stations evaluated.',
 'target':'PM2.5 at exactly the next hourly timestamp for the same station',
 'diwali_dates':festival_dates,
 'weather_fire_status':'Not merged: uploaded archive contains no weather, traffic, active-fire or satellite imagery data. The analysis therefore tests pollution-history and calendar features only.',
 'important_caveats':['The dataset ends 2020-07-01 and cannot validate Diwali 2020 or 2026.','StationCode is an encoded station identifier and should not be interpreted as a numeric spatial coordinate.','Diwali dates are calendar features; Diwali-window evaluation depends on observations available in each year.','Lag features are based on available station records; exact time-gap checks are applied to explicit lags and next-hour targets.','Model scores are empirical on this split and do not guarantee generalization to new cities or future years.']
}
with open(out+'/run_summary.json','w') as f: json.dump(summary,f,indent=2)
# write a concise report
with open(out+'/README.txt','w') as f:
    f.write('DIWALI AIR QUALITY PREDICTION — EXPERIMENT REPORT\n\n')
    f.write(f"Source rows: {summary['raw_rows']:,}; modeling subset rows: {summary['modeling_subset_rows']:,}; selected stations: {summary['modeling_station_count']}; dates: {summary['date_min']} to {summary['date_max']}\n")
    f.write(f"PM2.5 nonmissing: {summary['pm25_nonmissing_rows']:,} ({summary['pm25_nonmissing_pct']:.1f}%)\n")
    f.write(f"Valid next-hour target rows: {summary['valid_next_hour_target_rows']:,}\n")
    f.write(f"Training sample rows: {summary['train_sample_rows']:,}; validation rows: {summary['validation_rows']:,}; 2019 test rows: {summary['test_rows']:,}\n\n")
    f.write('TOP TEST RESULTS BY EVALUATION WINDOW (lower MAE/RMSE is better)\n')
    for ev in ['All_2019','Diwali_7d','Diwali_3d']:
        sub=metrics_df[metrics_df.Evaluation==ev].sort_values('MAE')
        f.write('\n'+ev+'\n')
        f.write(sub[['Model','n','MAE','RMSE']].to_string(index=False,float_format=lambda x:f'{x:.3f}')+'\n')
    f.write('\nVALIDATION-OPTIMIZED ENSEMBLE WEIGHTS\n')
    f.write(pd.DataFrame({'Model':ensemble_names,'Weight':weights}).to_string(index=False)+'\n')
    f.write('\nWEATHER / FIRE EXTENSIONS\nNot evaluated because no matched weather or fire data was included in the uploaded ZIP. Add timestamped hourly weather (temperature, dew point, wind speed/direction, rainfall) and geolocated active-fire observations (time, coordinates, FRP/confidence) before claiming those features improve the model.\n')
    f.write('\nLIMITATIONS\n')
    for c in summary['important_caveats']: f.write('- '+c+'\n')
# Save reproducible analysis script and a merge-ready weather/fire integration template
import shutil
shutil.copy('/tmp/run_air.py', out+'/run_analysis.py')
with open(out+'/weather_fire_integration_template.py','w') as f:
    f.write('''\"\"\"Template: merge independently downloaded hourly weather and satellite fire data.\
\
Required files:\n- station_coordinates.csv: StationId, latitude, longitude\n- hourly_weather.csv: StationId or City, Datetime, temperature_2m, dewpoint_2m, wind_speed_10m, wind_direction_10m, precipitation\n- fire_detections.csv: acquisition_datetime, latitude, longitude, frp, confidence\n\nThis template intentionally does not fabricate coordinates or environmental observations.\"\"\"\nimport pandas as pd\nimport numpy as np\nfrom sklearn.neighbors import BallTree\n\ncoords = pd.read_csv(\"station_coordinates.csv\")\nweather = pd.read_csv(\"hourly_weather.csv\", parse_dates=[\"Datetime\"])\nfire = pd.read_csv(\"fire_detections.csv\", parse_dates=[\"acquisition_datetime\"])\n\n# Join weather by station and exact hour (or by City + Datetime if city-level weather is all that exists).\n# Use measured/forecast weather that would have been available at prediction time.\nbase = pd.read_csv(\"station_hour_features.csv\", parse_dates=[\"Datetime\"])\nbase = base.merge(weather, on=[\"StationId\", \"Datetime\"], how=\"left\")\n\n# Aggregate satellite fire detections within 25 km of each monitoring station and the preceding 24 hours.\n# Haversine distances use radians; the radius is a tunable modelling choice, not a physical plume boundary.\nstation_rad = np.radians(coords[[\"latitude\", \"longitude\"]].to_numpy())\nfire_rad = np.radians(fire[[\"latitude\", \"longitude\"]].to_numpy())\ntree = BallTree(fire_rad, metric=\"haversine\")\nfor idx, row in coords.iterrows():\n    nearby_idx = tree.query_radius(np.radians([[row.latitude, row.longitude]]), r=25/6371.0)[0]\n    # For each station-hour, count detections in the prior 24 hours and sum FRP.\n    # Apply time filtering after spatial filtering to avoid mixing detections from other dates.\n    station_fires = fire.iloc[nearby_idx].copy()\n    station_fires[\"StationId\"] = row.StationId\n    # Build hourly bins and merge these into base by StationId and Datetime after aggregation.\n    station_fires[\"Datetime\"] = station_fires[\"acquisition_datetime\"].dt.floor(\"h\")\n    # Aggregate same-hour observations; a production pipeline should also add 6h/24h trailing windows.\n    agg = station_fires.groupby([\"StationId\", \"Datetime\"]).agg(fire_count=(\"frp\", \"size\"), fire_frp_sum=(\"frp\", \"sum\")).reset_index()\n    base = base.merge(agg, on=[\"StationId\", \"Datetime\"], how=\"left\")\nbase[[\"fire_count\", \"fire_frp_sum\"]] = base[[\"fire_count\", \"fire_frp_sum\"]].fillna(0)\nbase.to_csv(\"station_hour_weather_fire_features.csv\", index=False)\n''')

# zip output files
import shutil
zip_out='/mnt/data/diwali_air_quality_analysis.zip'
with zipfile.ZipFile(zip_out,'w',zipfile.ZIP_DEFLATED) as zf:
    for fn in os.listdir(out): zf.write(os.path.join(out,fn),arcname='diwali_air_quality_analysis/'+fn)
print('DONE', zip_out)
print('Summary:',json.dumps(summary,indent=2))
print('\nTEST METRICS\n',metrics_df.to_string(index=False))
print('\nVALIDATION METRICS\n',val_metrics.to_string(index=False))
print('\nWEIGHTS\n',pd.DataFrame({'Model':ensemble_names,'Weight':weights}).to_string(index=False))
