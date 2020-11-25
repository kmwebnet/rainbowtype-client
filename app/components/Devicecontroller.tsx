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
import React from 'react';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import { Agent } from 'https';
import Devicecontrollersub1 from './Devicecontrollersub1';
import Devicecontrollersub2 from './Devicecontrollersub2';
import Devicecontrollersub3 from './Devicecontrollersub3';

type Props = {
  serial: string;
  request: string;
  data: string;
  keynum: number;
  state: string;
  devstatus: (obj: Record<string, unknown>) => void;
  reqchange: (request: string) => void;
  datchange: (data: string) => void;
  stachange: (sta: string) => void;
  ispubkey: boolean;
  onClose: VoidFunction;
  open: boolean;
  url: string;
  https: Agent;
};

function Devicecontroller({
  serial,
  request,
  data,
  keynum,
  state,
  devstatus,
  reqchange,
  datchange,
  stachange,
  ispubkey,
  onClose,
  open,
  url,
  https,
}: Props) {
  const requestChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    if ((event.target.value as string) === 'url') {
      datchange('none');
    }

    reqchange(event.target.value as string);
  };

  const stateChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    stachange(event.target.value as string);
  };

  const setdatstatus = (d: string) => {
    datchange(d);
  };

  const setreqstatus = (req: string) => {
    reqchange(req);
  };

  return (
    <Dialog
      open={open}
      onClose={() => onClose()}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title">
        Device settings of {serial}
      </DialogTitle>

      <DialogContent>
        {ispubkey ? null : (
          <>
            <FormControlLabel
              // eslint-disable-next-line prettier/prettier
              control={(
                <Select
                  labelId="demo-simple-select-label"
                  id="demo-simple-select"
                  value={request}
                  onChange={requestChange}
                >
                  <MenuItem value="none">none</MenuItem>
                  <MenuItem value="pubkey">pubkey</MenuItem>
                  <MenuItem value="ota">ota</MenuItem>
                  <MenuItem value="url">url</MenuItem>
                </Select>
                // eslint-disable-next-line prettier/prettier
              )}
              label="request to device"
            />
          </>
        )}

        {ispubkey ? (
          <Devicecontrollersub1
            serial={serial}
            data={data}
            setdata={setdatstatus}
            setreq={setreqstatus}
          />
        ) : null}

        {request === 'ota' ? (
          <Devicecontrollersub2 url={url} serial={serial} https={https} />
        ) : null}

        {request === 'url' ? (
          <Devicecontrollersub3 data={data} setdata={setdatstatus} />
        ) : null}

        <FormControlLabel
          // eslint-disable-next-line prettier/prettier
          control={(
            <Select
              labelId="demo-simple-select-label"
              id="demo-simple-select"
              value={state}
              onChange={stateChange}
            >
              <MenuItem value="offlineboot">offlineboot</MenuItem>
              <MenuItem value="onlineboot">onlineboot</MenuItem>
              <MenuItem value="forcefwdownload">forcefwdownload</MenuItem>
              <MenuItem value="bootprohibited">bootprohibited</MenuItem>
            </Select>
            // eslint-disable-next-line prettier/prettier
          )}
          label="set device state"
        />
      </DialogContent>

      <DialogActions>
        <Button autoFocus onClick={() => onClose()} color="primary">
          Cancel
        </Button>
        <Button
          onClick={() =>
            devstatus({
              serial,
              request,
              data,
              keynum,
              state,
              // eslint-disable-next-line prettier/prettier
            })}
          color="primary"
          autoFocus
        >
          Change
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default Devicecontroller;
