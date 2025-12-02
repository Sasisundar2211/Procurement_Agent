# Third-Party Notices and Licenses

This document lists all significant third-party dependencies used in the Procurement Price-Drift Detection Agent, their licenses, and compatibility notes with CC-BY-SA 4.0.

## Python Dependencies

| Package | License | Version | CC-BY-SA 4.0 Compatible? |
|---------|---------|---------|--------------------------|
| fastapi | MIT | 0.111.0 | ✅ Yes |
| uvicorn | BSD-3-Clause | 0.22.0 | ✅ Yes |
| pandas | BSD-3-Clause | 2.2.3 | ✅ Yes |
| pyarrow | Apache 2.0 | 16.0.0 | ✅ Yes |
| pdfplumber | MIT | 0.7.6 | ✅ Yes |
| pydantic | MIT | 2.7.4 | ✅ Yes |
| sqlalchemy | MIT | 2.0.30 | ✅ Yes |
| pytest | MIT | 7.4.0 | ✅ Yes |
| python-json-logger | BSD-2-Clause | 2.0.4 | ✅ Yes |
| prometheus-client | Apache 2.0 | 0.16.0 | ✅ Yes |
| httpx | BSD-3-Clause | 0.24.1 | ✅ Yes |
| pytest-asyncio | Apache 2.0 | 0.22.0 | ✅ Yes |
| google-generativeai | Apache 2.0 | 0.5.4 | ✅ Yes |
| psutil | BSD-3-Clause | - | ✅ Yes |

## JavaScript/Node.js Dependencies (Frontend)

| Package | License | CC-BY-SA 4.0 Compatible? |
|---------|---------|--------------------------|
| react | MIT | ✅ Yes |
| vite | MIT | ✅ Yes |
| tailwindcss | MIT | ✅ Yes |

## License Compatibility Notes

### MIT License
The MIT license is permissive and fully compatible with CC-BY-SA 4.0. Code licensed under MIT can be included in CC-BY-SA 4.0 licensed works.

### BSD Licenses (2-Clause, 3-Clause)
BSD licenses are permissive and compatible with CC-BY-SA 4.0. The main requirement is attribution, which is satisfied by this notice file.

### Apache 2.0 License
Apache 2.0 is compatible with CC-BY-SA 4.0 for use in a combined work. Note that Apache 2.0 includes patent grants that do not carry over to the CC-BY-SA 4.0 license.

## External Services and APIs

### Google Gemini API
- **License**: Google Gemini API Terms of Service
- **Usage**: Optional, for generating human-readable drift summaries
- **Note**: API outputs may have separate terms; review Google's Terms of Service for redistribution requirements
- **Compatibility**: ⚠️ Review required - API outputs should be reviewed before redistribution

### Kaggle Datasets
- **License**: Varies by dataset (SF Procurement Data is CC0/Public Domain)
- **Compatibility**: ✅ CC0 data is compatible with all licenses

## Models and Pretrained Weights

This repository does not include any pretrained model weights that require separate licensing. The core detection logic is rule-based and does not depend on externally trained models.

If future versions incorporate pretrained models with restrictive licenses (e.g., models with non-commercial clauses), they will be documented here with clear compatibility notes.

## Dependencies That Prevent Relicensing

**None identified.** All current dependencies use permissive licenses (MIT, BSD, Apache 2.0) that allow the combined work to be licensed under CC-BY-SA 4.0.

## TODO: Manual Review Required

- [ ] Verify google-generativeai API output terms for redistribution
- [ ] Review any additional npm dependencies in frontend/package.json

## Attribution

This project includes software developed by the open-source community. We thank all contributors to the packages listed above.

---

*Last updated: Auto-generated for Kaggle competition compliance*
