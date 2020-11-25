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
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import fs from 'fs';
import { join } from 'path';
import Button from '@material-ui/core/Button';
import Container from '@material-ui/core/Container';
import TextField from '@material-ui/core/TextField';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import { PythonShell, Options } from 'python-shell';

const pypath = 'c:/Python38/python';

const theme = createMuiTheme({});

function Provision() {
  const [ports, setports] = useState<string[]>([]);
  const [port, setport] = useState<string>('');
  const [tmpls, settmpls] = useState<string[]>([]);
  const [tmpl, settmpl] = useState<string>('');
  const [sercom, setsercom] = useState<string>('');
  const [comm, setcomm] = useState<boolean>(false);

  const scanports = () => {
    const gotports: string[] = [];

    const options: Options = {
      mode: 'text',
      pythonPath: pypath,
      pythonOptions: ['-u'],
    };

    const pyshell = new PythonShell(join('scripts/', 'listports.py'), options);

    pyshell.on('message', (message: string) => {
      console.log(message);
      if (message.match(/serialport detected./)) {
        pyshell.end((err, code, signal) => {
          if (err) {
            console.log(`The exit code was: ${code}`);
            console.log(`The exit signal was: ${signal}`);
            console.log('finished');
            throw err;
          }
          setports(gotports);
        });
      } else gotports.push(message);
    });

    console.log(ports);
  };

  const scantmpls = () => {
    const cpath = 'template/';
    const cards: string[] = [];
    fs.readdirSync(cpath, { withFileTypes: true })
      .filter((files) => files.isFile())
      .forEach((file) => cards.push(file.name));

    settmpls(cards);
  };

  useEffect(() => {
    scanports();
    scantmpls();
    console.log('---init---');
  }, []);

  const portChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setport(event.target.value as string);
  };

  const tmplChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    settmpl(event.target.value as string);
  };

  const burnencryptionkey = (serial: string) => {
    const options: Options = {
      mode: 'text',
      pythonPath: pypath,
      pythonOptions: ['-u'],
      args: [
        '--port',
        port,
        '--do-not-confirm',
        'burn_key',
        'flash_encryption',
        `devices/${serial}.key`,
      ],
    };

    const pyshell = new PythonShell(join('esptool/', 'espefuse.py'), options);
    setcomm(true);
    pyshell.on('message', (message) => {
      console.log(message);

      if (message.match(/write to key efuse block.../)) {
        pyshell.end((err, code, signal) => {
          if (err) {
            console.log(`The exit code was: ${code}`);
            console.log(`The exit signal was: ${signal}`);
            console.log('finished');
            setcomm(false);
            throw err;
          }
          setcomm(false);
        });
      }
    });
  };

  const encryptionkeycreate = (serial: string) => {
    // create encryption key if it's not exists
    if (!fs.existsSync(`devices/${serial}.key`)) {
      const options: Options = {
        mode: 'text',
        pythonPath: pypath,
        pythonOptions: ['-u'],
        args: ['generate_flash_encryption_key', `devices/${serial}.key`],
      };

      const pyshell = new PythonShell(
        join('esptool/', 'espsecure.py'),
        options
      );
      setcomm(true);
      pyshell.on('message', (message) => {
        console.log(message);

        if (message.match(/random bits to key file/)) {
          pyshell.end((err, code, signal) => {
            if (err) {
              console.log(`The exit code was: ${code}`);
              console.log(`The exit signal was: ${signal}`);
              console.log('finished');
              setcomm(false);
              throw err;
            }
            setcomm(false);
            burnencryptionkey(serial);
          });
        }
      });
    }
  };

  const startserial = () => {
    const cpath = 'template/';
    const tmpldata = JSON.parse(fs.readFileSync(join(cpath, tmpl), 'utf8'));

    let printstr = '';
    let serial = '';

    // certificate provisioning
    const options: Options = {
      mode: 'text',
      pythonPath: pypath,
      pythonOptions: ['-u'],
      args: [
        '--port',
        port,
        '--workdir',
        `${cpath + tmpldata.ou}/`,
        '--cert',
        tmpldata.signer,
        '--key',
        tmpldata.signerkey,
        '--rootkey',
        tmpldata.rootkey,
        '--o',
        tmpldata.ou,
      ],
    };

    const pyshell = new PythonShell(
      join('scripts/', 'deviceprovisiongui.py'),
      options
    );
    setcomm(true);
    pyshell.on('message', (message) => {
      console.log(message);

      if (message.match(/device provision finish./)) {
        pyshell.end((err, code, signal) => {
          if (err) {
            console.log(`The exit code was: ${code}`);
            console.log(`The exit signal was: ${signal}`);
            console.log('finished');
            setcomm(false);
            throw err;
          }
          setcomm(false);
          encryptionkeycreate(serial);
        });
      } else {
        if (message.match(/got serial number./)) {
          serial = message.slice(-18);
          console.log(serial);
        }

        printstr += message;
        printstr += '\n';
        setsercom(printstr);
      }
    });
    pyshell.on('stderr', (err) => {
      printstr += err;
      printstr += '\n';
      setsercom(printstr);
      setcomm(false);
    });
  };

  return (
    <MuiThemeProvider theme={theme}>
      <h2>Device Cert Provisioning</h2>

      <Container>
        <FormControlLabel
          // eslint-disable-next-line prettier/prettier
          control={(
            <Select
              labelId="demo-simple-select-label"
              id="demo-simple-select"
              value={port}
              onChange={portChange}
            >
              {ports.map((tport) => (
                <MenuItem key={tport} value={tport}>
                  {tport}
                </MenuItem>
              ))}
            </Select>
            // eslint-disable-next-line prettier/prettier
          )}
          label="select serial port"
        />

        <FormControlLabel
          // eslint-disable-next-line prettier/prettier
          control={(
            <Select
              labelId="demo-simple-select-label"
              id="demo-simple-select"
              value={tmpl}
              onChange={tmplChange}
            >
              {tmpls.map((ttmpl) => (
                <MenuItem key={ttmpl} value={ttmpl}>
                  {ttmpl}
                </MenuItem>
              ))}
            </Select>
            // eslint-disable-next-line prettier/prettier
          )}
          label="select Device cert template"
        />

        <h1 />

        {port !== '' && tmpl !== '' && !comm ? (
          <Button
            variant="outlined"
            color="inherit"
            onClick={() => startserial()}
          >
            RUN SERIAL COMMUNICATION
          </Button>
        ) : (
          <Button variant="outlined" color="inherit" disabled>
            RUN SERIAL COMMUNICATION
          </Button>
        )}

        <h1 />

        <TextField
          id="outlined-multiline-static"
          label="Serial communication"
          multiline
          fullWidth
          rows={20}
          value={sercom}
          variant="outlined"
        />
      </Container>
    </MuiThemeProvider>
  );
}

export default Provision;
