/* eslint-disable react/destructuring-assignment */
import React from 'react';
import { Switch, Route } from 'react-router-dom';
import routes from './constants/routes.json';
import App from './containers/App';
import HomePage from './containers/HomePage';
import NavBar from './containers/NavBar';
import rtserverPage from './containers/rtserverPage';
import rtclientPage from './containers/rtclientPage';
import CertPage from './containers/CertPage';
import CloudconnPage from './containers/CloudconnPage';
import DevicePage from './containers/DevicePage';
import TemplatePage from './containers/TemplatePage';
import ProvisionPage from './containers/ProvisionPage';
import DeployPage from './containers/DeployPage';

interface State {
  open: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface Props {}

class Routes extends React.Component<Props, State> {
  constructor(props: any) {
    super(props);

    this.handleToggle = this.handleToggle.bind(this) as (
      open: boolean
    ) => boolean;
    this.state = {
      open: false,
    };
  }

  /** If drawer is open, close it. If closed, open it. */
  public handleToggle(open = !this.state.open): boolean {
    this.setState({
      open,
    });
    return open;
  }

  render() {
    return (
      <App>
        <NavBar
          show={this.state.open}
          drawToggleClickHandler={this.handleToggle}
        />
        <Switch>
          <Route exact path={routes.HOME} component={HomePage} />
          <Route path={routes.DEVICE} component={DevicePage} />
          <Route path={routes.RTSERVER} component={rtserverPage} />
          <Route path={routes.RTCLIENT} component={rtclientPage} />
          <Route path={routes.CERTIFICATE} component={CertPage} />
          <Route path={routes.CLOUDCONNECT} component={CloudconnPage} />
          <Route path={routes.CERTTEMPLATE} component={TemplatePage} />
          <Route path={routes.PROVISION} component={ProvisionPage} />
          <Route path={routes.DEPLOY} component={DeployPage} />
        </Switch>
      </App>
    );
  }
}

export default Routes;
