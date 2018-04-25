import React, { Component } from 'react';
import Store from './Store'
import './Notes.css'

// downloaded notes are saved with this extension
const fileNameExtension = ".dpr";

class Notes extends Component {

  constructor(props) {
    super(props);

    this.state = {

      // notes store object
      store: new Store(
        this.props.session,
        this.props.db, 
        this.props.dbMeta.storeName,
        this.props.dbMeta.datapepsResourceType),

      // DataPeps session object
      session: this.props.session,

      // notes created or imported by the user
      notes: [],
    }

    // save a note
    this.onSaveNote = this.onSaveNote.bind(this);

    // add to the collection of notes a previously downloaded note
    this.onImportNote = this.onImportNote.bind(this);

    // share notes
    this.onShareNote = this.onShareNote.bind(this);
    this.onShareClose = this.onShareClose.bind(this);

    // delete a note
    this.onDeleteNote = this.onDeleteNote.bind(this);

    // download a note
    this.onDownloadNote = this.onDownloadNote.bind(this); 
    this.downloadNote = this.downloadNote.bind(this);
    this.downloadContent = this.downloadContent.bind(this);

    // expand/collapse a note
    this.onExpandNote = this.onExpandNote.bind(this);
    this.onCollapseNote = this.onCollapseNote.bind(this);

    // internal functions
    this.loadNotes = this.loadNotes.bind(this);
    this.fillNoteContent = this.fillNoteContent.bind(this);

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
            <div className="tile is-child box account-id">
              <span className="icon is-small is-left">
                <i className="fa fa-user" />{this.props.session.login}
              </span>
            </div>
            <ShareNote
              note={this.state.noteToShare}
              session={this.props.session}
              onClose={this.onShareClose}
              downloadContent={this.downloadContent}
            />
            <CreateNote
              onSave={this.onSaveNote}
              onImport={this.onImportNote}
            />
            {this.state.notes.map(note =>
              <Note
                key={note.id}
                note={note}
                onExpand={() => this.onExpandNote(note)}
                onCollapse={() => this.onCollapseNote(note)}
                onDownload={() => this.onDownloadNote(note)}
                onDelete={() => this.onDeleteNote(note)}
                onShare={() => this.onShareNote(note)}
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
      console.log("ERROR: saving a note", e);
    }
  }

  // add to the collection of notes a previously downloaded note
  async onImportNote(note) {
    await this.state.store.import(note);
    await this.loadNotes();
    await this.onExpandNote(note);
  }

  // share note
  async onShareNote(note) {
    let encryptedContent =
      await this.state.store.getNoteEncryptedContent(note.id);
    note = { id: note.id, encryptedContent: encryptedContent };
    this.setState({ noteToShare: note });
  }

  // tidy things up after sharing a note
  async onShareClose() {
    this.setState({ noteToShare: null });
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
  async onDownloadNote(note) {
    try {
      await this.downloadNote(note);
    }
    catch(e) {
      console.log("ERROR: on downloading a note", e);
    }
  }

  async downloadNote(note) {
    let reader = new FileReader()

    reader.onloadend = () => {
      this.downloadContent(reader.result, note.id);
    };

    // fetch the note's content from the database, if not yet done
    let encryptedContent =
      await this.state.store.getNoteEncryptedContent(note.id);

    reader.readAsDataURL(new Blob([encryptedContent]));
  }

  downloadContent(url, noteId) {
    // create a download link
    var link = document.createElement("a");
    link.download = noteId + fileNameExtension;
    link.href = url;
    document.body.appendChild(link);

    // activate a download link
    link.click();
    document.body.removeChild(link);
  }

  // show content of a note
  async onExpandNote(note) {
    try {
      await this.fillNoteContent(note, this.state.store);
      let notes = this.state.notes.map(n => n.id === note.id ? note : n);
      this.setState({ notes });
    }
    catch(e) {
      console.log("ERROR: on expanding a note: ", e);
    }
  }

  // hide content of a note
  onCollapseNote(note) {
    try {
      let notes = this.state.notes.map(
        n => n.id === note.id ? { ...note, content: null } : n);
      this.setState({ notes });
    }
    catch(e) {
      console.log("ERROR: on collapsing a note: ", e);
    }
  }

  // fetch note's content from the database
  async fillNoteContent(note, store) {
    note.content = await this.state.store.getNoteContent(note.id);
  }

  // fetch notes ids from the database
  async loadNotes() {
    let ids = await this.state.store.getNotesIds();
    let notes = ids.map(id => ({id, content: null}));
    this.setState({notes});
  }
}

// represents note share modal menu
class ShareNote extends Component {

  constructor(props) {
    super(props);

    this.state = {
      // login of the user with whom the note is shared
      sharerLogin: '',

      downloadUrl: null,
    }

    // called each time the value in the sharer login field changes
    this.onLoginChange = this.onLoginChange.bind(this);

    // called when the Share button is clicked
    this.onShare = this.onShare.bind(this);
    this.shareNote = this.shareNote.bind(this);
  }

  componentWillReceiveProps() {
    this.setState({ downloadURL: null });
  }

  render() {
    if (this.props.note == null) {
      return null;
    }
    return(
    <div className="modal is-active">
      <div className="modal-background"></div>
      <div className="modal-content">
        <div className="box">
          <h1>Share note {this.props.note.id}</h1>
          <div className="field">
            <div className="control has-icons-left">
              <input
                className="input"
                type="text"
                value={this.state.login}
                placeholder="Account id"
                onChange={this.onLoginChange}
              />
              <span className="icon is-small is-left">
                <i className="fa fa-user"></i>
              </span>
            </div>
          </div>
          <div className="field is-grouped">
            <div className="control">
              {this.state.downloadURL == null ?
                <button className="button" onClick={this.onShare}>
                  Share the note
                </button> :
                <a className="button" href={this.state.downloadURL} download={this.props.note.id + fileNameExtension}>
                  Download the encrypted note
                </a>
              }
            </div>
          </div>
        </div>
      </div>
      <button className="modal-close is-large" aria-label="close" onClick={this.props.onClose} />
    </div>
    );
  }

  // called each time the value in the sharer login field changes
  onLoginChange(e) {
    this.setState({ sharerLogin: e.target.value });
  }

  // called when the share button is clicked
  async onShare() {
    if ('' === this.state.sharerLogin) {
      return;
    }
    try {
      await this.shareNote();
    }
    catch(e) {
      console.log(e);
    }
  }

  async shareNote() {
    // add Bob to the resource's sharing group
    console.log(this.props.note.id, this. state.sharerLogin);
    await this.props.session.Resource.extendSharingGroup(
      this.props.note.id, [this.state.sharerLogin]);

    console.log("1");

    let encryptedContent = this.props.note.encryptedContent;
    let reader = new FileReader();

    reader.onloadend = () => {
      console.log(reader.result);
      this.props.downloadContent(reader.result, this.props.note.id);
    };

    reader.readAsDataURL(new Blob([encryptedContent]));
  }
}

// represents note creation (saving or importing) part of the page
class CreateNote extends Component {

  constructor(props) {
    super(props)

    this.state = {
      // content of a new note field
      textAreaContent: '',
      fileInputValue: '',
    }
    
    // called each time textAreaContent changes
    this.onTextAreaChange = this.onTextAreaChange.bind(this);

    // called to save a new note
    this.onSave = this.onSave.bind(this);

    // called to upload to database a previously downloaded note
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

  // called to save a new note
  onSave() {
    this.props.onSave({ content: this.state.textAreaContent });
    this.setState({textAreaContent: ''});
  }

  // called to upload to database a previously downloaded note
  onUpload(e) {
    let file = e.target.files.item(0);
    if (file == null) {
        return;
    }

    let id = null;
    let reader = new FileReader();

    reader.onloadend = (e) => {
      try {
        let content = new Uint8Array(reader.result);
        this.props.onImport({ content, id });
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
      reader.readAsArrayBuffer(file);
    }
    catch(e) {
      console.log("ERROR: on uploading a note: ", e);
    }
  }

  onFileInputClick() {
    this.setState({fileInputValue: ''});
  }
}

// represents the user's note (saved or imported)
const Note = ({note, onExpand, onCollapse, onDownload, onShare, onDelete}) => {
  return (
    <div className="tile is-child box">
      <article className="media">
        <div className="media-content">
          <div>ID: {note.id}</div>
          {note.content != null ? <div>{note.content}</div> : null}
        </div>
        <div className="media-right">
          {note.content == null ?
            <i className="fa fa-expand" onClick={onExpand} /> :
            <i className="fa fa-compress" onClick={onCollapse} />
          }
          <i className="fa fa-download" onClick={onDownload}/>
          <i className="fa fa-share" onClick={onShare} />
          <i className="fa fa-trash" onClick={onDelete}/>
        </div>
      </article>
    </div>
  );
};

export default Notes;