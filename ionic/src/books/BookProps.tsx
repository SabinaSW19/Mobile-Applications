export interface BookProps {
    _id?: string;
    title: string;
    author: string;
    price: number;
    dateOfPublication:Date;
    isAvailable:boolean;
    latitude?: number;
    longitude?: number;
    photo: string;
}
