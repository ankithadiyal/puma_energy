import axios from 'axios';

export const axiosPrivate = axios.create({
    baseURL: window.location.origin,
    headers: {
        'Content-Type': 'application/json',
        "x-csrf-token": Liferay.authToken
     },
});