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

/* eslint-disable react/jsx-one-expression-per-line */
import React, { useState, useEffect } from 'react';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import fs from 'fs';
import { join } from 'path';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import ListItemText from '@material-ui/core/ListItemText';
import Avatar from '@material-ui/core/Avatar';
import IconButton from '@material-ui/core/IconButton';
import ListAltIcon from '@material-ui/icons/ListAlt';
import DeleteIcon from '@material-ui/icons/Delete';
import Fab from '@material-ui/core/Fab';
import AddIcon from '@material-ui/icons/Add';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';

import { PythonShell, Options } from 'python-shell';

import { clipboard, remote } from 'electron';
import Templatecreator from './Templatecreator';

const pypath = 'c:/Python38/python';

const theme = createMuiTheme({});

function Template() {
  const [cards, setcards] = useState<string[]>([]);
  const [show, setshow] = useState<boolean>(false);
  const [show2, setshow2] = useState<boolean>(false);
  const [show3, setshow3] = useState<boolean>(false);
  const [opened, setopened] = useState<string>('');
  const [contents, setcontents] = useState<string>('');

  const handleClickCOpen = (a: string) => {
    const cpath = 'template/';

    const tmpldata = JSON.parse(fs.readFileSync(join(cpath, a), 'utf8'));

    setopened(a);

    setcontents(
      `OU:  ${tmpldata.ou}\nSigner CA file:  ${tmpldata.signer}\nRoot CA pubkey file: ${tmpldata.rootkey}\nSupport Secureboot version: ${tmpldata.version}`
    );

    setshow(true);
  };

  const handleClickOpen = (b: string) => {
    const cpath = 'template/';

    const tmpldata = JSON.parse(fs.readFileSync(join(cpath, b), 'utf8'));
    let printstr = '';

    const options: Options = {
      mode: 'text',
      pythonPath: pypath,
      pythonOptions: ['-u'],
      args: [
        '--signer-cert',
        tmpldata.signer,
        '--device-cert',
        tmpldata.device,
      ],
    };

    const pyshell = new PythonShell(
      join('scripts/', 'cert2certdef.py'),
      options
    );
    pyshell.on('message', (message) => {
      console.log(message);

      if (message.match(/certdef output finishied/)) {
        pyshell.end((err, code, signal) => {
          if (err) {
            console.log(`The exit code was: ${code}`);
            console.log(`The exit signal was: ${signal}`);
            console.log('finished');
            throw err;
          }
          setcontents(printstr);

          clipboard.writeText(printstr);

          setopened(b);

          setshow(true);
        });
      } else {
        printstr += message;
        printstr += '\n';
      }
    });
  };

  const handleClose = () => {
    setshow(false);
  };

  const delhandleClickOpen = (c: string) => {
    setopened(c);

    setshow2(true);
  };

  const delhandleClose = () => {
    setshow2(false);
  };

  const delhandleDelete = (d: string) => {
    const cpath = 'template/';

    fs.unlinkSync(join(cpath, d));

    setshow2(false);

    const window = remote.BrowserWindow.getFocusedWindow();
    if (window !== null) {
      window.reload();
    }
  };

  const handleOpen3 = () => {
    setshow3(true);
  };

  const handleClose3 = () => {
    setshow3(false);
  };

  useEffect(() => {
    const cpath = 'template/';
    // eslint-disable-next-line no-shadow
    const cards: string[] = [];
    fs.readdirSync(cpath, { withFileTypes: true })
      .filter((files) => files.isFile())
      .forEach((file) => cards.push(file.name));
    setcards(cards);
  }, []);

  return (
    <MuiThemeProvider theme={theme}>
      <h2>Device Cert Template Management</h2>
      <List>
        {cards.map((card) => (
          <ListItem key={card}>
            <ListItemAvatar>
              <Avatar>
                <ListAltIcon />
              </Avatar>
            </ListItemAvatar>
            <ListItemText primary={card} />
            <Button
              variant="outlined"
              color="inherit"
              onClick={() => handleClickCOpen(card)}
            >
              SHOW CONFIG
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              onClick={() => handleClickOpen(card)}
            >
              Open Cert Template TEXT
            </Button>
            <ListItemSecondaryAction>
              <IconButton
                edge="end"
                aria-label="delete"
                onClick={() => delhandleClickOpen(card)}
              >
                <DeleteIcon />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
      <Dialog
        open={show}
        onClose={() => handleClose()}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        maxWidth="xl"
      >
        <DialogTitle id="alert-dialog-title">{opened}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {contents.split('\n').map((str, index) => (
              // eslint-disable-next-line react/no-array-index-key
              <React.Fragment key={index}>
                {str}
                <br />
              </React.Fragment>
            ))}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleClose()} color="primary" autoFocus>
            OK
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={show2}
        onClose={() => delhandleClose()}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">Delete {opened} OK?</DialogTitle>
        <DialogActions>
          <Button autoFocus onClick={() => delhandleClose()} color="primary">
            Cancel
          </Button>
          <Button
            onClick={() => delhandleDelete(opened)}
            color="primary"
            autoFocus
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      <Templatecreator onClose={() => handleClose3()} open={show3} />

      <Fab color="primary" aria-label="add">
        <AddIcon onClick={() => handleOpen3()} />
      </Fab>
    </MuiThemeProvider>
  );
}

export default Template;
