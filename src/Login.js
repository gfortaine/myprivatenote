import React, { Component } from 'react';
import { sign } from './Sign'
import * as DataPeps from 'datapeps-sdk';


class Login extends Component {

  constructor(props) {
    super(props);

    this.steps = {
      1: 'Request delegated access',
      2: 'Requesting delegated access',
      3: 'Waiting for access resolution',
    };

    this.state = {
      // content of the login field
      login: "",
      loginButtonDisabled: false,
      step: 1
    };

    // called each time the text in the Login field changes
    this.onLoginChange = this.onLoginChange.bind(this);

    // called each time the login button is clicked
    this.onButtonClick = this.onButtonClick.bind(this);
    this.login = this.login.bind(this);
  }

  render() {
    return (
      <div className="container login">
        <input
          className="input"
          type="text"
          value={this.state.login}
          placeholder="DataPeps Login"
          onChange={this.onLoginChange}
        />
        <input
          className="button"
          type="button"
          value={this.steps[this.state.step]}
          onClick={this.onButtonClick}
          disabled={this.state.loginButtonDisabled}
        />
      </div>
    );
  }

  // called when Login button is clicked
  async onButtonClick() {
    if (!this.state.login) {
      return;
    }
    try {
      await this.login();
    }
    catch (e) {
      console.log("ERROR: on logging in: ", e);
    }
  }

  async login() {
    // disable the login button
    this.setState({ loginButtonDisabled: true, step: 2 });

    // request delegated access
    let accessRequest =
      await DataPeps.requestDelegatedAccess(this.state.login, sign);

    // change button text
    this.setState({ step: 3 });

    // open a window for delegated access request resolution and resolve the request
    accessRequest.openResolver();
    let session = await accessRequest.waitSession();

    // delegated access request has been resolved
    this.setState({ step: 1, disable: false });
    
    // connect to the IndexedDB and create user store, if necessary
    this.props.connectToDatabase(session);
  }

  // called each time the content of the login field changes
  async onLoginChange(e) {
    this.setState({login: e.target.value})
  }
}

export default Login;