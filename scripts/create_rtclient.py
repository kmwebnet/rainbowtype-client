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
from create_root import load_or_create_key

def cert_sn(size, builder):
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


def create_rtclient(cn, rtclient_file, rtclient_key_file, signer_file, signer_key_file):
    # Make sure files exist
    if not (os.path.isfile(signer_file) and os.path.isfile(signer_key_file) ):
        raise FileNotFoundError('Failed to find {}, {}, or {}'.format(signer_file, signer_key_file))

    # Setup cryptography
    be = cryptography.hazmat.backends.default_backend()

    # Create client cert key pair
    #print('\nrtclient Cert key')
    rtclient_priv_key = load_or_create_key(rtclient_key_file, backend=be)


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
    #print('\nCreate rtclient Certificate')
    builder = x509.CertificateBuilder()

    builder = builder.issuer_name(signer_ca_cert.subject)

    # Device cert must have minutes and seconds set to 0
    builder = builder.not_valid_before(datetime.datetime.now(tz=pytz.utc).replace(minute=0,second=0))

    # Should be year 9999, but this doesn't work on windows
    builder = builder.not_valid_after(datetime.datetime(3000, 12, 31, 23, 59, 59))

    builder = builder.subject_name(x509.Name([
        x509.NameAttribute(x509.oid.NameOID.COMMON_NAME, cn)]))

    builder = builder.public_key(rtclient_priv_key.public_key())

    # Device certificate is generated from certificate dates and public key
    builder = builder.serial_number(cert_sn(16, builder))

    # specific for client cert
    builder = builder.add_extension(
        x509.BasicConstraints(ca=False, path_length=None),
        critical=False)

    builder = builder.add_extension(
        x509.KeyUsage(digital_signature=True, content_commitment=True, key_encipherment=True,  data_encipherment=False, key_agreement=False, key_cert_sign=False, crl_sign=False, encipher_only=False, decipher_only=False),
        critical=False)

    builder = builder.add_extension(
        x509.ExtendedKeyUsage([x509.oid.ExtendedKeyUsageOID.CLIENT_AUTH]),
        critical=False)


    # Sign certificate
    rtclient_cert = builder.sign(private_key=signer_ca_priv_key, algorithm=hashes.SHA256(), backend=be)

    # Save certificate for reference
    #print('    Save rtclient Certificate to %s' % rtclient_file)
    with open(rtclient_file, 'wb') as f:
        f.write(rtclient_cert.public_bytes(encoding=serialization.Encoding.PEM))
        print('rtclientcert create success')


if __name__ == '__main__':
    # Create argument parser to document script use
    parser = argparse.ArgumentParser(description='Provisions the kit by requesting a CSR and returning signed certificates.')
    parser.add_argument('--cn',  help='Common Name')
    parser.add_argument('--rtclient',  help='rtclient Certificate (PEM)')
    parser.add_argument('--rtclientkey',  help='[IN/OUT] rtclient Private Key (PEM)')
    parser.add_argument('--signer', default='signer-ca.crt', help='Certificate file of the signer')
    parser.add_argument('--signerkey', default='signer-ca.key', help='Private Key file of the signer')
    args = parser.parse_args()

    create_rtclient(args.cn, args.rtclient, args.rtclientkey, args.signer, args.signerkey)

