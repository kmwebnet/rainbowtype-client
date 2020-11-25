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

/* eslint-disable react/destructuring-assignment */
import React, { Component } from 'react';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import { AppBar, MenuItem, Drawer } from 'material-ui';
import { Link } from 'react-router-dom';
import routes from '../constants/routes.json';

interface ISideDrawerWrapperProps {
  show: boolean;
}

interface IProps extends ISideDrawerWrapperProps {
  drawToggleClickHandler(): void;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface State {}

class NavBar extends Component<IProps, State> {
  private clickHandler = () => {
    this.props.drawToggleClickHandler();
  };

  render() {
    return (
      <MuiThemeProvider>
        <div>
          <Drawer
            docked={false}
            width={220}
            open={this.props.show}
            onRequestChange={() => this.clickHandler()}
          >
            <MenuItem onClick={() => this.clickHandler()}>
              <Link to={routes.HOME}>HOME</Link>
            </MenuItem>
            <MenuItem onClick={() => this.clickHandler()}>
              <Link to={routes.DEVICE}>Device Management</Link>
            </MenuItem>
            <MenuItem onClick={() => this.clickHandler()}>
              <Link to={routes.RTSERVER}>rt Server Cert</Link>
            </MenuItem>
            <MenuItem onClick={() => this.clickHandler()}>
              <Link to={routes.RTCLIENT}>rt Client Cert</Link>
            </MenuItem>
            <MenuItem onClick={() => this.clickHandler()}>
              <Link to={routes.CERTIFICATE}>CA Cert Management</Link>
            </MenuItem>
            <MenuItem onClick={() => this.clickHandler()}>
              <Link to={routes.CLOUDCONNECT}>Cloud connecting</Link>
            </MenuItem>
            <MenuItem onClick={() => this.clickHandler()}>
              <Link to={routes.CERTTEMPLATE}>Device Cert Template</Link>
            </MenuItem>
            <MenuItem onClick={() => this.clickHandler()}>
              <Link to={routes.PROVISION}>Device Cert Provisioning</Link>
            </MenuItem>
            <MenuItem onClick={() => this.clickHandler()}>
              <Link to={routes.DEPLOY}>Deploy rt bootloader</Link>
            </MenuItem>
          </Drawer>
          <AppBar
            title={<img src="../resources/logo.png" alt="Logo" />}
            onLeftIconButtonClick={() => this.clickHandler()}
          />
        </div>
      </MuiThemeProvider>
    );
  }
}

export default NavBar;
