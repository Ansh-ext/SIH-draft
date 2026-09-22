"""
Config-driven model registry. Adding a model means adding a YAML entry in
registry.yaml, not touching this file or the router. get_candidates()
returns the best-fit models for a task type, ranked by benchmark_score,
optionally filtered to what fits in the available VRAM.

The parsed YAML is cached (lru_cache) so the file is only read and parsed
once per process — call reload_registry() after editing the YAML by hand
during development to pick up changes without restarting.
"""

import os
from dataclasses import dataclass
from functools import lru_cache
from typing import List

import yaml

_CONFIG_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "registry.yaml")


@dataclass
class ModelEntry:
    model_id: str
    ollama_tag: str
    task_types: List[str]
    vram_mb: int
    quantization: str
    benchmark_score: float = 0.0


@lru_cache(maxsize=1)
def _load_registry():
    with open(_CONFIG_PATH) as f:
        raw = yaml.safe_load(f)
    return tuple(ModelEntry(**entry) for entry in raw["models"])


def get_candidates(task_type, max_vram_mb=None):
    entries = _load_registry()
    matches = [e for e in entries if task_type in e.task_types]
    if max_vram_mb is not None:
        matches = [e for e in matches if e.vram_mb <= max_vram_mb]
    return sorted(matches, key=lambda e: e.benchmark_score, reverse=True)


def reload_registry():
    _load_registry.cache_clear()
