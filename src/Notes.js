import React, { Component } from 'react';
import Store from './Store'

import './Notes.css';

const fileNameExtension = ".dpr";

class Notes extends Component {

  constructor(props) {
    super(props);

    this.state = {
      store: new Store(this.props.db, this.props.storeName),
      session: this.props.session,
      notesIds: [],
      notes: [],
    }

    this.onSaveNote = this.onSaveNote.bind(this);
    this.onImportNote = this.onImportNote.bind(this);
    this.onDeleteNote = this.onDeleteNote.bind(this);
    this.onDownloadNote = this.onDownloadNote.bind(this);
    this.downloadNote = this.downloadNote.bind(this);
    this.downloadContent = this.downloadContent.bind(this);

    try {
      this.loadNotes();
    }
    catch(e) {
      console.log("ERROR: on loading notes: ", e);
    }
  }

  render() {
    return (
      <div className="container">
        <div className="tile is-ancestor is-vertical">
          <CreateNote
            onSave={this.onSaveNote}
            onImport={this.onImportNote}
          />
          {this.state.notes.map(note =>
            <Note
              key={note.id}
              note={note}
              onDelete={() => this.onDeleteNote(note)}
              onDownload={() => this.onDownloadNote(note)}
            />
          )}
        </div>
      </div>
    );
  }

  // save a new note
  async onSaveNote(note) {
    try {
      await this.state.store.save(note);
      this.loadNotes();
    }
    catch(e) {
      console.log("ERROR: on saving a note: ", e);
    }
  }

  // add to the collection of notes a previously downloaded note
  async onImportNote(note) {
    await this.state.store.save(note);
    await this.loadNotes();
  }

  // delete a note
  async onDeleteNote(note) {
    try {
      await this.state.store.delete(note.id);
      this.loadNotes();
    }
    catch(e) {
      console.log("ERROR: on deleting a note: ", e);
    }
  }

  // download a copy of a note
  onDownloadNote(note) {
    try {
      this.downloadNote(note);
    }
    catch(e) {
      console.log("ERROR: on downloading a note: ", e);
    }
  }

  downloadNote(note) {
    let reader = new FileReader();
      reader.onloadend = () => {
          this.downloadContent(reader.result, note.id);
      };
    reader.readAsDataURL(new Blob([note.content]));
  }

  downloadContent(url, noteId) {
    var link = document.createElement("a");
    link.download = noteId + fileNameExtension;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // fetch notes from the database
  async loadNotes() {
    let notes = await this.state.store.getNotes();
    this.setState({notes});
  }
}


class CreateNote extends Component {

  constructor(props) {
    super(props)

    this.state = {
      textAreaContent: '',
      fileInputValue: '',
    }
    
    this.onTextAreaChange = this.onTextAreaChange.bind(this);
    this.onSave = this.onSave.bind(this);
    this.onUpload = this.onUpload.bind(this);
    this.onFileInputClick = this.onFileInputClick.bind(this);
  }

  render() {
    return (                 
      <div className="tile is-child box">
        <article className="media">
          <div className="media-content">
            <div className="field">
              <div className="control">
                <textarea
                  className="textarea"
                  placeholder="Your note"
                  onChange={this.onTextAreaChange}
                  value={this.state.textAreaContent}
                />
              </div>
              <div className="field is-grouped">
                <div className="control">
                  <a className="button" onClick={this.onSave}>
                    <span className="icon">
                      <i className="fa fa-save"></i>
                    </span>
                    <span>Save</span>
                  </a>
                </div>
                <div className="file control">
                  <label className="file-label">
                    <input
                      className="file-input"
                      type="file"
                      name="resume"
                      value={this.state.fileInputValue}
                      onChange={this.onUpload}
                      onClick={this.onFileInputClick}
                    />
                    <span className="file-cta">
                      <span className="file-icon">
                        <i className="fa fa-upload"></i>
                      </span>
                      <span className="file-label">
                        Import
                      </span>
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </article>
      </div>
    );
  }

  // called each time textAreaContent changes
  onTextAreaChange(e) {
    this.setState({textAreaContent: e.target.value});
  }

  // save a new note
  onSave() {
    this.props.onSave({ content: this.state.textAreaContent, id: Date.now().toString() });
    this.setState({textAreaContent: ''});
  }

  // add a note to the store
  onUpload(e) {
    let file = e.target.files.item(0);
    if (file == null) {
        return;
    }

    let id = null;
    let reader = new FileReader();

    reader.onloadend = (e) => {
      try {
        this.props.onImport({ content: reader.result, id });
      }
      catch(e) {
        console.log("ERROR: on importing a note: ", e);
      }
    };

    reader.onerror = (e) => {
      console.log("ERROR: on reading an uploaded note: ", e);
    }
    
    try {
      let name = file.name;
      if (!name.endsWith(fileNameExtension)) {
          throw new Error('Bad filename format');
      }
      id = name.substring(0, name.length - fileNameExtension.length);
      reader.readAsText(file);
    }
    catch(e) {
      console.log("ERROR: on uploading a note: ", e);
    }
  }

  onFileInputClick() {
    this.setState({fileInputValue: ''});
  }
}

const Note = ({note, onDelete, onDownload}) => {
  return (
    <div className="tile is-child box">
      <article className="media">
        <div className="media-content">
          <div>{note.content}</div>
        </div>
        <div className="media-right">
          <i className="fa fa-download" onClick={onDownload}/>
          <i className="fa fa-trash" onClick={onDelete}/>
        </div>
      </article>
    </div>
  );
};

export default Notes;