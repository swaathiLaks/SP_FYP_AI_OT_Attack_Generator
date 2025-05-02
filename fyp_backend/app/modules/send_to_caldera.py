import yaml
import subprocess
import time
import threading
import socket
import os
import uuid
from datetime import datetime

# Global variable to store the process reference
caldera_process = None
CALDERA_PATH = "/home/kali/caldera"

def is_port_in_use(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        result = sock.connect_ex(("127.0.0.1", port))
        return result == 0

def check_caldera_status():
    if caldera_process and caldera_process.poll() is None:
        if is_port_in_use(8888):
            print("Caldera is running and the port 8888 is active.")
            return True
        else:
            print("Caldera process is running, but port 8888 is not active yet.")
    else:
        print("Caldera is not running.")
    return False

def send_to_caldera(file_path, data):
    with open(file_path, 'w') as outfile:
        yaml.dump(data, outfile, default_flow_style=False, sort_keys=False)
    print(f"Data successfully written to {file_path}")    

def start_caldera():
    global caldera_process
    print("was evoked")
    if caldera_process and caldera_process.poll() is None:
        print("Caldera is already running. Stop it first before starting again.")
        return

    try:
        print("Starting Caldera server...")

        caldera_process = subprocess.Popen(
            ["bash", "-c", "cd /home/kali/caldera && python3 server.py --build --insecure"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        print(f"Caldera process started with PID: {caldera_process.pid}")
        
        # Start separate threads for logging stdout and stderr
        def log_output(pipe, log_file):
            with open(log_file, 'w') as f:
                for line in iter(pipe.readline, ''):
                    f.write(line.strip() + '\n')
            pipe.close()

        stdout_thread = threading.Thread(target=log_output, args=(caldera_process.stdout, 'caldera_stdout.log'))
        stderr_thread = threading.Thread(target=log_output, args=(caldera_process.stderr, 'caldera_stderr.log'))

        stdout_thread.start()
        stderr_thread.start()

        return_code = caldera_process.wait()
        if return_code != 0:
            print(f"Caldera process exited with error code {return_code}. Check logs above for errors.")
        else:
            print("Caldera process started successfully.")

    except Exception as e:
        print("Error starting Caldera process:", e)

def terminate_caldera():
    global caldera_process
    if caldera_process and caldera_process.poll() is None:  # Check if the process is running
        print("Terminating Caldera process...")
        caldera_process.terminate()
        try:
            caldera_process.wait(timeout=5)  # Wait for the process to terminate gracefully
            print("Caldera process terminated.")
        except subprocess.TimeoutExpired:
            print("Forcing process termination...")
            caldera_process.kill()  # Force terminate if it doesn't stop gracefully
            print("Process forcefully terminated.")
        caldera_process = None
    else:
        print("No running Caldera process to terminate.")

def update_caldera(script_str):
    terminate_caldera()
    raw_script_list = script_str.splitlines()
    # file_path = os.path.join(CALDERA_PATH, 'plugins/atomic/data/abilities/discovery/c19e796f-4822-42df-a84d-97aef712.yml')
    # print(script_str)
    abilities_uuid_list = []
    for i, command in enumerate(raw_script_list):
        abilities_uuid = str(uuid.uuid4())
        abilities_uuid_list.append(abilities_uuid)
        abilities_file_data=[{
            'tactic': "impact",
            'technique_name': '-',
            'technique_id': '-',
            'name': f"CyberRanger command {datetime.now()}",
            'description': f'Created by CyberRanger ({abilities_uuid})',
            'executors': [{
                "name": "psh",
                "platform": "windows",
                "command": command[6:],
                "code": None,
                "language": None,
                "build_target": None,
                "payloads": [],
                "uploads": [],
                "timeout": 60,
                "parsers": [],
                "cleanup": [],
                "variations": [],
                "additional_info": {}
            }],
            "requirements": [],
            "privilege": '',
            "repeatable": False,
            "buckets": ['impact'],
            "additional_info": {},
            "access": {},
            "singleton": True,
            "plugin": '',
            "delete_payload": True,
            "id": abilities_uuid
        }]

        abilities_file_path = os.path.join(CALDERA_PATH, f'data/abilities/impact/{abilities_uuid}.yml')

        send_to_caldera(abilities_file_path, abilities_file_data)

    adversary_uuid = str(uuid.uuid4())
    adversary_file_data = {
        "name": "CyberRanger Export",
        "description": "This export will contain the commands from CyberRanger",
        "atomic_ordering": abilities_uuid_list,
        "adversary_id": adversary_uuid ,
        "objective": "495a9828-cab1-44dd-a0ca-66e58177d8cc"
    }
    adversary_file_path = os.path.join(CALDERA_PATH, f'data/adversaries/{adversary_uuid}.yml')
    send_to_caldera(adversary_file_path, adversary_file_data)

    start_caldera()

# Threading wrappers
def start_caldera_thread():
    thread = threading.Thread(target=start_caldera, daemon=True)
    thread.start()
    print("Caldera server is starting in a separate thread...")

def terminate_caldera_thread():
    thread = threading.Thread(target=terminate_caldera, daemon=True)
    thread.start()
    print("Caldera termination is running in a separate thread...")

def update_caldera_thread(script_str):
    thread = threading.Thread(target=update_caldera, args = {script_str}, daemon=True)
    thread.start()
    print("Caldera update is running in a separate thread...")