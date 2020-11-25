# MIT License

# Copyright (c) 2020 kmwebnet

# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:

# The above copyright notice and this permission notice shall be included in all
# copies or substantial portions of the Software.

# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
# SOFTWARE.

import os
import datetime
import pytz
import cryptography
import argparse
from cryptography import x509
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import ec


def random_cert_sn(size):
    """Create a positive, non-trimmable serial number for X.509 certificates"""
    raw_sn = bytearray(os.urandom(size))
    raw_sn[0] = raw_sn[0] & 0x7F # Force MSB bit to 0 to ensure positive integer
    raw_sn[0] = raw_sn[0] | 0x40 # Force next bit to 1 to ensure the integer won't be trimmed in ASN.1 DER encoding
    return int.from_bytes(raw_sn, byteorder='big', signed=False)


def load_or_create_key(filename, verbose=True, backend=None):
    if backend is None:
        backend = cryptography.hazmat.backends.default_backend()

    # Create or load a root CA key pair
    priv_key = None
    if os.path.isfile(filename):
        # Load existing key
        with open(filename, 'rb') as f:
            if verbose:
                print('    Loading from ' + f.name)
            priv_key = serialization.load_pem_private_key(
                data=f.read(),
                password=None,
                backend=backend)
    if priv_key == None:
        # No private key loaded, generate new one
        if verbose:
            print('    No key file found, generating new key')
        priv_key = ec.generate_private_key(ec.SECP256R1(), backend)
        # Save private key to file
        with open(filename, 'wb') as f:
            if verbose:
                print('    Saving to ' + f.name)
            pem_key = priv_key.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.PKCS8,
                encryption_algorithm=serialization.NoEncryption())
            f.write(pem_key)
    return priv_key


def create_root(o, cn, root_file, root_key_file):
    crypto_be = cryptography.hazmat.backends.default_backend()

    # Create or load a root CA key pair
    #print('\nRoot CA key')
    root_ca_priv_key = load_or_create_key(root_key_file, backend=crypto_be)

    # Create root CA certificate
    #print('\nGenerating self-signed root CA certificate')
    builder = x509.CertificateBuilder()
    builder = builder.serial_number(random_cert_sn(16))
    # Please note that the name of the root CA is also part of the signer certificate and thus, it's
    # part of certificate definition in the SAMG55 firmware (g_cert_elements_1_signer). If this name is
    # changed, it will also need to be changed in the firmware. The cert2certdef.py utility script can
    # help with regenerating the cert_def_1_signer.c file after making changes.


    builder = builder.issuer_name(x509.Name([
        x509.NameAttribute(x509.oid.NameOID.ORGANIZATION_NAME, o ),
        x509.NameAttribute(x509.oid.NameOID.COMMON_NAME, cn )]))
    builder = builder.not_valid_before(datetime.datetime.now(tz=pytz.utc))
    builder = builder.not_valid_after(builder._not_valid_before.replace(year=builder._not_valid_before.year + 25))
    builder = builder.subject_name(builder._issuer_name)
    builder = builder.public_key(root_ca_priv_key.public_key())
    builder = builder.add_extension(
        x509.SubjectKeyIdentifier.from_public_key(root_ca_priv_key.public_key()),
        critical=False)
    builder = builder.add_extension(
        x509.BasicConstraints(ca=True, path_length=None),
        critical=True)
    # Self-sign certificate
    root_ca_cert = builder.sign(
        private_key=root_ca_priv_key,
        algorithm=hashes.SHA256(),
        backend=crypto_be)

    # Write root CA certificate to file
    with open(root_file, 'wb') as f:
        #print('    Saving to ' + f.name)
        f.write(root_ca_cert.public_bytes(encoding=serialization.Encoding.PEM))
        print('CAcert create success')


if __name__ == '__main__':
    # Create argument parser to document script use
    parser = argparse.ArgumentParser(description='Create a root certificate and key for the ecosystem')
    parser.add_argument('--o',  help='Organization Unit')
    parser.add_argument('--cn',  help='Common Name')
    parser.add_argument('--cert', default='root-ca.crt', help='Certificate file of the root')
    parser.add_argument('--key', default='root-ca.key', help='Private Key file of the root')
    args = parser.parse_args()

    create_root(args.o, args.cn, args.cert, args.key)
    #print('\nDone')
