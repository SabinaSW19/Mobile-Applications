
import {authConfig,baseUrl,getLogger,withLogs} from "../core";
import { BookProps } from './BookProps';
import {Plugins} from '@capacitor/core';
import axios from "axios";

const {Storage}=Plugins;

const bookUrl = `http://${baseUrl}/api/book`;

const different = (book1: any, book2: any) => {
    return !(book1.title === book2.title && book1.author === book2.author && book1.price === book2.price && book1.dateOfPublication === book2.dateOfPublication && book1.isAvailable === book2.isAvailable);

}

export const syncData: (token: string) => Promise<BookProps[]> = async token => {
    try {
        const { keys } = await Storage.keys();
        var result = axios.get(bookUrl, authConfig(token));
        result.then(async result => {
            keys.forEach(async i => {
                if (i !== 'token') {
                    const bookOnServer = result.data.find((each: { _id: string; }) => each._id === i);
                    const bookLocal = await Storage.get({key: i});

                    alert('BOOK ON SERVER: ' + JSON.stringify(bookOnServer));
                    alert('BOOK LOCALLY: ' + bookLocal.value!);

                    if (bookOnServer !== undefined && different(bookOnServer, JSON.parse(bookLocal.value!))) {  // actualizare
                        alert('UPDATE ' + bookLocal.value);
                        axios.put(`${bookUrl}/${i}`, JSON.parse(bookLocal.value!), authConfig(token));
                    } else if (bookOnServer === undefined){
                        alert('CREATE' + bookLocal.value!);
                        axios.post(bookUrl, JSON.parse(bookLocal.value!), authConfig(token));
                    }
                }
            })
        }).catch(err => {
            if (err.response) {
                console.log('client received an error response (5xx, 4xx)');
            } else if (err.request) {
                console.log('client never received a response, or request never left');
            } else {
                console.log('anything else');
            }
        })
        return withLogs(result, 'syncItems');
    } catch (error) {
        throw error;
    }
}

export const getBooks: (token: string) => Promise<BookProps[]> = token => {
    try {
        var result = axios.get(bookUrl, authConfig(token));
        console.log("blessed by piscot");
        result.then(async result => {
            for (const each of result.data) {
                await Storage.set({
                    key: each._id!,
                    value: JSON.stringify({
                        _id: each._id,
                        title: each.title,
                        author: each.author,
                        price:each.price,
                        dateOfPublication:each.dateOfPublication,
                        isAvailable:each.isAvailable,
                        latitude:each.latitude,
                        longitude:each.longitude,
                        photo:each.photo
                    })
                });
            }
        }).catch(err => {
            if (err.response) {
                console.log('client received an error response (5xx, 4xx)');
            } else if (err.request) {
                console.log('client never received a response, or request never left');
            } else {
                console.log('anything else');
            }
        })
        return withLogs(result, 'getItems');
    } catch (error) {
        throw error;
    }
}

export const createBook: (token: any, book: any) => Promise<BookProps> = (token, book) => {
    var result = axios.post(bookUrl, book, authConfig(token));
    result.then(async result => {
        var one = result.data;
        await Storage.set({
            key: one._id!,
            value: JSON.stringify({
                _id: one._id,
                title: one.title,
                author: one.author,
                price:one.price,
                dateOfPublication:one.dateOfPublication,
                isAvailable:one.isAvailable,
                latitude:one.latitude,
                longitude:one.longitude,
                photo:one.photo
            })
        });
    }).catch(err => {
        if (err.response) {
            console.log('client received an error response (5xx, 4xx)');
        } else if (err.request) {
            alert('client never received a response, or request never left');
        } else {
            console.log('anything else');
        }
    });
    return withLogs(result, 'createBook');
}


export const updateBook: (token: any, book: any) => Promise<BookProps> = (token, book) => {
    var result = axios.put(`${bookUrl}/${book._id}`, book, authConfig(token));
    result.then(async result => {
        var one = result.data;
        await Storage.set({
            key: one._id!,
            value: JSON.stringify({
                _id: one._id,
                title: one.title,
                author: one.author,
                price:one.price,
                dateOfPublication:one.dateOfPublication,
                isAvailable:one.isAvailable,
                latitude:one.latitude,
                longitude:one.longitude,
                photo:one.photo
            })
        }).catch(err => {
            if (err.response) {
                alert('client received an error response (5xx, 4xx)');
            } else if (err.request) {
                alert('client never received a response, or request never left');
            } else {
                alert('anything else');
            }
        })
    });
    return withLogs(result, 'updateBook');
}

interface MessageData {
    type: string;
    payload: BookProps;
}

const log = getLogger('ws');

export const newWebSocket = (token: string,onMessage: (data: MessageData) => void) => {
    const ws = new WebSocket(`ws://${baseUrl}`)
    ws.onopen = () => {
        log('web socket onopen');
        ws.send(JSON.stringify({ type: 'authorization', payload: { token } }));
    };
    ws.onclose = () => {
        log('web socket onclose');
    };
    ws.onerror = error => {
        log('web socket onerror', error);
    };
    ws.onmessage = messageEvent => {
        log('web socket onmessage');
        onMessage(JSON.parse(messageEvent.data));
    };
    return () => {
        ws.close();
    }
}
