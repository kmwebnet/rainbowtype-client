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
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';

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

interface Connectobj {
  url: string;
  clientcert: string;
  signerca: string;
  rootca: string;
}

type Props = {
  credentials: (conn: Connectobj) => void;
  onClose: VoidFunction;
  open: boolean;
};

function Deviceconnector({ credentials, onClose, open }: Props) {
  const [url, seturl] = useState<string>('');
  const [cert, setcert] = useState<string>('');
  const [certlist, setcertlist] = useState<string[]>([]);
  const [key, setkey] = useState<string>('');
  const [keylist, setkeylist] = useState<string[]>([]);
  const [key2, setkey2] = useState<string>('');
  const [keylist2, setkeylist2] = useState<string[]>([]);

  const listkey = () => {
    const cpath = 'certs/';
    const cards: string[] = [];
    fs.readdirSync(cpath, { withFileTypes: true })
      .filter((files) => files.isFile())
      .forEach((file) => cards.push(file.name));

    setkeylist(cards);
    setkeylist2(cards);
  };
  const listcert = () => {
    const cpath = 'rtclient/certs/';
    const cards: string[] = [];
    fs.readdirSync(cpath, { withFileTypes: true })
      .filter((files) => files.isFile())
      .forEach((file) => cards.push(file.name));

    setcertlist(cards);
  };

  useEffect(() => {
    listkey();
    listcert();
    console.log('---init---');
  }, []);

  const urlChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    seturl(event.target.value as string);
  };

  const certChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setcert(event.target.value as string);
  };

  const keyChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setkey(event.target.value as string);
  };

  const key2Change = (event: React.ChangeEvent<{ value: unknown }>) => {
    setkey2(event.target.value as string);
  };

  const classes = useStyles();

  return (
    <Dialog
      open={open}
      onClose={() => onClose()}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title">Connect to rt Server</DialogTitle>

      <DialogContent>
        <form className={classes.root} noValidate autoComplete="off">
          <TextField
            id="standard-basic"
            label="URL"
            helperText="rtServer URL:port"
            value={url || ''}
            onChange={urlChange}
          />
        </form>

        <FormControl style={{ minWidth: 500 }}>
          <FormControlLabel
            // eslint-disable-next-line prettier/prettier
            control={(
              <Select
                labelId="demo-simple-select-label"
                id="demo-simple-select"
                value={cert}
                onChange={certChange}
              >
                {certlist.map((cards) => (
                  <MenuItem key={cards} value={cards}>
                    {cards}
                  </MenuItem>
                ))}
              </Select>
              // eslint-disable-next-line prettier/prettier
            )}
            label="rtclient Cert"
          />
        </FormControl>

        <FormControl style={{ minWidth: 500 }}>
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
            label="Signer CA Cert"
          />
        </FormControl>

        <FormControl style={{ minWidth: 500 }}>
          <FormControlLabel
            // eslint-disable-next-line prettier/prettier
            control={(
              <Select
                labelId="demo-simple-select-label"
                id="demo-simple-select"
                value={key2}
                onChange={key2Change}
              >
                {keylist2.map((cards) => (
                  <MenuItem key={cards} value={cards}>
                    {cards}
                  </MenuItem>
                ))}
              </Select>
              // eslint-disable-next-line prettier/prettier
            )}
            label="Root CA Cert"
          />
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button autoFocus onClick={() => onClose()} color="primary">
          Cancel
        </Button>
        <Button
          onClick={() =>
            credentials({
              url,
              clientcert: cert,
              signerca: key,
              rootca: key2,
              // eslint-disable-next-line prettier/prettier
            })}
          color="primary"
          autoFocus
        >
          Connect
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default Deviceconnector;
