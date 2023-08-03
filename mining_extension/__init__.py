import time
import json
import socket
import requests

__status__ = "Development"


def get_local_ip():
    hostname = socket.gethostname()
    return socket.gethostbyname(hostname)


def check_logging(url="127.0.0.1"):
    current_time = time.time()
    formatted_time = time.strftime('%Y-%m-%dT%H:%M:%S', time.gmtime(current_time))

    data = {'time': str(formatted_time), 'kernel_id': 'TEST', 'cell_output': None, 'cell_source': None}
    response = requests.post(url, json=data)

    if response.status_code == 200:
        print('Request successful!')
    else:
        raise Exception(f"Request failed with status code: {response.status_code}")


def _jupyter_nbextension_paths():
    return [dict(
        section="notebook",
        src="static",
        dest="mining_extension",
        require="mining_extension/main")]
