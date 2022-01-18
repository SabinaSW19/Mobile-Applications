import dataStore from 'nedb-promise';

export class BookStore {
  constructor({ filename, autoload }) {
    this.store = dataStore({ filename, autoload });
  }
  
  async find(props) {
    return this.store.find(props);
  }
  
  async findOne(props) {
    return this.store.findOne(props);
  }
  
  async insert(book) {
    let bookTitle=book.title
    let bookAuthor=book.author;
    let bookPrice=book.price;
    let bookDateOfPublication=book.dateOfPublication;
    let bookIsAvailable=book.isAvailable;
    if (!bookTitle) { // validation
      throw new Error('Missing title property')
    }
    if (!bookAuthor) { // validation
      throw new Error('Missing author property')
    }
    if (!bookPrice) { // validation
      throw new Error('Missing price property')
    }
    if (!bookDateOfPublication) { // validation
      throw new Error('Missing date of publication property')
    }
    return this.store.insert(book);
  };
  
  async update(props, book) {
    return this.store.update(props, book);
  }
  
  async remove(props) {
    return this.store.remove(props);
  }
}

export default new BookStore({ filename: './db/books.json', autoload: true,corruptAlertThreshold: 1 });
