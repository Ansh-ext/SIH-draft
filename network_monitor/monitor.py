"""
Network monitor for proving the air-gap constraint.

Continuously monitors system network connections using psutil,
filtering for connections originating from Python or Docker processes
that are NOT directed to localhost/127.0.0.1.

Run this in a separate terminal during the demo to visually prove
no external calls are being made.
"""

import time
import psutil
from datetime import datetime


def get_external_connections():
    """Find active network connections not pointing to localhost."""
    external_conns = []
    
    # Process names we care about
    target_procs = ["python", "python3", "docker", "dockerd", "containerd"]
    
    for conn in psutil.net_connections(kind='inet'):
        # Only look at established outbound connections (or SYN_SENT)
        if conn.status not in [psutil.CONN_ESTABLISHED, psutil.CONN_SYN_SENT]:
            continue
            
        # Ignore connections without a remote address
        if not conn.raddr:
            continue
            
        r_ip = conn.raddr.ip
        
        # Ignore localhost / loopback
        if r_ip.startswith("127.") or r_ip == "::1":
            continue
            
        # Ignore zero address
        if r_ip == "0.0.0.0" or r_ip == "::":
            continue

        try:
            # Try to get process name
            if conn.pid:
                proc = psutil.Process(conn.pid)
                pname = proc.name().lower()
                
                # Check if it's one of our target processes
                is_target = any(t in pname for t in target_procs)
                if is_target:
                    external_conns.append({
                        "pid": conn.pid,
                        "process": proc.name(),
                        "local_addr": f"{conn.laddr.ip}:{conn.laddr.port}",
                        "remote_addr": f"{conn.raddr.ip}:{conn.raddr.port}",
                        "status": conn.status
                    })
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            pass
            
    return external_conns


def monitor_loop(interval=1.0):
    """Run an infinite loop monitoring connections."""
    print("=" * 60)
    print("MRPL AIR-GAP NETWORK MONITOR")
    print("Watching for external connections from Python/Docker...")
    print("=" * 60)
    
    try:
        while True:
            conns = get_external_connections()
            timestamp = datetime.now().strftime("%H:%M:%S")
            
            # Clear line
            print(f"\r\033[K[{timestamp}] Active external connections: {len(conns)}", end="")
            
            if conns:
                print("\n\nVIOLATION DETECTED:")
                for c in conns:
                    print(f"  PID {c['pid']} ({c['process']}) -> {c['remote_addr']} [{c['status']}]")
                print("\nMonitoring...")
                
            time.sleep(interval)
            
    except KeyboardInterrupt:
        print("\nMonitoring stopped.")


if __name__ == "__main__":
    monitor_loop()
