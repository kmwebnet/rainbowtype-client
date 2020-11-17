# -*- coding: utf-8 -*-
import binascii
import string
import datetime
import argparse
from pyasn1_modules import pem, rfc2459, rfc3279, rfc2314
from pyasn1.codec.der import decoder, encoder
from pyasn1.type import univ


def main():
    # Create argument parser to document script use
    parser = argparse.ArgumentParser(description='Generate atcacert_def_t structure from sample certificate.')
    group = parser.add_argument_group('group')
    group.add_argument(
        '--signer-cert',
        dest='signer_cert_filename',
        nargs='?',
        default='signer-ca.crt',
        metavar='file',
        help='Generate signer certificate definition from sample certificate.')
    group.add_argument(
        '--device-cert',
        dest='device_cert_filename',
        nargs='?',
        default='device.crt',
        metavar='file',
        help='Generate device certificate definition from sample certificate.')

    args = parser.parse_args()

    if args.signer_cert_filename is not None:
        cert_der = pem.readPemFromFile(open(args.signer_cert_filename))
        print(gen_cert_def_c_signer(cert_der))


    if args.device_cert_filename is not None:
        cert_der = pem.readPemFromFile(open(args.device_cert_filename))
        print(gen_cert_def_c_device(cert_der))

    print('certdef output finishied')

    return

def gen_cert_def_c_signer(cert_der):
    cert = decoder.decode(cert_der, asn1Spec=rfc2459.Certificate())[0]

    params = {}

    # CA public key needs to be handled dynamically in the kit, so we can use fake data for now
    params['ca_public_key'] = bin_to_c_hex(b'\x00'*64)

    info = cert_sn_offset_length(cert)
    params['cert_sn_cert_loc_offset'] = info['offset']
    params['cert_sn_cert_loc_count']  = info['length']
    if info['length'] < 1 or info['length'] > 20:
        raise ValueError('Invalid certificate SN length (no more than 20 bytes).')

    not_before = set_time_params(params, cert, 'notBefore')
    not_after  = set_time_params(params, cert, 'notAfter')

    expire_years = not_after.year - not_before.year
    if expire_years < 1 or expire_years > 31:
        expire_years = 0
    params['expire_years'] = expire_years

    info = cert_signer_id_offset_length(cert, 'subject')
    params['signer_id_cert_loc_offset'] = info['offset']
    params['signer_id_cert_loc_count']  = info['length']

    info = cert_public_key_offset_length(cert)
    params['public_key_cert_loc_offset'] = info['offset']
    params['public_key_cert_loc_count']  = info['length']

    info = cert_subj_key_id_offset_length(cert)
    if info is not None:
        params['subj_key_id_cert_loc_offset'] = info['offset']
        params['subj_key_id_cert_loc_count']  = info['length']
    else:
        params['subj_key_id_cert_loc_offset'] = 0
        params['subj_key_id_cert_loc_count']  = 0

    info = cert_auth_key_id_offset_length(cert)
    if info is not None:
        params['auth_key_id_cert_loc_offset'] = info['offset']
        params['auth_key_id_cert_loc_count']  = info['length']
    else:
        params['auth_key_id_cert_loc_offset'] = 0
        params['auth_key_id_cert_loc_count']  = 0

    info = cert_tbs_offset_length(cert)
    params['tbs_cert_loc_offset'] = info['offset']
    params['tbs_cert_loc_count']  = info['length']

    info = cert_sig_offset_length(cert)
    params['signature_cert_loc_offset'] = info['offset']
    params['signature_cert_loc_count']  = info['length']

    params['cert_template'] = bin_to_c_hex(cert_der)

    return string.Template(cert_def_1_signer_c).substitute(params)

