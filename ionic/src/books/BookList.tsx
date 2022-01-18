import React, {useContext, useEffect, useState} from 'react';
import { RouteComponentProps } from 'react-router';
import {
    IonContent,
    IonFab,
    IonFabButton,
    IonHeader,
    IonIcon,
    IonList, IonLoading,
    IonPage,
    IonTitle,
    IonToolbar,
    IonLabel,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonSearchbar,
    IonSelectOption,
    IonChip,
    IonToast,
    IonSelect,
    IonItem,
} from '@ionic/react';
import { add } from 'ionicons/icons';
import Book from './Book';
import { getLogger } from '../core';
import { BookContext } from './BookProvider';
import {useNetwork} from "./useNetwork";
import {AuthContext} from "../auth";
import {BookProps} from "./BookProps";
import {Plugins} from "@capacitor/core";

const {Network}=Plugins;

const log = getLogger('BookList');
const offset = 10;

const BookList: React.FC<RouteComponentProps> = ({ history }) => {
    const { books, fetching, fetchingError } = useContext(BookContext);
    const { logout } = useContext(AuthContext)
    const [disableInfiniteScroll, setDisabledInfiniteScroll] = useState<boolean>(false);
    const [visibleBooks, setVisibleBooks] = useState<BookProps[] | undefined>([]);
    const [page, setPage] = useState(offset)
    const [filter, setFilter] = useState<string | undefined>(undefined);
    const [search, setSearch] = useState<string>("");
    const [status, setStatus] = useState<boolean>(true);
    const {savedOffline, setSavedOffline} = useContext(BookContext);
    Network.getStatus().then(status => setStatus(status.connected));

    Network.addListener('networkStatusChange', (status) => {
        setStatus(status.connected);
    })
        //console.log(visibleBooks);
    const authors = ["Brandon Sanderson", "Robert Jordan", "JRR Tolkien","VE Schwab","Rick Riordan"];

    useEffect(() => {
        if (books?.length && books?.length > 0) {
            setPage(offset);
            fetchData();
            console.log(books);
        }
    }, [books]);

    useEffect(() => {
        if (books && filter) {
            setVisibleBooks(books.filter(each => String(each.author) === filter));
        }
    }, [filter]);

    useEffect(() => {
        if (search === "") {
            setVisibleBooks(books);
        }
        if (books && search !== "") {
            setVisibleBooks(books.filter(each => each.title.startsWith(search)));
        }
    }, [search])

    function fetchData() {
        setVisibleBooks(books?.slice(0, page + offset));
        console.log(page + offset);
        console.log(books);
        setPage(page + offset);
        if (books && page > books?.length) {
            setDisabledInfiniteScroll(true);
            setPage(books.length);
        } else {
            console.log('infinite');
            setDisabledInfiniteScroll(false);
        }
    }

    async function searchNext($event: CustomEvent<void>) {
        fetchData();
        ($event.target as HTMLIonInfiniteScrollElement).complete();
    }

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>
                        Library
                    </IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                <IonToolbar>
                    <IonItem>
                <IonSelect style={{width: '40%'}} value={filter} placeholder="Authors"
                           onIonChange={(e: { detail: { value: React.SetStateAction<string | undefined>; }; }) => setFilter(e.detail.value)}>
                    {authors.map((each) => (
                        <IonSelectOption key={each} value={each}>
                            {each}
                        </IonSelectOption>
                    ))}
                </IonSelect>
                <IonSearchbar style={{width: '50%'}} placeholder="Search by title" value={search} debounce={200}
                              onIonChange={(e) => {
                                  setSearch(e.detail.value!);
                              }}>
                </IonSearchbar>
                <IonChip>
                    <IonLabel color={status ? "success" : "danger"}>{status ? "Online" : "Offline"}</IonLabel>
                </IonChip>
                    </IonItem>
                    </IonToolbar>
                <IonLoading isOpen={fetching} message="Fetching books" />
                {visibleBooks && (
                    <IonList>
                        {Array.from(visibleBooks)
                                .filter(each => {
                                    if (filter !== undefined)
                                        return String(each.author) === filter && each._id !== undefined;
                                    return each._id !== undefined;
                                })
                            .map(({ _id, title,author,price,dateOfPublication,isAvailable,latitude,longitude,photo}) =>
                            <Book key={_id} _id={_id} title={title} author={author} price={price} dateOfPublication={dateOfPublication} isAvailable={isAvailable} latitude={latitude} longitude={longitude} photo={photo} onEdit={id => history.push(`/book/${id}`)} />)}
                    </IonList>
                )}
                <IonInfiniteScroll threshold="100px" disabled={disableInfiniteScroll}
                                   onIonInfinite={(e: CustomEvent<void>) => searchNext(e)}>
                    <IonInfiniteScrollContent loadingText="Loading...">
                    </IonInfiniteScrollContent>
                </IonInfiniteScroll>

                {fetchingError && (
                    <div>{fetchingError.message || 'Failed to fetch books'}</div>
                )}
                <IonFab vertical="bottom" horizontal="end" slot="fixed">
                    <IonFabButton onClick={() => history.push('/book')}>
                        <IonIcon icon={add} />
                    </IonFabButton>
                </IonFab>
                <IonFab vertical="bottom" horizontal="start" slot="fixed" >
                    <IonFabButton onClick={handleLogout}>
                        LOG OUT
                    </IonFabButton>
                </IonFab>
            </IonContent>
        </IonPage>
    );
    function handleLogout() {
        log("logout");
        logout?.();
    }
};

export default BookList;
