import socket
import sys

def check_port(host, port):
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(1)
        result = s.connect_ex((host, port))
        s.close()
        if result == 0:
            print(f"Port {port} on {host} is OPEN")
        else:
            print(f"Port {port} on {host} is CLOSED (code {result})")
    except Exception as e:
        print(f"Error checking {host}:{port}: {e}")

check_port('127.0.0.1', 8000)
check_port('localhost', 8000)
