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
import base64
import argparse
import pytz

import datetime
import cryptography
from cryptography import x509
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives import serialization


def device_cert_sn(size, builder):
    """Cert serial number is the SHA256(Subject public key + Encoded dates)"""

    # Setup cryptography
    be = cryptography.hazmat.backends.default_backend()

    # Get the public key as X and Y integers concatenated
    pub_nums = builder._public_key.public_numbers()
    pubkey =  pub_nums.x.to_bytes(32, byteorder='big', signed=False)
    pubkey += pub_nums.y.to_bytes(32, byteorder='big', signed=False)

    # Get the encoded dates
    expire_years = 0
    enc_dates = bytearray(b'\x00'*3)
    enc_dates[0] = (enc_dates[0] & 0x07) | ((((builder._not_valid_before.year - 2000) & 0x1F) << 3) & 0xFF)
    enc_dates[0] = (enc_dates[0] & 0xF8) | ((((builder._not_valid_before.month) & 0x0F) >> 1) & 0xFF)
    enc_dates[1] = (enc_dates[1] & 0x7F) | ((((builder._not_valid_before.month) & 0x0F) << 7) & 0xFF)
    enc_dates[1] = (enc_dates[1] & 0x83) | (((builder._not_valid_before.day & 0x1F) << 2) & 0xFF)
    enc_dates[1] = (enc_dates[1] & 0xFC) | (((builder._not_valid_before.hour & 0x1F) >> 3) & 0xFF)
    enc_dates[2] = (enc_dates[2] & 0x1F) | (((builder._not_valid_before.hour & 0x1F) << 5) & 0xFF)
    enc_dates[2] = (enc_dates[2] & 0xE0) | ((expire_years & 0x1F) & 0xFF)
    enc_dates = bytes(enc_dates)

    # SAH256 hash of the public key and encoded dates
    digest = hashes.Hash(hashes.SHA256(), backend=be)
    digest.update(pubkey)
    digest.update(enc_dates)
    raw_sn = bytearray(digest.finalize()[:size])
    raw_sn[0] = raw_sn[0] & 0x7F # Force MSB bit to 0 to ensure positive integer
    raw_sn[0] = raw_sn[0] | 0x40 # Force next bit to 1 to ensure the integer won't be trimmed in ASN.1 DER encoding
    return int.from_bytes(raw_sn, byteorder='big', signed=False)


def sign_device( device_key_file, signer_file, signer_key_file, o, cn):
    # Make sure files exist
    if not (os.path.isfile(signer_file) and os.path.isfile(signer_key_file)):
        raise FileNotFoundError('Failed to find {} or {}'.format(signer_file, signer_key_file))

    # Setup cryptography
    be = cryptography.hazmat.backends.default_backend()

    #print('\nLoad Device Public Key')
    # Load the public key
    public_key_pem = device_key_file.replace('\\n','\n').encode()

    # Convert the key into the cryptography format
    public_key = serialization.load_pem_public_key(public_key_pem, be)

    #print('\nLoad Signer')
    # Load the Signing key from the file
    #print('    Loading key from %s' % signer_key_file)
    with open(signer_key_file, 'rb') as f:
        signer_ca_priv_key = serialization.load_pem_private_key(data=f.read(), password=None, backend=be)

    # Load the Signing Certificate from the file
    #print('    Loading certificate from %s' % signer_file)
    with open(signer_file, 'rb') as f:
        signer_ca_cert = x509.load_pem_x509_certificate(f.read(), be)


    # Build certificate
    #print('\nCreate Device Certificate template')
    builder = x509.CertificateBuilder()

    builder = builder.issuer_name(signer_ca_cert.subject)

    # Device cert must have minutes and seconds set to 0
    builder = builder.not_valid_before(datetime.datetime.now(tz=pytz.utc).replace(minute=0,second=0))

    # Should be year 9999, but this doesn't work on windows
    builder = builder.not_valid_after(datetime.datetime(3000, 12, 31, 23, 59, 59))

    builder = builder.subject_name(x509.Name([
        x509.NameAttribute(x509.oid.NameOID.ORGANIZATION_NAME, o),
        x509.NameAttribute(x509.oid.NameOID.COMMON_NAME, cn)]))

    builder = builder.public_key(public_key)

    # Device certificate is generated from certificate dates and public key
    builder = builder.serial_number(device_cert_sn(16, builder))

    # Subject Key ID is used as the thing name and MQTT client ID and is required for this demo
    builder = builder.add_extension(
        x509.SubjectKeyIdentifier.from_public_key(public_key),
        critical=False)

    issuer_ski = signer_ca_cert.extensions.get_extension_for_class(x509.SubjectKeyIdentifier)
    builder = builder.add_extension(
        x509.AuthorityKeyIdentifier.from_issuer_subject_key_identifier(issuer_ski.value),
        critical=False)

    # Sign certificate
    device_cert = builder.sign(private_key=signer_ca_priv_key, algorithm=hashes.SHA256(), backend=be)

    # Save certificate for reference
    devcert_pem = device_cert.public_bytes(encoding=serialization.Encoding.PEM)
    print(devcert_pem.decode())
    print('rtclientcert create success')

if __name__ == '__main__':
    # Create argument parser to document script use
    parser = argparse.ArgumentParser(description='')
    parser.add_argument('--devicekey', default='', help='Device Public Key (PEM)')
    parser.add_argument('--signer', default='signer-ca.crt', help='Certificate file of the signer')
    parser.add_argument('--signerkey', default='signer-ca.key', help='Private Key file of the signer')
    parser.add_argument('--o', default='', help='organization unit')
    parser.add_argument('--cn', default='', help='common name')
    args = parser.parse_args()

    sign_device(args.devicekey, args.signer, args.signerkey, args.o, args.cn)


