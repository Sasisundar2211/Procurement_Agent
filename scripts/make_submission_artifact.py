import shutil, os, pathlib

ROOT = pathlib.Path(".").resolve()
SUB = ROOT/"submission"

if SUB.exists():
    shutil.rmtree(SUB)
SUB.mkdir()


shutil.copytree(ROOT/"src", SUB/"src")
shutil.copytree(ROOT/"frontend", SUB/"frontend", ignore=shutil.ignore_patterns("node_modules", ".git"))


(SUB/"data").mkdir(exist_ok=True)
if (ROOT/"data"/"public").exists():
    shutil.copytree(ROOT/"data"/"public", SUB/"data"/"public")

# Copy Scripts
shutil.copy(ROOT/"data_generator.py", SUB/"data_generator.py")
shutil.copy(ROOT/"ingest_sf_data.py", SUB/"ingest_sf_data.py")
shutil.copy(ROOT/"run_all.py", SUB/"run_all.py")

# Copy Documentation
shutil.copy(ROOT/"README.md", SUB/"README.md")
shutil.copy(ROOT/"SUBMISSION_WRITEUP.md", SUB/"SUBMISSION_WRITEUP.md")
shutil.copy(ROOT/"LICENSE", SUB/"LICENSE")
if (ROOT/"compliance.md").exists():
    shutil.copy(ROOT/"compliance.md", SUB/"compliance.md")

with open(SUB/"SUBMISSION_MANIFEST.txt","w") as f:
    f.write("This artifact is submission-ready. No private labels included.")

print("Submission artifact ready at ./submission")