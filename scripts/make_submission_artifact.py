# scripts/make_submission_artifact.py
import shutil, os, pathlib
ROOT = pathlib.Path(".").resolve()
SUB = ROOT/"submission"
if SUB.exists():
    shutil.rmtree(SUB)
SUB.mkdir()
# Copy public data
shutil.copytree(ROOT/"data"/"public", SUB/"data")
# Copy code (except private and tests)
shutil.copytree(ROOT/"src", SUB/"src")
shutil.copy(ROOT/"README.md", SUB/"README.md")
shutil.copy(ROOT/"LICENSE", SUB/"LICENSE")
# create a manifest for reviewers
with open(SUB/"SUBMISSION_MANIFEST.txt","w") as f:
    f.write("This artifact is submission-ready. No private labels included.")
print("Submission artifact ready at ./submission")