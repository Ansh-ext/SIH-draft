import json
import pathlib
from threading import Lock

_MEMORY_PATH = pathlib.Path(__file__).resolve().parents[1] / "memory.json"
_LOCK = Lock()

def _ensure_file():
    if not _MEMORY_PATH.exists():
        _MEMORY_PATH.write_text("{}", encoding="utf-8")

def load_memory() -> dict:
    """Return the whole memory dict. Thread‑safe."""
    _ensure_file()
    with _LOCK, _MEMORY_PATH.open("r", encoding="utf-8") as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return {}

def save_memory(data: dict) -> None:
    """Overwrite the memory file atomically."""
    _ensure_file()
    tmp_path = _MEMORY_PATH.with_suffix(".tmp")
    with _LOCK, tmp_path.open("w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    tmp_path.replace(_MEMORY_PATH)
