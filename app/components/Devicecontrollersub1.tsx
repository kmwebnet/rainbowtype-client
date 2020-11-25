/*
MIT License

Copyright (c) 2020 kmwebnet

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

import React, { useState, useEffect } from 'react';
import fs from 'fs';
import { join } from 'path';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import { PythonShell, Options } from 'python-shell';
import * as Cert from 'pkijs/src/Certificate';
import { fromBER } from 'asn1js';

const pypath = 'c:/Python38/python';

const X509_OU_KEY = '2.5.4.10';

// This element is only used by signing device cert

type Props = {
  serial: string;
  data: string;
  setdata: (dat: string) => void;
  setreq: (req: string) => void;
};

function Devicecontrollersub1({ serial, data, setdata, setreq }: Props) {
  const [key, setkey] = useState<string>('');
  const [keylist, setkeylist] = useState<string[]>([]);

  const listkey = () => {
    const cpath = 'certs/';
    const cards: string[] = [];
    fs.readdirSync(cpath, { withFileTypes: true })
      .filter((files) => files.isFile())
      .forEach((file) => cards.push(file.name));

    setkeylist(cards);
  };

  useEffect(() => {
    listkey();
    console.log('---init---');
  }, []);

  const getoufromcert = (cards: string) => {
    const cpath = 'certs/';
    let ou = '';

    const certpem = fs.readFileSync(join(cpath, cards), 'utf8');
    const b64 = certpem.replace(
      /(-----(BEGIN|END) CERTIFICATE-----|[\n\r])/g,
      ''
    );
    const der = Buffer.from(b64, 'base64');
    const ber = new Uint8Array(der).buffer;
    const asn1 = fromBER(ber);

    // eslint-disable-next-line new-cap
    const certder = new Cert.default({ schema: asn1.result });

    const subjectAttributes = certder.subject.typesAndValues;
    for (let index = 0; index < subjectAttributes.length; index += 1) {
      const attribute = subjectAttributes[index];
      if (attribute.type.toString() === X509_OU_KEY) {
        ou = attribute.value.valueBlock.value;
        break;
      }
    }

    setkey(cards);
    return ou;
  };

  const keyChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    let ou = '';
    ou = getoufromcert(event.target.value as string);

    const cpath = 'certs/';
    const kpath = 'keys/';

    const options: Options = {
      mode: 'text',
      pythonPath: pypath,
      args: [
        '--devicekey',
        data,
        '--signer',
        (cpath + event.target.value) as string,
        '--signerkey',
        `${(kpath + event.target.value) as string}.key`,
        '--o',
        ou,
        '--cn',
        serial,
      ],
    };

    const pyshell = new PythonShell(
      join('scripts/', 'sign_device.py'),
      options
    );
    let tmpmessage: string;
    tmpmessage = '';
    pyshell.on('message', (message) => {
      tmpmessage += message;
      tmpmessage += '\\n';
      if (message.match(/-----END CERTIFICATE-----/)) {
        pyshell.end((err, code, signal) => {
          if (err) throw err;
          console.log(`The exit code was: ${code}`);
          console.log(`The exit signal was: ${signal}`);
          console.log('finished');
        });

        setdata(tmpmessage);
        setreq('cert');
      }
    });
  };

  return (
    <FormControlLabel
      // eslint-disable-next-line prettier/prettier
      control={(
        <Select
          labelId="demo-simple-select-label"
          id="demo-simple-select"
          value={key}
          onChange={keyChange}
        >
          {keylist.map((cards) => (
            <MenuItem key={cards} value={cards}>
              {cards}
            </MenuItem>
          ))}
        </Select>
        // eslint-disable-next-line prettier/prettier
      )}
      label="This device has issued public key. Choose keypair to sign"
    />
  );
}

export default Devicecontrollersub1;
