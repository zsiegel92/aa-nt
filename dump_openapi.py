from __future__ import annotations

import json
from pathlib import Path

from aa_to_nt_backend.app import webapp

Path("openapi.json").write_text(json.dumps(webapp.openapi(), indent=2))