def gen_cert_def_c_device(cert_der):
    cert = decoder.decode(cert_der, asn1Spec=rfc2459.Certificate())[0]

    params = {}

    info = cert_sn_offset_length(cert)
    params['cert_sn_cert_loc_offset'] = info['offset']
    params['cert_sn_cert_loc_count']  = info['length']
    if info['length'] < 1 or info['length'] > 20:
        raise ValueError('Invalid certificate SN length (no more than 20 bytes).')

    info = cert_signer_id_offset_length(cert, 'issuer')
    params['signer_id_cert_loc_offset'] = info['offset']
    params['signer_id_cert_loc_count']  = info['length']

    not_before = set_time_params(params, cert, 'notBefore')
    not_after  = set_time_params(params, cert, 'notAfter')

    expire_years = not_after.year - not_before.year
    if expire_years < 1 or expire_years > 31:
        expire_years = 0
        # Don't bother re-setting notAfter
        params['expire_date_cert_loc_offset'] = 0
        params['expire_date_cert_loc_count']  = 0
    params['expire_years'] = expire_years

    info = cn_offset_length(cert)
    params['cn_loc_offset'] = info['offset']
    params['cn_loc_count']  = info['length']

    info = cert_public_key_offset_length(cert)
    params['public_key_cert_loc_offset'] = info['offset']
    params['public_key_cert_loc_count']  = info['length']

    info = cert_subj_key_id_offset_length(cert)
    if info is not None:
        params['subj_key_id_cert_loc_offset'] = info['offset']
        params['subj_key_id_cert_loc_count']  = info['length']
    else:
        params['subj_key_id_cert_loc_offset'] = 0
        params['subj_key_id_cert_loc_count']  = 0

    info = cert_auth_key_id_offset_length(cert)
    if info is not None:
        params['auth_key_id_cert_loc_offset'] = info['offset']
        params['auth_key_id_cert_loc_count']  = info['length']
    else:
        params['auth_key_id_cert_loc_offset'] = 0
        params['auth_key_id_cert_loc_count']  = 0

    info = cert_tbs_offset_length(cert)
    params['tbs_cert_loc_offset'] = info['offset']
    params['tbs_cert_loc_count']  = info['length']

    info = cert_sig_offset_length(cert)
    params['signature_cert_loc_offset'] = info['offset']
    params['signature_cert_loc_count']  = info['length']

    params['cert_template'] = bin_to_c_hex(cert_der)

    return string.Template(cert_def_2_device_c).substitute(params)



def set_time_params(params, cert, name):
    if name == 'notBefore':
        param_prefix = 'issue_date'
    elif name == 'notAfter':
        param_prefix = 'expire_date'

    info = cert_time_offset_length(cert, name)
    params[param_prefix + '_cert_loc_offset'] = info['offset']
    params[param_prefix + '_cert_loc_count']  = info['length']

    if info['length'] == 13:
        params[param_prefix + '_format'] = 'DATEFMT_RFC5280_UTC'
        time_str = str(cert['tbsCertificate']['validity'][name][0])
        dt = datetime.datetime.strptime(time_str, '%y%m%d%H%M%SZ')
    elif info['length'] == 15:
        params[param_prefix + '_format'] = 'DATEFMT_RFC5280_GEN'
        time_str = str(cert['tbsCertificate']['validity'][name][1])
        dt = datetime.datetime.strptime(time_str, '%Y%m%d%H%M%SZ')
    else:
        raise ValueError(name + ' date has invalid length')

    return dt

def bin_to_c_hex(data):
    c_hex = ""
    for i in range(0, len(data)):
        if i != 0:
            c_hex += ','
        if i % 16 == 0:
            if i != 0:
                c_hex += '\n'
            c_hex += '    '
        elif i % 8 == 0:
            c_hex += '  '
        else:
            c_hex += ' '
        c_hex += '0x%02x' % data[i]

    return c_hex

