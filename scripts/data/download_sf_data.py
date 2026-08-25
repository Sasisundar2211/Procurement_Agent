import kagglehub
import shutil
import os

# Download latest version
print("Downloading San Francisco Procurement Data...")
path = kagglehub.dataset_download("vineethakkinapalli/san-francisco-procurement-data")

print("Path to dataset files:", path)

# Copy the file to our data directory
target_dir = "data/sf_data"
os.makedirs(target_dir, exist_ok=True)

# Find the CSV file in the downloaded path
for file in os.listdir(path):
    if file.endswith(".csv"):
        source_file = os.path.join(path, file)
        target_file = os.path.join(target_dir, "sf_procurement.csv")
        shutil.copy(source_file, target_file)
        print(f"Copied {file} to {target_file}")
