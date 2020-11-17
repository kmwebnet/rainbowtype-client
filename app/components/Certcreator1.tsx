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
import Checkbox from '@material-ui/core/Checkbox';
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

function Certcreator1({ onClose, open }: Props) {
  const [isroot, setisroot] = useState<boolean>(false);
  const [o, seto] = useState<string>('');
  const [cn, setcn] = useState<string>('');
  const [key, setkey] = useState<string>('');
  const [keylist, setkeylist] = useState<string[]>([]);

  const handleCreate = () => {
    const cpath = 'certs/';
    const kpath = 'keys/';

    if (isroot) {
      const options: Options = {
        mode: 'text',
        pythonPath: pypath,
        args: [
          '--o',
          o,
          '--cn',
          cn,
          '--cert',
          `${cpath + cn}.crt`,
          '--key',
          `${kpath + cn}.crt.key`,
        ],
      };

      const pyshell = new PythonShell(
        join('scripts/', 'create_root.py'),
        options
      );
      pyshell.on('message', (message) => {
        console.log(message);

        if (message === 'CAcert create success') {
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
    } else {
      const options: Options = {
        mode: 'text',
        pythonPath: pypath,
        args: [
          '--o',
          o,
          '--cn',
          cn,
          '--cert',
          `${cpath + cn}.crt`,
          '--key',
          `${kpath + cn}.crt.key`,
          '--root',
          cpath + key,
          '--rootkey',
          `${kpath + key}.key`,
        ],
      };

      const pyshell = new PythonShell(
        join('scripts/', 'create_signer.py'),
        options
      );
      pyshell.on('message', (message) => {
        console.log(message);

        if (message === 'CAcert create success') {
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
    }
    onClose();
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

  const keyChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setkey(event.target.value as string);
  };

  const classes = useStyles();

  return (
    <Dialog
      open={open}
      onClose={() => onClose()}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title">Create CA Cert</DialogTitle>

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
        </form>
        <h1 />
        <FormControlLabel
          // eslint-disable-next-line prettier/prettier
          control={(
            <Checkbox
              checked={isroot}
              onChange={() => setisroot(!isroot)}
              inputProps={{ 'aria-label': 'primary checkbox' }}
            />
            // eslint-disable-next-line prettier/prettier
          )}
          label="Create Root Certificate"
        />
        <h1 />
        <FormControlLabel
          // eslint-disable-next-line prettier/prettier
          control={(
            <Select
              disabled={isroot}
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

export default Certcreator1;