def cert_sn_offset_length(cert):
    sn_der = bytearray(encoder.encode(cert['tbsCertificate']['serialNumber']))
    int_info = der_value_offset_length(sn_der)
    msb_idx = int_info['offset']
    if sn_der[msb_idx] & 0x80:
        if sn_der[msb_idx] == 0x81:
            sn_der[msb_idx] = 0x82
        else:
            sn_der[msb_idx] = 0x81
    else:
        if sn_der[msb_idx] == 0x01:
            sn_der[msb_idx] = 0x02
        else:
            sn_der[msb_idx] = 0x01
    cert_der = encoder.encode(cert)
    cert_mod = decoder.decode(cert_der, asn1Spec=rfc2459.Certificate())[0]
    cert_mod['tbsCertificate']['serialNumber'] = decoder.decode(bytes(sn_der))[0]

    return {'offset':diff_offset(cert_der, encoder.encode(cert_mod)), 'length':int_info['length']}

def cert_signer_id_offset_length(cert, name):
    name_der = bytearray(encoder.encode(cert['tbsCertificate'][name]))
    name_der = name_der.replace(b'FFFF', b'0000')

    cert_der = encoder.encode(cert)
    cert_mod = decoder.decode(cert_der, asn1Spec=rfc2459.Certificate())[0]
    cert_mod['tbsCertificate'][name] = decoder.decode(bytes(name_der))[0]

    return {'offset':0, 'length':0}

def cert_time_offset_length(cert, name):
    cert_der = encoder.encode(cert)
    cert_mod = decoder.decode(cert_der, asn1Spec=rfc2459.Certificate())[0]
    time_str = str(cert_mod['tbsCertificate']['validity'][name].getComponent())
    time_str = chr(ord(time_str[0]) + 1) + time_str[1:]
    cert_mod['tbsCertificate']['validity'][name] = cert_mod['tbsCertificate']['validity'][name].getComponent().clone(
        value=time_str)

    return {'offset': diff_offset(cert_der, encoder.encode(cert_mod)), 'length': len(time_str)}

def cn_offset_length(cert):
    cmn_der = bytearray(encoder.encode(cert['tbsCertificate']['subject'][''][1]))
    cmn_info = der_value_offset_length(cmn_der)
    cmn_der[cmn_info['offset']+9] += 0x1

    cert_der = encoder.encode(cert)
    cert_mod = decoder.decode(cert_der, asn1Spec=rfc2459.Certificate())[0]

    cert_mod['tbsCertificate']['subject'][''][1] = decoder.decode(bytes(cmn_der))[0]

    return {'offset': diff_offset(cert_der, encoder.encode(cert_mod)), 'length': cmn_info['length']-9}


def cert_public_key_offset_length(cert):
    pk_der = bytearray(encoder.encode(cert['tbsCertificate']['subjectPublicKeyInfo']['subjectPublicKey']))
    pk_info = der_value_offset_length(pk_der)
    # Skip the unused bits field and key compression byte
    pk_der[pk_info['offset']+2] ^= 0xFF

    cert_der = encoder.encode(cert)
    cert_mod = decoder.decode(cert_der, asn1Spec=rfc2459.Certificate())[0]
    cert_mod['tbsCertificate']['subjectPublicKeyInfo']['subjectPublicKey'] = decoder.decode(bytes(pk_der))[0]

    return {'offset':diff_offset(cert_der, encoder.encode(cert_mod)), 'length':pk_info['length']-2}

def csr_public_key_offset_length(csr):
    pk_der = bytearray(encoder.encode(csr['certificationRequestInfo']['subjectPublicKeyInfo']['subjectPublicKey']))
    pk_info = der_value_offset_length(pk_der)
    # Skip the unused bits field and key compression byte
    pk_der[pk_info['offset']+2] ^= 0xFF

    csr_der = encoder.encode(csr)
    csr_mod = decoder.decode(csr_der, asn1Spec=rfc2314.CertificationRequest())[0]
    csr_mod['certificationRequestInfo']['subjectPublicKeyInfo']['subjectPublicKey'] = decoder.decode(bytes(pk_der))[0]

    return {'offset':diff_offset(csr_der, encoder.encode(csr_mod)), 'length':pk_info['length']-2}

