"""Launch the FastAPI backend with uvicorn.

Usage:
    python run.py            # start on 127.0.0.1:8000 (debug reload)
    python run.py 8080       # custom port
    python run.py --host 0.0.0.0 --port 8080  # explicit host/port

Set HOST/PORT env vars to override defaults without CLI flags.
"""

import argparse
import os

import uvicorn


def main():
    parser = argparse.ArgumentParser(description="MRPL Workbench API server")
    parser.add_argument("--host", default=os.environ.get("HOST", "127.0.0.1"))
    parser.add_argument("--port", type=int, default=int(os.environ.get("PORT", 8000)))
    parser.add_argument("--no-reload", action="store_true", help="disable auto-reload")
    args = parser.parse_args()

    uvicorn.run(
        "backend.main:app",
        host=args.host,
        port=args.port,
        reload=not args.no_reload,
    )


if __name__ == "__main__":
    main()