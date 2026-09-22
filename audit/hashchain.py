"""
SHA-256 hash-chain audit log.

Every routing decision, model swap, confidence score, and escalation gets
appended as a JSON-Lines entry. Each entry includes the SHA-256 hash of
(previous_hash + current_entry_json), forming a tamper-evident chain.
Modify one line and the chain breaks — that's the live proof.
"""

import hashlib
import json
import os
import threading
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple


_LOG_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".audit"
)
_LOG_PATH = os.path.join(_LOG_DIR, "log.jsonl")

_GENESIS_HASH = "0" * 64  # first entry's previous hash


class AuditLog:
    """Append-only, hash-chained audit log persisted as JSON-Lines."""

    def __init__(self, log_path: str = _LOG_PATH):
        self.log_path = log_path
        self._lock = threading.Lock()
        os.makedirs(os.path.dirname(self.log_path), exist_ok=True)

    # ------------------------------------------------------------------
    # Write
    # ------------------------------------------------------------------

    def append(self, event: Dict[str, Any]) -> Dict[str, Any]:
        """Append an event dict to the log. Returns the full entry with hash."""
        with self._lock:
            prev_hash = self._last_hash()
            entry = {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "event": event,
                "prev_hash": prev_hash,
            }
            # Hash = SHA-256(prev_hash + canonical JSON of entry-without-hash)
            raw = prev_hash + json.dumps(entry, sort_keys=True)
            entry["hash"] = hashlib.sha256(raw.encode("utf-8")).hexdigest()

            with open(self.log_path, "a", encoding="utf-8") as f:
                f.write(json.dumps(entry, sort_keys=True) + "\n")

            return entry

    # ------------------------------------------------------------------
    # Read / verify
    # ------------------------------------------------------------------

    def get_entries(self) -> List[Dict[str, Any]]:
        """Return all log entries as a list of dicts."""
        if not os.path.exists(self.log_path):
            return []
        entries = []
        with open(self.log_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line:
                    entries.append(json.loads(line))
        return entries

    def verify(self) -> Tuple[bool, Optional[int]]:
        """Walk the chain and verify every hash.

        Returns (True, None) if the chain is intact, or
        (False, index) where index is the first broken entry.
        """
        entries = self.get_entries()
        if not entries:
            return True, None

        prev_hash = _GENESIS_HASH
        for idx, entry in enumerate(entries):
            stored_hash = entry.get("hash", "")
            # Reconstruct what was hashed
            check_entry = {k: v for k, v in entry.items() if k != "hash"}
            raw = prev_hash + json.dumps(check_entry, sort_keys=True)
            expected = hashlib.sha256(raw.encode("utf-8")).hexdigest()
            if stored_hash != expected:
                return False, idx
            prev_hash = stored_hash

        return True, None

    def clear(self):
        """Delete the log file (for testing only)."""
        if os.path.exists(self.log_path):
            os.remove(self.log_path)

    # ------------------------------------------------------------------
    # Internal
    # ------------------------------------------------------------------

    def _last_hash(self) -> str:
        """Return the hash of the most recent entry, or the genesis hash."""
        if not os.path.exists(self.log_path):
            return _GENESIS_HASH
        last_line = ""
        with open(self.log_path, "r", encoding="utf-8") as f:
            for line in f:
                if line.strip():
                    last_line = line.strip()
        if not last_line:
            return _GENESIS_HASH
        return json.loads(last_line).get("hash", _GENESIS_HASH)
