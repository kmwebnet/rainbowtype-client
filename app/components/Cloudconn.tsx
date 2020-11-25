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
import React, { Component } from 'react';
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
import InsertDriveFileIcon from '@material-ui/icons/InsertDriveFile';
import DeleteIcon from '@material-ui/icons/Delete';
import Fab from '@material-ui/core/Fab';
import AddIcon from '@material-ui/icons/Add';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import * as Cert from 'pkijs/src/Certificate';
import { fromBER } from 'asn1js';
import { remote } from 'electron';
import Cloudconnector from './Cloudconnector';

const theme = createMuiTheme({});
const X509_COMMON_NAME_KEY = '2.5.4.3';

interface Props {
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
  color?: 'blue' | 'green' | 'red';
  type?: 'button' | 'submit';
}

interface IState {
  cards: string[];
  show: boolean;
  show2: boolean;
  show3: boolean;
  opened: string;
  contents: string;
}

class Cloudconn extends Component<Props, IState> {
  constructor(props: Props) {
    super(props);
    this.state = {
      cards: [],
      show: false,
      show2: false,
      show3: false,
      opened: '',
      contents: '',
    };

    this.handleClose = this.handleClose.bind(this);
    this.delhandleClose = this.delhandleClose.bind(this);
    this.handleOpen2 = this.handleOpen2.bind(this);
  }

  componentDidMount() {
    const cpath = 'cloud/certs/';
    const cards: string[] = [];
    fs.readdirSync(cpath, { withFileTypes: true })
      .filter((files) => files.isFile())
      .forEach((file) => cards.push(file.name));

    this.setState({
      cards,
    });
  }

  private handleClickCOpen(cards: string) {
    const cpath = 'cloud/certs';
    let icommonName = '';
    let commonName = '';

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

    const issuerAttributes = certder.issuer.typesAndValues;
    for (let index = 0; index < issuerAttributes.length; index += 1) {
      const attribute = issuerAttributes[index];
      if (attribute.type.toString() === X509_COMMON_NAME_KEY) {
        icommonName = attribute.value.valueBlock.value;
        break;
      }
    }

    const subjectAttributes = certder.subject.typesAndValues;
    for (let index = 0; index < subjectAttributes.length; index += 1) {
      const attribute = subjectAttributes[index];
      if (attribute.type.toString() === X509_COMMON_NAME_KEY) {
        commonName = attribute.value.valueBlock.value;
        break;
      }
    }

    this.setState({
      opened: cards,
    });

    this.setState({
      contents: `Issuer:    ${icommonName}\nCOMMON NAME:    ${commonName}`,
    });

    this.setState({
      show: true,
    });
  }

  private handleClickOpen(cards: string) {
    const cpath = 'cloud/certs/';

    this.setState({
      opened: cards,
    });

    this.setState({
      contents: fs.readFileSync(join(cpath, cards), 'utf8'),
    });

    this.setState({
      show: true,
    });
  }

  private handleClose() {
    this.setState({
      show: false,
    });
  }

  private delhandleClickOpen(cards: string) {
    this.setState({
      opened: cards,
    });

    this.setState({
      show2: true,
    });
  }

  private delhandleClose() {
    this.setState({
      show2: false,
    });
  }

  private delhandleDelete(cards: string) {
    const cpath = 'cloud/certs/';
    const kpath = 'cloud/keys/';

    fs.unlinkSync(join(cpath, cards));
    try {
      fs.unlinkSync(`${join(kpath, cards)}.key`);
    } catch (error) {
      console.log(error);
    }

    this.setState({
      show2: false,
    });
    const window = remote.BrowserWindow.getFocusedWindow();
    if (window !== null) {
      window.reload();
    }
  }

  private handleOpen2() {
    this.setState({
      show3: true,
    });
  }

  private delhandleClose2() {
    this.setState({
      show3: false,
    });
  }

  render() {
    const { cards } = this.state;
    const { show } = this.state;
    const { show2 } = this.state;
    const { show3 } = this.state;
    const { opened } = this.state;
    const { contents } = this.state;
    return (
      <MuiThemeProvider theme={theme}>
        <h2>Cloud connecting Certs</h2>
        <List>
          {cards.map((tcards) => (
            <ListItem key={tcards}>
              <ListItemAvatar>
                <Avatar>
                  <InsertDriveFileIcon />
                </Avatar>
              </ListItemAvatar>
              <ListItemText primary={tcards} />
              <Button
                variant="outlined"
                color="inherit"
                onClick={() => this.handleClickCOpen(tcards)}
              >
                COMMON NAME
              </Button>
              <Button
                variant="outlined"
                color="inherit"
                onClick={() => this.handleClickOpen(tcards)}
              >
                Open PEM TEXT
              </Button>
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  aria-label="delete"
                  onClick={() => this.delhandleClickOpen(tcards)}
                >
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
        <Dialog
          open={show}
          onClose={this.handleClose}
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
            <Button onClick={this.handleClose} color="primary" autoFocus>
              OK
            </Button>
          </DialogActions>
        </Dialog>
        <Dialog
          open={show2}
          onClose={this.delhandleClose}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">Delete {opened} OK?</DialogTitle>
          <DialogActions>
            <Button autoFocus onClick={this.delhandleClose} color="primary">
              Cancel
            </Button>
            <Button
              onClick={() => this.delhandleDelete(opened)}
              color="primary"
              autoFocus
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>
        <Cloudconnector onClose={() => this.delhandleClose2()} open={show3} />
        <Fab color="primary" aria-label="add">
          <AddIcon onClick={() => this.handleOpen2()} />
        </Fab>
      </MuiThemeProvider>
    );
  }
}

export default Cloudconn;
