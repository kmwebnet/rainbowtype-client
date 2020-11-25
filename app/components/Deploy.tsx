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
const { dialog } = remote;

const theme = createMuiTheme({});

function Deploy() {
  const [ports, setports] = useState<string[]>([]);
  const [port, setport] = useState<string>('');
  const [tmpls, settmpls] = useState<string[]>([]);
  const [tmpl, settmpl] = useState<string>('');
  const [configured, setconfigured] = useState<boolean>(false);
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
    setconfigured(false);

    const cpath = 'template/';
    console.log(join(cpath, event.target.value as string));
    const tmpldata = JSON.parse(
      fs.readFileSync(join(cpath, event.target.value as string), 'utf8')
    );

    // eslint-disable-next-line no-useless-concat
    if (!fs.existsSync(`${cpath + tmpldata.ou}/` + `firmware-enc.bin`)) return;
    // eslint-disable-next-line no-useless-concat
    if (!fs.existsSync(`${cpath + tmpldata.ou}/` + `partitions-enc.bin`))
      return;
    // eslint-disable-next-line no-useless-concat
    if (!fs.existsSync(`${cpath + tmpldata.ou}/` + `bootloader-enc.bin`))
      return;

    setconfigured(true);
  };

  const startserial = () => {
    const cpath = 'template/';
    const tmpldata = JSON.parse(fs.readFileSync(join(cpath, tmpl), 'utf8'));

    const options: Options = {
      mode: 'text',
      pythonPath: pypath,
      pythonOptions: ['-u'],
      args: [
        '--port',
        port,
        '--after',
        'no_reset',
        'write_flash',
        '0x1000',
        // eslint-disable-next-line no-useless-concat
        `${cpath + tmpldata.ou}/` + `bootloader-enc.bin`,
        '0x8000',
        // eslint-disable-next-line no-useless-concat
        `${cpath + tmpldata.ou}/` + `partitions-enc.bin`,
        '0x10000',
        // eslint-disable-next-line no-useless-concat
        `${cpath + tmpldata.ou}/` + `firmware-enc.bin`,
      ],
    };

    let printstr: string;

    const pyshell = new PythonShell(join('esptool/', 'esptool.py'), options);
    setcomm(true);
    pyshell.on('message', (message) => {
      console.log(message);

      if (message.match(/Staying in bootloader./)) {
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
      } else {
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

  const handlefileOpen = () => {
    const filename = dialog.showOpenDialogSync(remote.getCurrentWindow(), {
      properties: ['openDirectory'],
      title: 'select rt Bootloader project root folder',
    });

    let printstr = '';

    if (filename !== undefined) {
      const cpath = 'template/';
      const tmpldata = JSON.parse(fs.readFileSync(join(cpath, tmpl), 'utf8'));

      console.log(filename[0]);
      const fpath = `${filename[0]}/`;

      // firmware.bin

      let options: Options = {
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
          // eslint-disable-next-line no-useless-concat
          `${cpath + tmpldata.ou}/` + `firmware-enc.bin`,
          '--datafile',
          `${fpath}.pio/build/esp32dev/firmware.bin`,
        ],
      };

      let pyshell = new PythonShell(join('esptool/', 'espsecure.py'), options);
      setcomm(true);
      printstr += 'sign firmware.bin\n';
      pyshell.on('message', (message) => {
        console.log(message);

        if (message === 'Padding data contents') {
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
        } else {
          printstr += message;
          printstr += '\n';
          setsercom(printstr);
        }
      });

      // partitions.bin

      options = {
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
          // eslint-disable-next-line no-useless-concat
          `${cpath + tmpldata.ou}/` + `partitions-enc.bin`,
          '--datafile',
          `${fpath}.pio/build/esp32dev/partitions.bin`,
        ],
      };

      pyshell = new PythonShell(join('esptool/', 'espsecure.py'), options);
      setcomm(true);
      printstr += 'sign partitions.bin\n';
      pyshell.on('message', (message) => {
        console.log(message);

        if (message === 'Padding data contents') {
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
        } else {
          printstr += message;
          printstr += '\n';
          setsercom(printstr);
        }
      });

      // bootloader.bin

      options = {
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
          // eslint-disable-next-line no-useless-concat
          `${cpath + tmpldata.ou}/` + `bootloader-enc.bin`,
          '--datafile',
          `${fpath}.pio/build/esp32dev/bootloader.bin`,
        ],
      };

      pyshell = new PythonShell(join('esptool/', 'espsecure.py'), options);
      setcomm(true);
      printstr += 'sign bootloader.bin\n';
      pyshell.on('message', (message) => {
        console.log(message);

        if (message === 'Padding data contents') {
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
        } else {
          printstr += message;
          printstr += '\n';
          setsercom(printstr);
        }
      });
    }
  };

  return (
    <MuiThemeProvider theme={theme}>
      <h2>Deploy rt Bootloader</h2>

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

        {!configured && tmpl !== '' ? (
          <>
            <Button variant="outlined" color="inherit" onClick={handlefileOpen}>
              select rt Bootloader project root folder
            </Button>
            <h1 />
          </>
        ) : null}

        {port !== '' && tmpl !== '' && configured && !comm ? (
          <Button
            variant="outlined"
            color="inherit"
            onClick={() => startserial()}
          >
            Deploy rt Bootloader
          </Button>
        ) : (
          <Button variant="outlined" color="inherit" disabled>
            Deploy rt Bootloader
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

export default Deploy;
