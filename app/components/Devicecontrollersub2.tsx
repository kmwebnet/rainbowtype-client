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

/* eslint-disable jsx-a11y/heading-has-content */
import React, { useState, useEffect } from 'react';
import { remote } from 'electron';
import fs from 'fs';
import { join } from 'path';
import Button from '@material-ui/core/Button';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import { PythonShell, Options } from 'python-shell';
import { Agent } from 'https';
import { client } from 'websocket';

const pypath = 'c:/Python38/python';

const { dialog } = remote;

// This element is only used by select FW file

type Props = {
  url: string;
  serial: string;
  https: Agent;
};

function Devicecontrollersub2({ url, serial, https }: Props) {
  const [button, setbutton] = useState<string>('select FW file...');
  const [cards, setcards] = useState<string[]>([]);
  const [signer, setsigner] = useState<string>('');

  useEffect(() => {
    const cpath = 'template/';
    const tcards: string[] = [];
    fs.readdirSync(cpath, { withFileTypes: true })
      .filter((files) => files.isFile())
      .forEach((file) => tcards.push(file.name));

    setcards(tcards);
  }, []);

  const signerChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setsigner(event.target.value as string);
  };

  const filedialog = () => {
    return new Promise((resolve) => {
      const filename = dialog.showOpenDialogSync(remote.getCurrentWindow(), {
        properties: ['openFile'],
        title: 'Select a FW file',
      });
      if (filename !== undefined) {
        console.log(filename[0]);
        resolve(filename[0] as string);
      }
    });
  };
  const sleep = () => {
    return new Promise((resolve) => {
      setbutton('uploading.');
      setTimeout(() => {
        resolve();
      }, 200);
    });
  };

  const signfw = (path: string) => {
    return new Promise((resolve, reject) => {
      const cpath = 'template/';
      let result = '';

      const tmpldata = JSON.parse(fs.readFileSync(join(cpath, signer), 'utf8'));

      if (fs.existsSync(`${cpath + tmpldata.ou}/${serial}.bin`)) {
        fs.unlinkSync(`${cpath + tmpldata.ou}/${serial}.bin`);
      }

      const options: Options = {
        mode: 'text',
        pythonPath: pypath,
        pythonOptions: ['-u'],
        args: [
          'sign_data',
          '--version',
          tmpldata.version.toString(),
          '--keyfile',
          tmpldata.signkey,
          '--output',
          `${cpath + tmpldata.ou}/${serial}.bin`,
          '--datafile',
          path,
        ],
      };

      const pyshell = new PythonShell(
        join('esptool/', 'espsecure.py'),
        options
      );
      pyshell.on('message', (message) => {
        result += message;
        result += '\n';
      });

      pyshell.on('stderr', (stderr) => {
        console.log(stderr);
      });

      pyshell.end((err, code, signal) => {
        if (err) reject(err);
        console.log(`The exit code was: ${code}`);
        console.log(`The exit signal was: ${signal}`);
        console.log('finished');
        setbutton('signed.');
        console.log(result);
        resolve(result);
      });
    });
  };

  const transferfw = () => {
    return new Promise((resolve, reject) => {
      const cpath = 'template/';
      const tmpldata = JSON.parse(fs.readFileSync(join(cpath, signer), 'utf8'));

      // eslint-disable-next-line new-cap
      const tclient = new client({
        tlsOptions: https.options,
      });

      tclient.on('connectFailed', (error) => {
        console.log(`Connect Error: ${error.toString()}`);
        reject();
      });

      tclient.on('connect', (connection) => {
        console.log('WebSocket Client FW uploader Connected');

        connection.on('error', (error) => {
          console.log(`Connection Error: ${error.toString()}`);
          reject();
        });

        connection.on('close', () => {
          console.log('WebSocket Client FW uploader Closed');
          connection.close();
        });

        console.log(https.options);
        const serialbuf = Buffer.from(serial);
        const fw = fs.readFileSync(`${cpath + tmpldata.ou}/${serial}.bin`);

        connection.sendBytes(Buffer.concat([serialbuf, fw]));

        connection.on('message', (message) => {
          if (message.utf8Data && message.utf8Data.match(/s furmware recieved/))
            console.log(message.utf8Data);
          console.log('FW upload success');
          connection.close();
          setbutton('upload success.');
          resolve();
        });
      });

      tclient.connect(`wss://${url}/fw`);
    });
  };

  const handlefileOpen = () => {
    filedialog()
      .then((value) => signfw(value as string))
      .then(sleep)
      .then(transferfw)
      .catch((err) => console.log(err));
  };

  return (
    <>
      <h1 />
      <FormControlLabel
        // eslint-disable-next-line prettier/prettier
        control={(
          <Select
            labelId="demo-simple-select-label"
            id="demo-simple-select"
            value={signer}
            onChange={signerChange}
          >
            {cards.map((ccards) => (
              <MenuItem key={ccards} value={ccards}>
                {ccards}
              </MenuItem>
            ))}
          </Select>
          // eslint-disable-next-line prettier/prettier
        )}
        label="Choose template to sign the firmware"
      />
      <h1 />
      {signer !== '' ? (
        <>
          <Button variant="outlined" color="inherit" onClick={handlefileOpen}>
            {button}
          </Button>
          <h1 />
        </>
      ) : null}
    </>
  );
}

export default Devicecontrollersub2;
