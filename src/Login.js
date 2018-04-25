import React, { Component } from 'react';


class Login extends Component {

  constructor(props) {
    super(props);

    this.state = {
      login: "",
    };

    this.buttonValue = "Login";

    this.onLoginChange = this.onLoginChange.bind(this);
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
          placeholder="A DataPeps Login"
          onChange={this.onLoginChange}
        />
        <input
          className="button"
          type="button"
          value={this.buttonValue}
          onClick={this.onButtonClick}
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
    catch(e) {
      console.log("ERROR: on logging in: ", e);
    }
  }
  
  async login() {
    // connect to the IndexedDB and create user store, if necessary
    await this.props.connectToDatabase({login: this.state.login});
  }
  
  // called each time the content of the login field changes
  async onLoginChange(e) {
    this.setState({login: e.target.value})
  }
}

export default Login;