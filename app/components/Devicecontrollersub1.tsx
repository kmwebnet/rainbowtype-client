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

const pypath = 'c:/Python38/python';

// This element is only used by signing device cert

type Props = {
  serial: string;
  data: string;
  setdata: (dat: string) => void;
  setreq: (req: string) => void;
};

function Devicecontrollersub1({ serial, data, setdata, setreq }: Props) {
  const [key, setkey] = useState<string>('');
  const [tmplist, settmplist] = useState<string[]>([]);

  const listkey = () => {
    const tpath = 'template/';
    const tcards: string[] = [];
    fs.readdirSync(tpath, { withFileTypes: true })
      .filter((files) => files.isFile())
      .forEach((file) => tcards.push(file.name));
    settmplist(tcards);
  };

  useEffect(() => {
    listkey();
    console.log('---init---');
  }, []);

  const keyChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setkey(event.target.value as string);
    const tpath = 'template/';
    const tmpldata = JSON.parse(
      fs.readFileSync(join(tpath, event.target.value as string), 'utf8')
    );

    const options: Options = {
      mode: 'text',
      pythonPath: pypath,
      args: [
        '--devicekey',
        data,
        '--signer',
        tmpldata.signer,
        '--signerkey',
        tmpldata.signerkey,
        '--o',
        tmpldata.ou,
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
          {tmplist.map((cards) => (
            <MenuItem key={cards} value={cards}>
              {cards}
            </MenuItem>
          ))}
        </Select>
        // eslint-disable-next-line prettier/prettier
      )}
      label="This device has issued public key. Choose template to sign"
    />
  );
}

export default Devicecontrollersub1;

