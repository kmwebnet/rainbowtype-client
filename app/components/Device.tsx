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

import React, { Component } from 'react';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import fs from 'fs';
import { join } from 'path';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import ListItemText from '@material-ui/core/ListItemText';
import Avatar from '@material-ui/core/Avatar';
import DeviceHubIcon from '@material-ui/icons/DeviceHub';
import Button from '@material-ui/core/Button';
import * as Cert from 'pkijs/src/Certificate';
import { fromBER } from 'asn1js';
import { client, IMessage, connection } from 'websocket';
import { Agent } from 'https';
import Deviceconnector from './Deviceconnector';
import Devicecontroller from './Devicecontroller';

const X509_COMMON_NAME_KEY = '2.5.4.3';

interface Connectobj {
  url: string;
  clientcert: string;
  signerca: string;
  rootca: string;
}

interface Props {
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
  color?: 'blue' | 'green' | 'red';
  type?: 'button' | 'submit';
}

interface IState {
  show: boolean;
  showconnect: boolean;
  serial: string;
  keynum: number;
  trequest: string;
  tdata: string;
  tstate: string;
  ispubkey: boolean;
  connected?: boolean;
  cn?: string;
  devices: Record<string, unknown>;
  url: string;
  https: Agent;
}

class Device extends Component<Props, IState> {
  private a: any;

  private conn: connection | undefined;

  private cred: Connectobj | undefined;

  private client: client | undefined;

  constructor(props: Props) {
    super(props);
    this.state = {
      show: false,
      showconnect: false,
      serial: 'init',
      keynum: 0,
      trequest: '',
      tdata: '',
      tstate: '',
      ispubkey: false,
      connected: false,
      cn: 'initializing...',
      devices: { 'initializing...': {} },
      url: '',
      https: new Agent(),
    };

    this.cred = undefined;

    this.handleClose = this.handleClose.bind(this);

    this.handleconnectOpen = this.handleconnectOpen.bind(this);
    this.handleconnectClose = this.handleconnectClose.bind(this);
    this.messagedecode = this.messagedecode.bind(this);
    this.setcredentials = this.setcredentials.bind(this);
    this.setdevicestatus = this.setdevicestatus.bind(this);
    this.setreqstatus = this.setreqstatus.bind(this);
    this.setstastatus = this.setstastatus.bind(this);
    this.setdatstatus = this.setdatstatus.bind(this);
  }

  componentDidMount() {
    const cpath = 'rtclient/certs/';
    const cards: string[] = [];
    fs.readdirSync(cpath, { withFileTypes: true })
      .filter((files) => files.isFile())
      .forEach((file) => cards.push(file.name));
  }

  componentWillUnmount() {
    if (this.conn !== undefined && this.conn.connected) {
      this.conn.close();
    }
  }

  private setcredentials(obj: Connectobj) {
    this.setState({
      showconnect: false,
    });

    this.cred = obj;
    // eslint-disable-next-line new-cap
    this.client = new client({
      tlsOptions: {
        cert: fs.readFileSync(`rtclient/certs/${this.cred.clientcert}`),
        key: fs.readFileSync(`rtclient/keys/${this.cred.clientcert}.key`),
        ca: [
          fs.readFileSync(`certs/${this.cred.rootca}`),
          fs.readFileSync(`certs/${this.cred.signerca}`),
        ],
        rejectUnauthorized: true,
      },
    });
    if (obj.clientcert !== undefined) {
      this.getcnfromcert(obj.clientcert);
    }

    this.client.on('connectFailed', (error) => {
      console.log(`Connect Error: ${error.toString()}`);
    });

    this.client.on('connect', (connect) => {
      console.log('WebSocket Client Connected');
      this.conn = connect;

      connect.on('error', (error) => {
        console.log(`Connection Error: ${error.toString()}`);
        this.setState({
          connected: false,
        });
      });

      connect.on('close', () => {
        console.log('WebSocket Client Closed');
        connect.close();
        this.setState({
          connected: false,
        });
      });

      this.setState({
        connected: true,
      });
      connect.on('message', this.messagedecode);

      this.getalldevstate();
    });

    this.client.connect(`wss://${this.cred.url}/rtserver`);
    this.setState({
      url: this.cred.url,
    });

    const httpsAgent = new Agent({
      cert: fs.readFileSync(`rtclient/certs/${this.cred.clientcert}`),
      key: fs.readFileSync(`rtclient/keys/${this.cred.clientcert}.key`),
      ca: [
        fs.readFileSync(`certs/${this.cred.rootca}`),
        fs.readFileSync(`certs/${this.cred.signerca}`),
      ],
      rejectUnauthorized: true,
    });
    console.log(httpsAgent);
    this.setState({
      https: httpsAgent,
    });

    console.log(obj);
  }

  private setreqstatus(request: string) {
    this.setState({
      trequest: request,
    });
  }

  private setstastatus(sta: string) {
    this.setState({
      tstate: sta,
    });
  }

  private setdatstatus(data: string) {
    this.setState({
      tdata: data,
    });
  }

