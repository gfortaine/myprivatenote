class Store {

  constructor(database, storeName) {
    this.database = database;
    this.storeName = storeName
  }

  async save(note) {
    await this.putToStore(note);
  }

  async delete(noteId) {
    await this.deleteFromStore(noteId);
  }

  async getNotes() {
    let tx = this.database.transaction(this.storeName, 'readonly');
    let store = tx.objectStore(this.storeName);
    let request = store.getAll();
    return new Promise((resolve, reject) => {
      tx.oncomplete = (e) => {
        resolve(request.result);
      };
      tx.onerror = (e) => {
        reject(e);
      };
    });
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
}

export default Store;