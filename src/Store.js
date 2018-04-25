class DataPepsStore {

  constructor(session, database, storeName, datapepsResourceType) {
    this.session = session;
    this.database = database;

    // notes object store name
    this.storeName = storeName;

    // datapeps resource are created with this type
    this.datapepsResourceType = datapepsResourceType;
  }

  async save(note) {
    // create a resource to encrypt the note
    let resource = await this.session.Resource.create(
      this.datapepsResourceType,
      {},
      [this.session.login]
    );

    // encrypt the note
    let encryptedNoteContent = resource.encrypt(new TextEncoder().encode(note.content));
    let encryptedNote = { ...note, id: resource.id.toString(), content: null, encryptedNoteContent };
    
    //store the note
    await this.putToStore(encryptedNote);
  }

  // fetch the ids of the notes in the database
  async getNotesIds() {
    let tx = this.database.transaction(this.storeName, 'readonly');
    let store = tx.objectStore(this.storeName);
    let request = store.getAllKeys();
    return new Promise((resolve, reject) => {
      tx.oncomplete = (e) => {
        resolve(request.result);
      };
      tx.onerror = (e) => {
        reject(e);
      };
    });
  }

  // fetch and decrypt note's content
  async getNoteContent(id) {
    // fetch note's encrypted content from the store
    let encryptedContent = await this._fetchNoteEncryptedContent(id);

    // decrypt the fetched content
    let decryptedContent = await this._decryptNote(id, encryptedContent);
    let decoder = new TextDecoder();
    return decoder.decode(decryptedContent);
  }

  // decrypt note's content
  async _decryptNote(id, encryptedNoteContent) {
    let resource = await this.session.Resource.get(id);
    let decryptedNoteContent = resource.decrypt(encryptedNoteContent);
    return decryptedNoteContent;
  }

  // get encrypted note's content, as it is stored in the database
  async _fetchNoteEncryptedContent(id) {
    let note = await this.getFromStore(id);
    return note.encryptedNoteContent;
  }

  // fetch encrypted content
  async getNoteEncryptedContent(id) {
    let encryptedContent = await this._fetchNoteEncryptedContent(id);
    return encryptedContent;
  }

  // delete a note
  async delete(noteId) {
    await this.deleteFromStore(noteId);
  }

  // save a previously donwloaded note to the database
  async import(note) {
    let encryptedNote = { ...note, content: null, encryptedNoteContent: note.content };
    await this.putToStore(encryptedNote);
  }

  async putToStore(obj) {
    let tx = this.database.transaction(this.storeName, 'readwrite');
    let store = tx.objectStore(this.storeName);
    store.put(obj);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => {
        resolve();
      };
      tx.onerror = (e) => {
        reject(e);
      };
    }); 
  }

  async deleteFromStore(id) {
    let tx = this.database.transaction(this.storeName, 'readwrite');
    let store = tx.objectStore(this.storeName);
    store.delete(id);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => {
        resolve();
      };
      tx.onerror = (e) => {
        reject(e);
      };
    }); 
  }

  async getFromStore(id) {
    let tx = this.database.transaction(this.storeName, 'readonly');
    let store = tx.objectStore(this.storeName);
    let request = store.get(id);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => {
        resolve(request.result);
      };
      tx.onerror = (e) => {
        reject(e);
      };
    }); 
  }

}

export default DataPepsStore;