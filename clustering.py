import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
import os

# Load data
df = pd.read_csv("data/CC GENERAL.csv")

# Data cleaning
df.drop(['CUST_ID'], axis=1, inplace=True)
df.fillna(df.mean(), inplace=True)

# Scaling
scaler = StandardScaler()
scaled_data = scaler.fit_transform(df)

# Clustering
kmeans = KMeans(n_clusters=4, random_state=42)
df['Cluster'] = kmeans.fit_predict(scaled_data)

# Create output folder
os.makedirs("output", exist_ok=True)

# Save result
df.to_csv("output/results.csv", index=False)

print("Clustering completed and results saved!")