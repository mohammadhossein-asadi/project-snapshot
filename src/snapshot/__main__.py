"""Allow running as: python -m snapshot"""

import sys
from .cli import main

sys.exit(main())