  private getalldevstate() {
    if (this.conn !== undefined && this.conn.connected) {
      const { cn } = this.state;
      this.conn.sendUTF(`{"serial": "${cn}" ,"action": "getallstate"}`);
    }
  }

  private setdevicestatus(obj: Record<string, unknown>) {
    obj.action = 'setstate';
    if (this.conn !== undefined) {
      this.conn.sendUTF(JSON.stringify(obj));
    }

    this.setState({
      show: false,
    });

    this.getalldevstate();
  }

  private getcnfromcert(cards: string) {
    const cpath = 'rtclient/certs/';
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

    const subjectAttributes = certder.subject.typesAndValues;
    for (let index = 0; index < subjectAttributes.length; index += 1) {
      const attribute = subjectAttributes[index];
      if (attribute.type.toString() === X509_COMMON_NAME_KEY) {
        commonName = attribute.value.valueBlock.value;
        break;
      }
    }

    this.setState({
      cn: commonName,
    });
  }

  // eslint-disable-next-line class-methods-use-this
  private isJSON(sJSON: string): boolean {
    if (sJSON != null) {
      try {
        JSON.parse(sJSON);
      } catch (e) {
        return false;
      }
      return true;
    }
    return false;
  }

  private handleconnectClose() {
    this.setState({
      showconnect: false,
    });
  }

  private handleClose() {
    this.getalldevstate();

    this.setState({
      show: false,
    });
  }

  private handleconnectOpen() {
    this.setState({
      showconnect: true,
    });
  }

  private handledeviceOpen(device: string) {
    const { https } = this.state;
    if (https !== undefined) {
      this.setState({
        serial: device,
      });

      if (this.a[device].request === 'pkeyissued') {
        this.setState({
          ispubkey: true,
        });
      } else {
        this.setState({
          ispubkey: false,
        });
      }

      this.setState({
        trequest: this.a[device].request,
      });

      this.setState({
        tstate: this.a[device].state,
      });

      this.setState({
        tdata: this.a[device].data,
      });

      this.setState({
        show: true,
      });
    }
  }

  private messagedecode(msg: IMessage) {
    if (msg.type === 'utf8' && msg.utf8Data !== undefined) {
      const { cn } = this.state;
      if (this.isJSON(msg.utf8Data) && cn !== undefined) {
        this.a = JSON.parse(msg.utf8Data);
        console.log(this.a);

        switch (this.a.action) {
          default:
            break;

          case 'responseallstate':
            Object.defineProperty(this.a, 'serial', {
              configurable: true,
            });

            Object.defineProperty(this.a, 'action', {
              configurable: true,
            });

            Object.defineProperty(this.a, cn, {
              configurable: true,
            });

            Object.defineProperty(this.a, '', {
              configurable: true,
            });

            delete this.a.serial;
            delete this.a.action;
            delete this.a[cn];
            delete this.a[''];

            Object.keys(this.a).forEach((key) => {
              console.log(`key: ${key} value: ${this.a[key]}`);
            });

            this.setState({
              devices: this.a,
            });

            break;
        }
      }
    }
  }

  render() {
    const { connected } = this.state;
    let button: string;
    if (connected) {
      button = 'CONNECTED TO RTSERVER. CLICK TO UPDATE STATUS';
    } else {
      button = 'CONNECTION SETTING REQUIRED';
    }

    const { devices } = this.state;
    const { showconnect } = this.state;
    const { serial } = this.state;
    const { trequest } = this.state;
    const { tdata } = this.state;
    const { keynum } = this.state;
    const { tstate } = this.state;
    const { ispubkey } = this.state;
    const { show } = this.state;
    const { url } = this.state;
    const { https } = this.state;

    return (
      <MuiThemeProvider>
        <>
          <h2>Device Management</h2>

          {connected ? (
            <Button
              variant="outlined"
              color="inherit"
              onClick={() => this.getalldevstate()}
            >
              {button}
            </Button>
          ) : (
            <Button
              variant="outlined"
              color="inherit"
              onClick={() => this.handleconnectOpen()}
            >
              {button}
            </Button>
          )}

          <List>
            {Object.keys(devices).map((key) => (
              <ListItem key={key}>
                <ListItemAvatar>
                  <Avatar>
                    <DeviceHubIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText primary={key} />
                <Button
                  disabled={!connected}
                  variant="outlined"
                  color="inherit"
                  // eslint-disable-next-line react/jsx-no-bind
                  onClick={this.handledeviceOpen.bind(this, key)}
                >
                  DEVICE SETTINGS
                </Button>
              </ListItem>
            ))}
          </List>
          <Devicecontroller
            serial={serial}
            request={trequest}
            data={tdata}
            keynum={keynum}
            state={tstate}
            devstatus={this.setdevicestatus}
            reqchange={this.setreqstatus}
            stachange={this.setstastatus}
            datchange={this.setdatstatus}
            ispubkey={ispubkey}
            onClose={() => this.handleClose()}
            open={show}
            url={url}
            https={https}
          />

          <Deviceconnector
            credentials={this.setcredentials}
            onClose={() => this.handleconnectClose()}
            open={showconnect}
          />
        </>
      </MuiThemeProvider>
    );
  }
}

export default Device;
