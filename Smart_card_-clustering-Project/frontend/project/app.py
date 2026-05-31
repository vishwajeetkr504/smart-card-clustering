import os
import numpy as np
import pandas as pd
from flask import Flask, render_template, jsonify
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans

app = Flask(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "data", "CC GENERAL.csv")
OUTPUT_PATH = os.path.join(BASE_DIR, "output", "results.csv")

def run_clustering_analysis():
    # Load data dynamically using the safe absolute path
    if not os.path.exists(DATA_PATH):
        return None, f"Python looked for your file at: '{DATA_PATH}' but it is missing."
        
    df = pd.read_csv(DATA_PATH)
    original_df = df.copy()

    # Data cleaning
    if 'CUST_ID' in df.columns:
        df.drop(['CUST_ID'], axis=1, inplace=True)
    
    df = df.fillna(0)
    original_df = original_df.fillna(0)

    scaler = StandardScaler()
    scaled_data = scaler.fit_transform(df)

    # Clustering
    kmeans = KMeans(n_clusters=4, random_state=42)
    clusters = kmeans.fit_predict(scaled_data)
    
    df['Cluster'] = clusters
    original_df['Cluster'] = clusters

    os.makedirs(os.path.join(BASE_DIR, "output"), exist_ok=True)
    original_df.to_csv(OUTPUT_PATH, index=False)

    cluster_counts = df['Cluster'].value_counts().sort_index()
    cluster_profile = df.groupby('Cluster')[['BALANCE', 'PURCHASES', 'CREDIT_LIMIT', 'PAYMENTS']].mean().round(2)

    cluster_profile = cluster_profile.replace({np.nan: 0, float('nan'): 0})
    sample_records = original_df.head(10).to_dict(orient="records")
    
    for row in sample_records:
        for key, val in row.items():
            if pd.isna(val) or val != val:  
                row[key] = 0
            elif isinstance(val, (np.int64, np.int32)):
                row[key] = int(val)
            elif isinstance(val, (np.float64, np.float32)):
                row[key] = float(val)

    summary_data = {
        "total_customers": int(len(df)),
        "num_clusters": 4,
        "cluster_distribution": {f"Cluster {i}": int(count) for i, count in enumerate(cluster_counts)},
        "profiles": {
            f"Cluster {i}": {
                "avg_balance": float(cluster_profile.loc[i, 'BALANCE']) if not pd.isna(cluster_profile.loc[i, 'BALANCE']) else 0.0,
                "avg_purchases": float(cluster_profile.loc[i, 'PURCHASES']) if not pd.isna(cluster_profile.loc[i, 'PURCHASES']) else 0.0,
                "avg_credit_limit": float(cluster_profile.loc[i, 'CREDIT_LIMIT']) if not pd.isna(cluster_profile.loc[i, 'CREDIT_LIMIT']) else 0.0,
                "avg_payments": float(cluster_profile.loc[i, 'PAYMENTS']) if not pd.isna(cluster_profile.loc[i, 'PAYMENTS']) else 0.0
            } for i in range(4)
        },
        "sample_rows": sample_records
    }
    
    return summary_data, None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/analytics')
def get_analytics():
    summary, error = run_clustering_analysis()
    if error:
        return jsonify({"success": False, "error": error}), 400
    return jsonify({"success": True, "summary": summary})

if __name__ == '__main__':
    app.run(debug=True)