def cert_subj_key_id_offset_length(cert):
    cert_der = encoder.encode(cert)
    cert_mod = decoder.decode(cert_der, asn1Spec=rfc2459.Certificate())[0]
    for ext in cert_mod['tbsCertificate']['extensions']:
        if ext['extnID'] == rfc2459.id_ce_subjectKeyIdentifier:
            extn_value = decoder.decode(ext['extnValue'])[0]
            key_id = bytearray(decoder.decode(extn_value, asn1Spec=rfc2459.SubjectKeyIdentifier())[0])
            key_id[0] ^= 0xFF # Change first byte

            extn_value = rfc2459.SubjectKeyIdentifier(key_id)
            ext['extnValue'] = univ.OctetString(encoder.encode(extn_value))

            return {'offset':diff_offset(cert_der, encoder.encode(cert_mod)), 'length':len(key_id)}
    return None

def cert_auth_key_id_offset_length(cert):
    cert_der = encoder.encode(cert)
    cert_mod = decoder.decode(cert_der, asn1Spec=rfc2459.Certificate())[0]
    for ext in cert_mod['tbsCertificate']['extensions']:
        if ext['extnID'] == rfc2459.id_ce_authorityKeyIdentifier:
            extn_value = decoder.decode(ext['extnValue'])[0]
            auth_key_id = decoder.decode(extn_value, asn1Spec=rfc2459.AuthorityKeyIdentifier())[0]
            key_id = bytearray(auth_key_id['keyIdentifier'])
            key_id[0] ^= 0xFF # Change first byte

            auth_key_id['keyIdentifier'] = auth_key_id['keyIdentifier'].clone(value=key_id)
            ext['extnValue'] = univ.OctetString(encoder.encode(auth_key_id))

            return {'offset':diff_offset(cert_der, encoder.encode(cert_mod)), 'length':len(key_id)}
    return None

def cert_tbs_offset_length(cert):
    cert_der = encoder.encode(cert)
    cert_info = der_value_offset_length(cert_der)
    tbs_info = der_value_offset_length(cert_der[cert_info['offset']:])

    return {'offset':cert_info['offset'], 'length':(tbs_info['offset'] + tbs_info['length'])}

def cert_sig_offset_length(cert):
    cert_der = encoder.encode(cert)

    cert_info = der_value_offset_length(cert_der)
    offset = cert_info['offset']

    tbs_info = der_value_offset_length(cert_der[offset:])
    offset += tbs_info['offset'] + tbs_info['length']

    alg_info = der_value_offset_length(cert_der[offset:])
    offset += alg_info['offset'] + alg_info['length']

    sig_info = der_value_offset_length(cert_der[offset:])

    return {'offset':offset, 'length':(sig_info['offset'] + sig_info['length'])}

def der_value_offset_length(der):
    """Returns the offset and length of the value part of the DER tag-length-value object."""

    tag_len = 1 # Assume 1 byte tag

    if der[tag_len] < 0x80:
        # Length is short-form, only 1 byte
        len_len = 1
        len = int(der[tag_len])
    else:
        # Length is long-form, lower 7 bits indicates how many additional bytes are required
        len_len = (der[tag_len] & 0x7F) + 1
        len = int().from_bytes(der[tag_len+1:tag_len+len_len], byteorder='big', signed=False)
    return {'offset':tag_len+len_len, 'length':len}

def diff_offset(base, diff):
    """Return the index where the two parameters differ."""
    if len(base) != len(diff):
        raise ValueError('len(base)=%d != len(diff)=%d' % (len(base), len(diff)))
    for i in range(0, len(base)):
        if base[i] != diff[i]:
            return i
    return None

