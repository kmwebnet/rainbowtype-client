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

function RtserverCertcreator({ onClose, open }: Props) {
  const [o, seto] = useState<string>('');
  const [cn, setcn] = useState<string>('');
  const [san1, setsan1] = useState<string>('');
  const [san2, setsan2] = useState<string>('');
  const [key, setkey] = useState<string>('');
  const [root, setroot] = useState<string>('');
  const [keylist, setkeylist] = useState<string[]>([]);

  const handleCreate = () => {
    const cpath = 'server/certs/';
    const kpath = 'server/keys/';
    const ccpath = 'certs/';
    const ckpath = 'keys/';

    if (o === '' || cn === '' || key === '' || root === '') {
      console.log('nothing created.');
      onClose();
      return;
    }

    const options: Options = {
      mode: 'text',
      pythonPath: pypath,
      args: [
        '--o',
        o,
        '--cn',
        cn,
        '--san1',
        san1,
        '--san2',
        san2,
        '--server',
        `${cpath + cn}.crt`,
        '--serverkey',
        `${kpath + cn}.crt.key`,
        '--signer',
        ccpath + key,
        '--signerkey',
        `${ckpath + key}.key`,
        '--root',
        ccpath + root,
      ],
    };

    const pyshell = new PythonShell(
      join('scripts/', 'create_server.py'),
      options
    );
    pyshell.on('message', (message) => {
      console.log(message);

      if (message === 'servercert create success') {
        pyshell.end((err, code, signal) => {
          if (err) throw err;
          console.log(`The exit code was: ${code}`);
          console.log(`The exit signal was: ${signal}`);
          console.log('finished');
        });

        const window = remote.BrowserWindow.getFocusedWindow();
        if (window !== null) {
          window.reload();
        }
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

  const oChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    seto(event.target.value as string);
  };

  const cnChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setcn(event.target.value as string);
  };

  const san1Change = (event: React.ChangeEvent<{ value: unknown }>) => {
    setsan1(event.target.value as string);
  };

  const san2Change = (event: React.ChangeEvent<{ value: unknown }>) => {
    setsan2(event.target.value as string);
  };

  const keyChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setkey(event.target.value as string);
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
        Create rainbowtype Server Cert
      </DialogTitle>

      <DialogContent>
        <form className={classes.root} noValidate autoComplete="off">
          <TextField
            id="standard-basic"
            label="O"
            helperText="Organization Name"
            value={o || ''}
            onChange={oChange}
          />
          <h1 />
          <TextField
            id="standard-basic"
            label="CN"
            helperText="Common Name"
            value={cn || ''}
            onChange={cnChange}
          />
          <h1 />
          <TextField
            id="standard-basic"
            label="SAN1"
            helperText="SAN1:domain name"
            value={san1 || ''}
            onChange={san1Change}
          />
          <h1 />
          <TextField
            id="standard-basic"
            label="SAN2"
            helperText="SAN2:IP Address(optional)"
            value={san2 || ''}
            onChange={san2Change}
          />
        </form>

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
          label="Choose keypair to sign"
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

export default RtserverCertcreator;
