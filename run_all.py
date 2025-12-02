import subprocess
import time
import sys
import os
import signal
import psutil

def kill_process_on_port(port):
    """Kills the process listening on the specified port."""
    for proc in psutil.process_iter(['pid', 'name']):
        try:
            for conn in proc.net_connections(kind='inet'):
                if conn.laddr.port == port:
                    print(f"⚠️  Port {port} is in use by {proc.info['name']} (PID: {proc.info['pid']}). Killing it...")
                    proc.kill()
                    return
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            pass

def run_all():
    # Define paths
    root_dir = os.path.dirname(os.path.abspath(__file__))
    frontend_dir = os.path.join(root_dir, "frontend")

    print("🚀 Starting Procurement Agent System...")

    # Ensure port 8000 is free
    kill_process_on_port(8000)

    # Start Backend
    print("🔹 Starting Backend (FastAPI)...")
    backend_process = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "src.api.fastapi_app:app", "--reload", "--port", "8000"],
        cwd=root_dir,
        shell=False
    )

    # Start Frontend
    print("🔹 Starting Frontend (Vite)...")
    # Use shell=True for npm on Windows to resolve the command correctly
    frontend_process = subprocess.Popen(
        ["npm", "run", "dev"],
        cwd=frontend_dir,
        shell=True
    )

    print("\n✅ System is running!")
    print("   - Backend: http://localhost:8000")
    print("   - Frontend: http://localhost:5173 (usually)")
    print("\nPress Ctrl+C to stop both servers.")

    try:
        while True:
            time.sleep(1)
            # Check if processes are still alive
            if backend_process.poll() is not None:
                print("❌ Backend process exited unexpectedly.")
                break
            if frontend_process.poll() is not None:
                print("❌ Frontend process exited unexpectedly.")
                break
    except KeyboardInterrupt:
        print("\n🛑 Stopping servers...")
    finally:
        # Terminate processes
        if backend_process.poll() is None:
            backend_process.terminate()
        
        # For shell=True on Windows, terminate might not kill the child process tree effectively without extra logic,
        # but for simple dev usage, this is usually "good enough" or requires taskkill.
        if sys.platform == "win32":
             # Try to kill backend if it's still running
             if backend_process.poll() is None:
                subprocess.call(['taskkill', '/F', '/T', '/PID', str(backend_process.pid)])
             
             # Try to kill frontend tree
             subprocess.call(['taskkill', '/F', '/T', '/PID', str(frontend_process.pid)])
        else:
            if frontend_process.poll() is None:
                frontend_process.terminate()
            backend_process.wait()
            frontend_process.wait()
        
        print("👋 Goodbye!")

if __name__ == "__main__":
    import argparse
    import glob
    parser = argparse.ArgumentParser(description="Run Procurement Agent System")
    parser.add_argument("--train", action="store_true", help="Run training before starting servers")
    parser.add_argument("--inference", action="store_true", help="Run inference before starting servers")
    parser.add_argument("--model-path", type=str, default=None, help="Model path for inference (auto-detected if not specified)")
    parser.add_argument("--servers-only", action="store_true", help="Only start backend/frontend servers")
    args = parser.parse_args()
    
    if args.train:
        print("🔹 Running training...")
        train_result = subprocess.run(
            [sys.executable, "train.py", "--data-path", "data/public", "--output-dir", "models", "--seed", "42"],
            cwd=os.path.dirname(os.path.abspath(__file__))
        )
        if train_result.returncode != 0:
            print("❌ Training failed")
            sys.exit(1)
        print("✅ Training completed")
    
    if args.inference:
        model_path = args.model_path
        if not model_path:
            # Auto-detect the most recent model
            model_dirs = sorted(glob.glob("models/procurement_model_*"))
            if model_dirs:
                model_path = model_dirs[-1]
                print(f"🔍 Auto-detected model: {model_path}")
            else:
                print("❌ No model found. Run with --train first or specify --model-path")
                sys.exit(1)
        print("🔹 Running inference...")
        inference_result = subprocess.run(
            [sys.executable, "inference.py", "--model-path", model_path, "--data-path", "data/public", "--print-samples"],
            cwd=os.path.dirname(os.path.abspath(__file__))
        )
        if inference_result.returncode != 0:
            print("❌ Inference failed")
            sys.exit(1)
        print("✅ Inference completed")
    
    if not args.train and not args.inference:
        # Default behavior: run servers
        run_all()
