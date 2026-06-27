from pathlib import Path
import sys


API_ROOT = Path(__file__).resolve().parents[1]
if str(API_ROOT) not in sys.path:
    sys.path.insert(0, str(API_ROOT))

from app.db import get_local_sqlite_path, init_local_database  # noqa: E402


def main() -> None:
    init_local_database(seed=True)
    print(f"local sqlite ready: {get_local_sqlite_path()}")


if __name__ == "__main__":
    main()
