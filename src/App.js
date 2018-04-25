import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import Login from './Login'
import Notes from './Notes'

import 'bulma/css/bulma.css';
import 'font-awesome/css/font-awesome.css';


const storeName = "notes";
const keyPath = "id";
const datapepsResourceType = "myprivatenote/note";

class App extends Component {

  constructor(props) {
    super(props);

    this.state = {
      session: null,
      database: null,
    };

    // called when a user successfully logs in
    this.connectToDatabase = this.connectToDatabase.bind(this);
  }

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">MyPrivateNote</h1>
        </header>
        <div className="App-intro">
          {
            this.state.session == null ?
              (<Login connectToDatabase={this.connectToDatabase} />) :
              (<Notes
                  session={this.state.session}
                  db={this.state.database}
                  dbMeta={ {storeName, datapepsResourceType} }
                />)
          }
        </div>
      </div>
    );
  }

  // called when a user successfully logs in
  connectToDatabase(session) {
    let databaseConnection = indexedDB.open(session.login);
    this.setState({ databaseConnection })

    // if no notes store exists in the database, create one
    databaseConnection.onupgradeneeded = (e) => {
      let db = e.target.result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, {keyPath: keyPath});
      };
    };

    databaseConnection.onsuccess = (e) => {
      this.setState({
        session,
        database: e.target.result,
      });
    };

    databaseConnection.onerror = (e) => {
      session.close();
      console.log("ERROR: on connecting to the database: ", e);
    };
  }
}

export default App;