cert_def_1_signer_c = """
#include "atcacert/atcacert_def.h"
#include "cert_chain.h"

uint8_t g_signer_1_ca_public_key[64] = {
${ca_public_key}
};

const atcacert_def_t g_cert_def_0_root = {
    .type                   = CERTTYPE_X509,
    .template_id            = 0,
    .public_key_dev_loc     = {
        .zone      = DEVZONE_DATA,
        .slot      = 15,
        .is_genkey = 0,
        .offset    = 0,
        .count     = 72
    }
};

const atcacert_cert_element_t g_cert_elements_1_signer[] = {
    {
        .id         = "IssueDate",
        .device_loc = {
            .zone      = DEVZONE_DATA,
            .slot      = 14,
            .is_genkey = 0,
            .offset    = 35-${issue_date_cert_loc_count},
            .count     = ${issue_date_cert_loc_count}
        },
        .cert_loc   = {
            .offset = ${issue_date_cert_loc_offset},
            .count  = ${issue_date_cert_loc_count}
        }
    },
    {
        .id         = "ExpireDate",
        .device_loc = {
            .zone      = DEVZONE_DATA,
            .slot      = 14,
            .is_genkey = 0,
            .offset    = 50-${expire_date_cert_loc_count},
            .count     = ${expire_date_cert_loc_count}
        },
        .cert_loc   = {
            .offset = ${expire_date_cert_loc_offset},
            .count  = ${expire_date_cert_loc_count}
        }
    }
};
const uint8_t g_cert_template_1_signer[] = {
${cert_template}
};
const atcacert_def_t g_cert_def_1_signer = {
    .type                   = CERTTYPE_X509,
    .template_id            = 1,
    .chain_id               = 0,
    .private_key_slot       = 0,
    .sn_source              = SNSRC_STORED,
    .cert_sn_dev_loc        = {
        .zone      = DEVZONE_DATA,
        .slot      = 14,
        .is_genkey = 0,
        .offset    = 20-${cert_sn_cert_loc_count},
        .count     = ${cert_sn_cert_loc_count}
    },
    .issue_date_format      = ${issue_date_format},
    .expire_date_format     = ${expire_date_format},
    .tbs_cert_loc           = {
        .offset = ${tbs_cert_loc_offset},
        .count  = ${tbs_cert_loc_count}
    },
    .expire_years           = ${expire_years},
    .public_key_dev_loc     = {
        .zone      = DEVZONE_DATA,
        .slot      = 11,
        .is_genkey = 0,
        .offset    = 0,
        .count     = 72
    },
    .comp_cert_dev_loc      = {
        .zone      = DEVZONE_DATA,
        .slot      = 12,
        .is_genkey = 0,
        .offset    = 0,
        .count     = 72
    },
    .std_cert_elements      = {
        { // STDCERT_PUBLIC_KEY
            .offset = ${public_key_cert_loc_offset},
            .count  = ${public_key_cert_loc_count}
        },
        { // STDCERT_SIGNATURE
            .offset = ${signature_cert_loc_offset},
            .count  = ${signature_cert_loc_count}
        },
        { // STDCERT_ISSUE_DATE
            .offset = ${issue_date_cert_loc_offset},
            .count  = ${issue_date_cert_loc_count}
        },
        { // STDCERT_EXPIRE_DATE
            .offset = ${expire_date_cert_loc_offset},
            .count  = ${expire_date_cert_loc_count}
        },
        { // STDCERT_SIGNER_ID
            .offset = ${signer_id_cert_loc_offset},
            .count  = ${signer_id_cert_loc_count}
        },
        { // STDCERT_CERT_SN
            .offset = ${cert_sn_cert_loc_offset},
            .count  = ${cert_sn_cert_loc_count}
        },
        { // STDCERT_AUTH_KEY_ID
            .offset = ${auth_key_id_cert_loc_offset},
            .count  = ${auth_key_id_cert_loc_count}
        },
        { // STDCERT_SUBJ_KEY_ID
            .offset = ${subj_key_id_cert_loc_offset},
            .count  = ${subj_key_id_cert_loc_count}
        }
    },
    .cert_elements          = g_cert_elements_1_signer,
    .cert_elements_count    = sizeof(g_cert_elements_1_signer) / sizeof(g_cert_elements_1_signer[0]),
    .cert_template          = g_cert_template_1_signer,
    .cert_template_size     = sizeof(g_cert_template_1_signer),
    .ca_cert_def            = &g_cert_def_0_root,
};
"""

