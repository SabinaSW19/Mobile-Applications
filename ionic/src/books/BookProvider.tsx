import React, {useCallback, useContext, useEffect, useReducer, useState} from 'react';
import PropTypes from 'prop-types';
import { getLogger } from '../core';
import { BookProps } from './BookProps';
import {createBook, getBooks, newWebSocket, syncData, updateBook} from './bookApi';
import { AuthContext } from '../auth';
import {Plugins} from "@capacitor/core";

const {Storage}=Plugins;

const {Network}=Plugins;

const log = getLogger('BookProvider');

type SaveBookFn = (book: BookProps) => Promise<any>;

export interface BooksState {
    books?: BookProps[],
    fetching: boolean,
    fetchingError?: Error | null,
    saving: boolean,
    savingError?: Error | null,
    saveBook?: SaveBookFn,
    connectedNetwork?: boolean,
    setSavedOffline?: Function,
    savedOffline?: boolean
}

interface ActionProps {
    type: string,
    payload?: any,
}

const initialState: BooksState = {
    fetching: false,
    saving: false,
};

const FETCH_BOOKS_STARTED = 'FETCH_BOOKS_STARTED';
const FETCH_BOOKS_SUCCEEDED = 'FETCH_BOOKS_SUCCEEDED';
const FETCH_BOOKS_FAILED = 'FETCH_BOOKS_FAILED';
const SAVE_BOOK_STARTED = 'SAVE_BOOK_STARTED';
const SAVE_BOOK_SUCCEEDED = 'SAVE_BOOK_SUCCEEDED';
const SAVE_BOOK_FAILED = 'SAVE_BOOK_FAILED';

const reducer: (state: BooksState, action: ActionProps) => BooksState =
    (state, { type, payload }) => {
        switch(type) {
            case FETCH_BOOKS_STARTED:
                return { ...state, fetching: true, fetchingError: null };
            case FETCH_BOOKS_SUCCEEDED:
                return { ...state, books: payload.books
                    , fetching: false };
            case FETCH_BOOKS_FAILED:
                return { ...state, fetchingError: payload.error, fetching: false };
            case SAVE_BOOK_STARTED:
                return { ...state, savingError: null, saving: true };
            case SAVE_BOOK_SUCCEEDED:
                const books = [...(state.books || [])];
                const book = payload.book;
                const index = books.findIndex(bk => bk._id === book._id);
                if (index === -1) {
                    books.splice(0, 0, book);
                } else {
                    books[index] = book;
                }
                return { ...state,  books, saving: false };
            case SAVE_BOOK_FAILED:
                return { ...state, savingError: payload.error, saving: false };
            default:
                return state;
        }
    };

export const BookContext = React.createContext<BooksState>(initialState);


interface BookProviderProps {
    children: PropTypes.ReactNodeLike,
}

