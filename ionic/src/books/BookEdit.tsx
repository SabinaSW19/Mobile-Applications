import React, { useContext, useEffect, useState } from 'react';
import {
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonInput,
    IonLoading,
    IonPage,
    IonTitle,
    IonToolbar,
    IonCheckbox,
    IonItem,
    IonLabel
} from '@ionic/react';
import { getLogger } from '../core';
import { BookContext } from './BookProvider';
import { RouteComponentProps } from 'react-router';
import { BookProps } from './BookProps';
import {usePhotoGallery} from "../core/usePhotoGallery";
import {useMyLocation} from "../core/useMyLocation";
import {MyMap} from "../core/MyMap";
import {createShakingAnimation, playGroupAnimation} from "./BookAnimation";

const log = getLogger('BookEdit');

interface BookEditProps extends RouteComponentProps<{
    id?: string;
}> {}

const BookEdit: React.FC<BookEditProps> = ({ history, match }) => {
    const { books, saving, savingError, saveBook } = useContext(BookContext);
    const [title, setTitle] = useState('');
    const [author, setAuthor] = useState('');
    const [price, setPrice] = useState(0);
    const [dateOfPublication, setDateOfPublication] = useState(new Date());
    const [isAvailable, setIsAvailable] = useState(false);
    const [latitude, setLatitude] = useState<number | undefined>(undefined);
    const [longitude, setLongitude] = useState<number | undefined>(undefined);
    const [currentLatitude, setCurrentLatitude] = useState<number | undefined>(undefined);
    const [currentLongitude, setCurrentLongitude] = useState<number | undefined>(undefined);
    const [photo, setPhoto] = useState('');
    const [book, setBook] = useState<BookProps>();

    const location = useMyLocation();
    const {latitude : lat, longitude : lng} = location.position?.coords || {};

    const {takePhoto} = usePhotoGallery();
    useEffect(() => {
        log('useEffect');
        const routeId = match.params.id || '';
        const book = books?.find(bk => bk._id === routeId);
        setBook(book);
        if (book) {
            setTitle(book.title);
            setAuthor(book.author);
            setPrice(book.price);
            setDateOfPublication(book.dateOfPublication);
            setIsAvailable(book.isAvailable);
            setLatitude(book.latitude);
            setLongitude(book.longitude);
            setPhoto(book.photo);
        }
    }, [match.params.id, books]);

    useEffect(() => {
        if (latitude === undefined && longitude === undefined) {
            setCurrentLatitude(lat);
            setCurrentLongitude(lng);
        } else {
            setCurrentLatitude(latitude);
            setCurrentLongitude(longitude);
        }
    }, [lat, lng, longitude, latitude]);

    const handleSave = () => {
        const editedBook = book ? { ...book, title, author,price,dateOfPublication,isAvailable,latitude:latitude,longitude:longitude,photo } : { title, author,price,dateOfPublication,isAvailable,latitude:latitude,longitude:longitude,photo };
        const animationsContainer = validationWithAnimation();
        console.log(animationsContainer);
        if(animationsContainer.length == 0){
            saveBook && saveBook(editedBook).then(() => history.goBack());
        }
        else{
            playGroupAnimation(animationsContainer);
        }
        //saveBook && saveBook(editedBook).then(() => history.goBack());
    };

    async function handlePhotoChange() {
        const image = await takePhoto();
        if (!image) {
            setPhoto('');
        } else {
            setPhoto(image);
        }
    }

    function setLocation() {
        setLatitude(currentLatitude);
        setLongitude(currentLongitude);
    }

    const validationWithAnimation = () => {
        let animationsContainer = [];
        if(!title){
            let titleIonItem = document.getElementById('titleIonItem');
            animationsContainer.push(createShakingAnimation(titleIonItem!!));
        }
        if(!author){
            let authorIonItem = document.getElementById('authorIonItem');
            animationsContainer.push(createShakingAnimation(authorIonItem!!));
        }


        return animationsContainer;
    }

    log('list');
    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Edit</IonTitle>
                    <IonButtons slot="end">
                        <IonButton onClick={handleSave}>
                            Save
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                <IonItem id="titleIonItem">
                <IonInput value={title} onIonChange={e => setTitle(e.detail.value || '')} />
                </IonItem>
                <IonItem id="authorIonItem">
                <IonInput value={author} onIonChange={e => setAuthor(e.detail.value || '')} />
                </IonItem>
                <IonInput type="number" value={price} onIonChange={e => setPrice(parseInt(e.detail.value!))} />
                <IonInput type="date" value={new Date(dateOfPublication).toISOString().split('T')[0]} onIonChange={e => setDateOfPublication(new Date(e.detail.value || ''))} />
                <IonCheckbox checked={isAvailable} onIonChange={e => setIsAvailable(e.detail.checked)} />
                {lat && lng &&
                <MyMap
                    lat={currentLatitude}
                    lng={currentLongitude}
                    onMapClick={log('onMap')}
                    onMarkerClick={log('onMarker')}
                />
                }
                <IonItem>
                    <IonButton onClick={setLocation}>Set location</IonButton>
                </IonItem>

                {photo && (<img onClick={handlePhotoChange} src={photo} width={'100px'} height={'100px'}/>)}
                {!photo && (<img onClick={handlePhotoChange} src={'https://static.thenounproject.com/png/187803-200.png'} width={'100px'} height={'100px'}/>)}
                <IonLoading isOpen={saving} />
                {savingError && (
                    <div>{savingError.message || 'Failed to save book'}</div>
                )}
            </IonContent>
        </IonPage>
    );
    function log(source: string) {
        return (e: any) => {
            setCurrentLatitude(e.latLng.lat());
            setCurrentLongitude(e.latLng.lng());
            console.log(source, e.latLng.lat(), e.latLng.lng());
        }
    }
};

export default BookEdit;
