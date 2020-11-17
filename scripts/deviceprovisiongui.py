import serial
import serial.tools.list_ports
import time
import binascii
import os
import sys
import argparse
from create_device import create_device

# definition of read and write
def uart_write_read(w_data, r_size):
    # Write
    ser.write(w_data)
    print('Send: '+ str(w_data))

    ser.flush()
    time.sleep(0.5)
    # Read
    r_data = ser.read_all().decode('utf-8', "backslashreplace")
    print('Recv: ' + str(r_data))

    return r_data

def uart_read(r_size):
    # Read
    r_data = ser.read_all().decode('utf-8', "backslashreplace")
    print('Recv: ' + str(r_data))

    return r_data



# main routine
def deviceprovision(use_port, work_dir, signer_file, signer_key_file, rootkeyfile,  ou):
# Init Serial Port Setting
    global ser
    ser = serial.Serial(port = use_port ,
    bytesize = serial.EIGHTBITS ,
    parity = serial.PARITY_NONE,
    stopbits = serial.STOPBITS_ONE ,
    baudrate = 115200 ,
    timeout = 1
    )

# establishing handshake
    r_size = 5000
    r_data = uart_read( r_size)

    for i in range (20):
        time.sleep(1)
        w_data = b'r'
        r_data = uart_write_read(w_data, r_size)
        time.sleep(5)

        if 'Ready.' in r_data :
            print('communication ready.')
            break

# get device serial number

    for i in range (5):
        time.sleep(1)
        w_data = b's'
        r_data = uart_write_read(w_data, r_size)

        if len(r_data) > 0 :
            with open(work_dir + '{}-serial.txt'.format(r_data), 'w' ) as f:
                f.write(r_data)
                commonname = r_data
            print('got serial number.'+commonname)
            break

    filename = "%s-device-pubkey.pem" % r_data
    target_filename = "%s-device.crt" % r_data

# get device public key if it isnt exist
    if not os.path.exists('{}'.format(filename)):
        time.sleep(1)

        for i in range (5):
            time.sleep(5)
            w_data = b'k'
            r_data = uart_write_read(w_data, r_size)

            if len(r_data) > 0 :
                with open(work_dir + '{}'.format(filename), 'w', encoding="utf-8" ,newline="\n") as f:
                    f.write(r_data.replace('\r', ''))
                    print('got device public key.')
                    break

# make device certificate

    create_device(work_dir + '{}'.format(target_filename), work_dir + '{}'.format(filename), signer_file, signer_key_file, ou, '{}'.format(commonname))
    time.sleep(5)

# signer certificate transmission start

    time.sleep(5)
    w_data = b'c'
    r_data = uart_write_read(w_data, r_size)

    f = open(signer_file)
    columns = f.read().replace('\r', '').split("\n")
    f.close()

    for column in columns:
        w_data = column.encode() + b'\n'
        r_data = uart_write_read(w_data, r_size)

# device certificate transmission start
    columns = ""

    ser.flush()

    time.sleep(1)
    w_data = b'v'
    r_data = uart_write_read(w_data, r_size)

    f = open(work_dir + '{}'.format(target_filename))
    columns = f.read().replace('\r', '').split("\n")
    f.close()

    for column in columns:
        w_data = column.encode() + b'\n'
        r_data = uart_write_read(w_data, r_size)

# root public key transmission start
    columns = ""

    ser.flush()

    time.sleep(1)
    w_data = b'b'
    r_data = uart_write_read(w_data, r_size)

    f = open(rootkeyfile)
    columns = f.read().replace('\r', '').split("\n")
    f.close()

    for column in columns:
        w_data = column.encode() + b'\n'
        r_data = uart_write_read(w_data, r_size)





#Verify

#    w_data = b'p'
#    r_data = uart_write_read(w_data, r_size)

#    ser.flush()

#    w_data = b'o'
#    r_data = uart_write_read(w_data, r_size)

#quit interactive mode and certificate provisioning start

    w_data = b'q'
    r_data = uart_write_read(w_data, r_size)

    time.sleep(3)

    r_data = uart_read(r_size)

    ser.flush()

    time.sleep(5)

    r_data = uart_read(r_size)

    ser.flush()

    time.sleep(5)

    r_data = uart_read(r_size)

    ser.flush()

    time.sleep(5)

    r_data = uart_read(r_size)

    time.sleep(5)
    ser.flush()

    w_data = b' '
    r_data = uart_write_read(w_data, r_size)

    time.sleep(5)
    ser.flush()

    r_data = uart_read(r_size)

    time.sleep(5)
    ser.flush()

    r_data = uart_read(r_size)

    ser.close()

    print('device provision finish.')


if __name__ == '__main__':
    # Create argument parser to document script use
    parser = argparse.ArgumentParser(description='')
    parser.add_argument('--port',  help='Serial port')
    parser.add_argument('--workdir',  help='work directory')
    parser.add_argument('--cert', default='signer-ca.crt', help='Certificate file of the signer')
    parser.add_argument('--key', default='signer-ca.key', help='Private Key file of the signer')
    parser.add_argument('--rootkey', default='root-pub.pem', help='public Key file of the Root')
    parser.add_argument('--o',  help='Organization Unit')
    args = parser.parse_args()

    deviceprovision(args.port , args.workdir,  args.cert, args.key, args.rootkey, args.o)