export const BookProvider: React.FC<BookProviderProps> = ({ children }) => {
    const { token } = useContext(AuthContext);
    const [connectedNetworkStatus, setConnectedNetworkStatus] = useState<boolean>(false);
    Network.getStatus().then(status => setConnectedNetworkStatus(status.connected));
    const [savedOffline, setSavedOffline] = useState<boolean>(false);
    useEffect(networkEffect, [token, setConnectedNetworkStatus]);

    const [state, dispatch] = useReducer(reducer, initialState);
    const { books, fetching, fetchingError, saving, savingError } = state;
    useEffect(getBooksEffect, [token]);
    useEffect(wsEffect, [token]);
    const saveBook = useCallback<SaveBookFn>(saveBookCallback, [token]);
    const value = { books, fetching, fetchingError, saving, savingError, saveBook:saveBook,connectedNetworkStatus,savedOffline,setSavedOffline};
    log('returns');
    return (
        <BookContext.Provider value={value}>
            {children}
        </BookContext.Provider>
    );
    function networkEffect() {
        console.log("network effect");
        let canceled = false;
        Network.addListener('networkStatusChange', async (status) => {
            if (canceled) return;
            const connected = status.connected;
            if (connected) {
                alert("SYNC data");
                await syncData(token);
            }
            setConnectedNetworkStatus(status.connected);
        });
        return () => {
            canceled = true;
        }
    }
    function getBooksEffect() {
        let canceled = false;
        fetchBooks();
        return () => {
            canceled = true;
        }

        async function fetchBooks() {

            if (!token?.trim()) {
                return;
            }
            if (!navigator?.onLine) {
                let storageKeys = Storage.keys();
                const books = await storageKeys.then(async function (storageKeys) {
                    const saved = [];
                    for (let i = 0; i < storageKeys.keys.length; i++) {
                        if (storageKeys.keys[i] !== "token") {
                            const book = await Storage.get({key : storageKeys.keys[i]});
                            if (book.value != null)
                                var parsedBook = JSON.parse(book.value);
                            saved.push(parsedBook);
                        }
                    }
                    return saved;
                });
                dispatch({type: FETCH_BOOKS_SUCCEEDED, payload: {books: books}});
            } else {
                try {
                    log('fetchBooks started');
                    dispatch({type: FETCH_BOOKS_STARTED});
                    const books = await getBooks(token);
                    log('fetchBooks successful');
                    if (!canceled) {
                        dispatch({type: FETCH_BOOKS_SUCCEEDED, payload: {books: books}})
                    }
                } catch (error) {
                    let storageKeys = Storage.keys();
                    const books = await storageKeys.then(async function (storageKeys) {
                        const saved = [];
                        for (let i = 0; i < storageKeys.keys.length; i++) {
                            if (storageKeys.keys[i] !== "token") {
                                const book = await Storage.get({key : storageKeys.keys[i]});
                                if (book.value != null)
                                    var parsedBook = JSON.parse(book.value);
                                saved.push(parsedBook);
                            }
                        }
                        return saved;
                    });
                    dispatch({type: FETCH_BOOKS_SUCCEEDED, payload: {books: books}});
                }
            }
        }
    }

    async function saveBookCallback(book: BookProps) {
        try {
            if (navigator.onLine) {
                log('saveBook started');
                dispatch({ type: SAVE_BOOK_STARTED });
                const updatedBook = await (book._id ? updateBook(token, book) : createBook(token, book))
                log('saveBook successful');
                dispatch({type: SAVE_BOOK_SUCCEEDED, payload: {book: updatedBook}});
            }

            else {
                console.log('saveBook offline');
                log('saveBook failed');
                book._id = (book._id == undefined) ? ('_' + Math.random().toString(36).substr(2, 9)) : book._id;
                await Storage.set({
                    key: book._id!,
                    value: JSON.stringify({
                        _id: book._id,
                        title: book.title,
                        author:book.author,
                        price:book.price,
                        dateOfPublication:book.dateOfPublication,
                        isAvailable:book.isAvailable,
                        latitude:book.latitude,
                        longitude:book.longitude,
                        photo:book.photo
                    })
                });
                dispatch({type: SAVE_BOOK_SUCCEEDED, payload: {book : book}});
                setSavedOffline(true);
            }
        }
        catch(error) {
            log('saveBook failed');
            await Storage.set({
                key: String(book._id),
                value: JSON.stringify(book)
            })
            dispatch({type: SAVE_BOOK_SUCCEEDED, payload: {book : book}});
        }
    }
    function wsEffect() {
        let canceled = false;
        log('wsEffect - connecting');
        let closeWebSocket: () => void;
        if (token?.trim()) {
            closeWebSocket = newWebSocket(token, message => {
                if (canceled) {
                    return;
                }
                const { type, payload: book } = message;
                log(`ws message, item ${type}`);
                if (type === 'created' || type === 'updated') {
                    dispatch({ type: SAVE_BOOK_SUCCEEDED, payload: { book } });
                }
            });
        }
        return () => {
            log('wsEffect - disconnecting');
            canceled = true;
            closeWebSocket?.();
        }
    }
};
function alert(arg0: string) {
    throw new Error('Function not implemented.');
}

