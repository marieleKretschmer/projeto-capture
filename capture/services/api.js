import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const api = axios.create({
  baseURL: 'http://192.168.1.6:3000/api/',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('accessToken');

  if (token) {
    const { exp } = jwtDecode(token);
    const now = Math.floor(Date.now() / 1000);
    if (exp < now) {
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      if (refreshToken) {
        const refreshResponse = await axios.post('http://192.168.1.6:3000/api/auth/refresh', {
          refreshToken,
        });

        const newToken = refreshResponse.data.accessToken;
        await AsyncStorage.setItem('accessToken', newToken);
        config.headers.Authorization = `Bearer ${newToken}`;
      }
    } else {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});


export default api;