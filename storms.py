# Export historical storms for frontend use
# Filter to storms that actually affected Tamil Nadu districts

import json

# Get storms that passed within the TN bounding box region
tn_storms = df_bob[
    df_bob['LAT'].between(7.5, 14.5) &
    df_bob['LON'].between(76.0, 82.5)
].copy()

# Build per-storm records
storm_records = []
for sid, group in tn_storms.groupby('SID'):
    group = group.sort_values('ISO_TIME')
    peak_row = group.loc[group['WMO_WIND'].idxmax()]
    storm_records.append({
        'sid':        sid,
        'name':       str(group['NAME'].iloc[0]).strip(),
        'season':     int(group['SEASON'].iloc[0]),
        'peak_wind':  float(peak_row['WMO_WIND']),
        'peak_pres':  float(peak_row['WMO_PRES']) if not pd.isna(peak_row['WMO_PRES']) else None,
        'track': [
            {
                'lat':  float(r['LAT']),
                'lon':  float(r['LON']),
                'wind': float(r['WMO_WIND']),
                'time': str(r['ISO_TIME']),
            }
            for _, r in group.iterrows()
        ]
    })

with open('/kaggle/working/cyclone_outputs/historical_storms.json', 'w') as f:
    json.dump(storm_records, f)

print(f"Exported {len(storm_records)} storms")
print(f"File size: {Path('/kaggle/working/cyclone_outputs/historical_storms.json').stat().st_size / 1024:.0f} KB")