import serial
from serial.tools import list_ports
import time
import sys

def select_port():
    ser = serial.Serial()

    ports = list_ports.comports()

    devices = [info.device for info in ports]

    if len(devices) == 0:
        sys.stderr.write("error: device not found")
        return None
    else:
        for i in range(len(devices)):
            print("%s" % (devices[i]), flush=True)

        print("serialport detected.", flush=True)

if __name__ == '__main__':
    select_port()
