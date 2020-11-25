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
import fs from 'fs';
import { join } from 'path';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import { PythonShell, Options } from 'python-shell';
import { remote } from 'electron';

const pypath = 'c:/Python38/python';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      '& > *': {
        margin: theme.spacing(1),
        width: '25ch',
      },
    },
  })
);

type Props = {
  onClose: VoidFunction;
  open: boolean;
};

function Templatecreator({ onClose, open }: Props) {
  const [ou, setou] = useState<string>('');
  const [signer, setsigner] = useState<string>('');
  const [root, setroot] = useState<string>('');
  const [keylist, setkeylist] = useState<string[]>([]);
  const [v2, setv2] = useState<boolean>(true);

  const settemplatedata = (
    // eslint-disable-next-line no-shadow
    ou: string,
    device: string,
    // eslint-disable-next-line no-shadow
    signer: string,
    signerkey: string,
    rootkey: string,
    signkey: string,
    version: number
  ) => {
    const cpath = 'template/';

    const tmpldata: {
      ou: string;
      device: string;
      signer: string;
      signerkey: string;
      rootkey: string;
      signkey: string;
      version: number;
    } = {
      ou: '',
      device: '',
      signer: '',
      signerkey: '',
      rootkey: '',
      signkey: '',
      version: 2,
    };

    tmpldata.ou = ou;
    tmpldata.device = device;
    tmpldata.signer = signer;
    tmpldata.signerkey = signerkey;
    tmpldata.rootkey = rootkey;
    tmpldata.signkey = signkey;
    tmpldata.version = version;

    fs.writeFileSync(`${cpath + ou}.json`, JSON.stringify(tmpldata));
  };

  const handleCreate = () => {
    const cpath = 'template/';
    const ccpath = 'certs/';
    const ckpath = 'keys/';
    const tpath = `${cpath + ou}/`;

    if (ou === '' || signer === '' || root === '') {
      console.log('nothing created.');
      onClose();
      return;
    }

    if (!fs.existsSync(`${cpath + ou}/`)) {
      fs.mkdirSync(`${cpath + ou}/`);
    }

    if (!fs.existsSync(`${cpath + ou}/${ou}-codesign.key`)) {
      if (v2) {
        const options: Options = {
          mode: 'text',
          pythonPath: pypath,
          args: [
            'generate_signing_key',
            '--version',
            '2',
            `${cpath + ou}/${ou}-codesign.key`,
          ],
        };

        const pyshell = new PythonShell(
          join('esptool/', 'espsecure.py'),
          options
        );
        pyshell.on('message', (message) => {
          console.log(message);

          if (message.match(/RSA 3072 private key in PEM format written to/)) {
            pyshell.end((err, code, signal) => {
              if (err) {
                console.log(`The exit code was: ${code}`);
                console.log(`The exit signal was: ${signal}`);
                console.log('finished');
                throw err;
              }
            });
          }
        });
      } else {
        const options: Options = {
          mode: 'text',
          pythonPath: pypath,
          args: [
            'generate_signing_key',
            '--version',
            '1',
            `${cpath + ou}/${ou}-codesign.key`,
          ],
        };

        const pyshell = new PythonShell(
          join('esptool/', 'espsecure.py'),
          options
        );
        pyshell.on('message', (message) => {
          console.log(message);

          if (
            message.match(/ECDSA NIST256p private key in PEM format written to/)
          ) {
            pyshell.end((err, code, signal) => {
              if (err) {
                console.log(`The exit code was: ${code}`);
                console.log(`The exit signal was: ${signal}`);
                console.log('finished');
                throw err;
              }
            });
          }
        });
      }
    }

    const options: Options = {
      mode: 'text',
      pythonPath: pypath,
      args: [
        '--o',
        ou,
        '--device',
        `${tpath + ou}-tmpl.crt`,
        '--devicekey',
        `${tpath + ou}-tmpl.crt.key`,
        '--signer',
        ccpath + signer,
        '--signerkey',
        `${ckpath + signer}.key`,
        '--root',
        ccpath + root,
        '--rootkey',
        `${tpath + root}.key`,
      ],
    };

    const pyshell = new PythonShell(
      join('scripts/', 'create_devicetmpl.py'),
      options
    );
    pyshell.on('message', (message) => {
      console.log(message);

      if (message.match(/device cert template create success/)) {
        pyshell.end((err, code, signal) => {
          if (err) {
            console.log(`The exit code was: ${code}`);
            console.log(`The exit signal was: ${signal}`);
            console.log('finished');
            throw err;
          }
          settemplatedata(
            ou,
            `${tpath + ou}-tmpl.crt`,
            ccpath + signer,
            `${ckpath + signer}.key`,
            `${tpath + root}.key`,
            `${cpath + ou}/${ou}-codesign.key`,
            v2 ? 2 : 1
          );
          setTimeout(() => {
            onClose();
            const window = remote.BrowserWindow.getFocusedWindow();
            if (window !== null) {
              window.reload();
            }
          }, 500);
        });
      }
    });

    onClose();

    /*
    const remote = require('electron').remote;
    var window = remote.BrowserWindow.getFocusedWindow();
    window.reload();
    */
  };

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

  const ouChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setou(event.target.value as string);
  };

  const signerChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setsigner(event.target.value as string);
  };

  const rootChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setroot(event.target.value as string);
  };

  const classes = useStyles();

  return (
    <Dialog
      open={open}
      onClose={() => onClose()}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title">
        Create Device Cert Template
      </DialogTitle>

      <DialogContent>
        <form className={classes.root} noValidate autoComplete="off">
          <TextField
            id="standard-basic"
            label="OU"
            helperText="Organization Unit"
            value={ou || ''}
            onChange={ouChange}
          />
        </form>
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
              {keylist.map((cards) => (
                <MenuItem key={cards} value={cards}>
                  {cards}
                </MenuItem>
              ))}
            </Select>
            // eslint-disable-next-line prettier/prettier
          )}
          label="Choose Signer CA Cert"
        />
        <h1 />
        <FormControlLabel
          // eslint-disable-next-line prettier/prettier
          control={(
            <Select
              labelId="demo-simple-select-label"
              id="demo-simple-select"
              value={root}
              onChange={rootChange}
            >
              {keylist.map((cards) => (
                <MenuItem key={cards} value={cards}>
                  {cards}
                </MenuItem>
              ))}
            </Select>
            // eslint-disable-next-line prettier/prettier
          )}
          label="Choose Root CA Cert"
        />
        <h1 />
        <FormControlLabel
          // eslint-disable-next-line prettier/prettier
          control={(
            <Checkbox
              checked={v2}
              onChange={() => setv2(!v2)}
              inputProps={{ 'aria-label': 'primary checkbox' }}
            />
            // eslint-disable-next-line prettier/prettier
          )}
          label="Create Secureboot V2 key"
        />
      </DialogContent>

      <DialogActions>
        <Button autoFocus onClick={() => onClose()} color="primary">
          Cancel
        </Button>
        <Button onClick={handleCreate} color="primary" autoFocus>
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default Templatecreator;