cert_def_2_device_c = """
const atcacert_cert_element_t g_cert_elements_2_device[] = {
    {
        .id         = "common_name",
        .device_loc = {
            .zone      = DEVZONE_DATA,
            .slot      = 13,
            .is_genkey = 0,
            .offset    = 0,
            .count     = 18
        },
        .cert_loc   = {
            .offset = ${cn_loc_offset},
            .count  = ${cn_loc_count}
        }
    }
};

const uint8_t g_cert_template_2_device[] = {
${cert_template}
};
atcacert_def_t g_cert_def_2_device = {
    .type                   = CERTTYPE_X509,
    .template_id            = 2,
    .chain_id               = 0,
    .private_key_slot       = 0,
    .sn_source              = SNSRC_PUB_KEY_HASH,
    .cert_sn_dev_loc        = {
        .zone      = DEVZONE_NONE,
        .slot      = 0,
        .is_genkey = 0,
        .offset    = 0,
        .count     = 0
    },
    .issue_date_format      = ${issue_date_format},
    .expire_date_format     = ${expire_date_format},
    .tbs_cert_loc           = {
        .offset = ${tbs_cert_loc_offset},
        .count  = ${tbs_cert_loc_count}
    },
    .expire_years           = ${expire_years},
    .public_key_dev_loc     = {
        .zone      = DEVZONE_DATA,
        .slot      = 0,
        .is_genkey = 1,
        .offset    = 0,
        .count     = 64
    },
    .comp_cert_dev_loc      = {
        .zone      = DEVZONE_DATA,
        .slot      = 10,
        .is_genkey = 0,
        .offset    = 0,
        .count     = 72
    },
    .std_cert_elements      = {
        { // STDCERT_PUBLIC_KEY
            .offset = ${public_key_cert_loc_offset},
            .count  = ${public_key_cert_loc_count}
        },
        { // STDCERT_SIGNATURE
            .offset = ${signature_cert_loc_offset},
            .count  = ${signature_cert_loc_count}
        },
        { // STDCERT_ISSUE_DATE
            .offset = ${issue_date_cert_loc_offset},
            .count  = ${issue_date_cert_loc_count}
        },
        { // STDCERT_EXPIRE_DATE
            .offset = ${expire_date_cert_loc_offset},
            .count  = ${expire_date_cert_loc_count}
        },
        { // STDCERT_SIGNER_ID
            .offset = ${signer_id_cert_loc_offset},
            .count  = ${signer_id_cert_loc_count}
        },
        { // STDCERT_CERT_SN
            .offset = ${cert_sn_cert_loc_offset},
            .count  = ${cert_sn_cert_loc_count}
        },
        { // STDCERT_AUTH_KEY_ID
            .offset = ${auth_key_id_cert_loc_offset},
            .count  = ${auth_key_id_cert_loc_count}
        },
        { // STDCERT_SUBJ_KEY_ID
            .offset = ${subj_key_id_cert_loc_offset},
            .count  = ${subj_key_id_cert_loc_count}
        }
    },
    .cert_elements          = g_cert_elements_2_device,
    .cert_elements_count    = sizeof(g_cert_elements_2_device) / sizeof(g_cert_elements_2_device[0]),
    .cert_template          = g_cert_template_2_device,
    .cert_template_size     = sizeof(g_cert_template_2_device),
    .ca_cert_def            = &g_cert_def_1_signer,
};
"""



main()
