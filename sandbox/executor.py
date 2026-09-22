"""
Docker-based code execution sandbox.

Runs user/agent-generated code inside a container with:
  --network none     (air-gapped — no outbound calls)
  --memory 256m      (bounded memory)
  --cpus 0.5         (bounded CPU)
  --user nobody      (non-root)
  timeout            (hard kill after N seconds)

Falls back to a subprocess-based sandbox (with warnings) when Docker
is unavailable on the dev machine.
"""

import os
import shutil
import subprocess
import tempfile
from dataclasses import dataclass
from typing import Optional


@dataclass
class SandboxResult:
    stdout: str
    stderr: str
    exit_code: int
    timed_out: bool = False
    engine: str = "docker"  # or "subprocess"


# --------------------------------------------------------------------------
# Docker execution
# --------------------------------------------------------------------------

_DOCKER_IMAGE = "python:3.12-slim"


def _docker_available() -> bool:
    """Check if docker CLI is present and the daemon is reachable."""
    try:
        result = subprocess.run(
            ["docker", "info"],
            capture_output=True,
            timeout=5,
        )
        return result.returncode == 0
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return False


def _run_docker(code: str, language: str = "python", timeout: int = 30) -> SandboxResult:
    """Execute code in a Docker container with --network none."""
    ext = {"python": ".py", "bash": ".sh", "javascript": ".js"}.get(language, ".py")
    interpreter = {"python": "python", "bash": "bash", "javascript": "node"}.get(language, "python")

    tmpdir = tempfile.mkdtemp(prefix="mrpl_sandbox_")
    code_path = os.path.join(tmpdir, f"script{ext}")
    with open(code_path, "w", encoding="utf-8") as f:
        f.write(code)

    try:
        cmd = [
            "docker", "run", "--rm",
            "--network", "none",
            "--memory", "256m",
            "--cpus", "0.5",
            "--user", "nobody",
            "-v", f"{tmpdir}:/sandbox:ro",
            "-w", "/sandbox",
            _DOCKER_IMAGE,
            interpreter, f"script{ext}",
        ]
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=timeout,
        )
        return SandboxResult(
            stdout=result.stdout,
            stderr=result.stderr,
            exit_code=result.returncode,
            engine="docker",
        )
    except subprocess.TimeoutExpired:
        return SandboxResult(
            stdout="",
            stderr=f"Execution timed out after {timeout}s",
            exit_code=124,
            timed_out=True,
            engine="docker",
        )
    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)


# --------------------------------------------------------------------------
# Subprocess fallback (less secure, for dev without Docker)
# --------------------------------------------------------------------------

def _run_subprocess(code: str, language: str = "python", timeout: int = 30) -> SandboxResult:
    """Fallback: run code via subprocess (no network isolation)."""
    print("[sandbox] WARNING: Docker unavailable — using subprocess fallback (no network isolation)")

    ext = {"python": ".py", "bash": ".sh", "javascript": ".js"}.get(language, ".py")
    interpreter = {"python": "python", "bash": "bash", "javascript": "node"}.get(language, "python")

    tmpdir = tempfile.mkdtemp(prefix="mrpl_sandbox_")
    code_path = os.path.join(tmpdir, f"script{ext}")
    with open(code_path, "w", encoding="utf-8") as f:
        f.write(code)

    try:
        result = subprocess.run(
            [interpreter, code_path],
            capture_output=True,
            text=True,
            timeout=timeout,
            cwd=tmpdir,
        )
        return SandboxResult(
            stdout=result.stdout,
            stderr=result.stderr,
            exit_code=result.returncode,
            engine="subprocess",
        )
    except subprocess.TimeoutExpired:
        return SandboxResult(
            stdout="",
            stderr=f"Execution timed out after {timeout}s",
            exit_code=124,
            timed_out=True,
            engine="subprocess",
        )
    except FileNotFoundError:
        return SandboxResult(
            stdout="",
            stderr=f"Interpreter '{interpreter}' not found",
            exit_code=127,
            engine="subprocess",
        )
    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)


# --------------------------------------------------------------------------
# Public API
# --------------------------------------------------------------------------

def run_sandboxed(
    code: str,
    language: str = "python",
    timeout: int = 30,
    force_subprocess: bool = False,
) -> SandboxResult:
    """Execute code in the safest available sandbox.

    Tries Docker first (--network none, memory/CPU limited, non-root).
    Falls back to subprocess if Docker is unavailable.
    """
    if not force_subprocess and _docker_available():
        return _run_docker(code, language, timeout)
    return _run_subprocess(code, language, timeout)
