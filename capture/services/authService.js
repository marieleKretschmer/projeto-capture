import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

export async function loginUser(email, senha) {
    const response = await api.post('/auth/login', { email, senha });
    return handleAuthResponse(response); 
}

export async function registerUser(nome, email, senha) {
    const response = await api.post('/auth/register', { email, senha, nome });
    return handleAuthResponse(response); 
}

export async function getUserFromToken(token) {
    try {
        api.defaults.headers.Authorization = `Bearer ${token}`;
        const response = await api.get('/auth/getUser');
        return response.data;
    } catch (err) {
        // tenta refresh token
        /*if (err.response?.status === 401) {
            const refreshToken = await AsyncStorage.getItem('refreshToken');
            const refreshResponse = await api.post('/auth/refresh', { refreshToken });

            const newToken = refreshResponse.data.accessToken;
            await AsyncStorage.setItem('accessToken', newToken);

            api.defaults.headers.Authorization = `Bearer ${newToken}`;
            const userResponse = await api.get('/auth/getUser');
            return userResponse.data;
        }*/

        throw err;
    }
}

export async function logoutUser() {
    try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (refreshToken) {
            await api.post('/auth/logout', { refreshToken: refreshToken });
        }
    } catch (err) {
        console.error('Erro ao fazer logout:', err);
    } finally {
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
    }
}

async function handleAuthResponse(response) {
  const { accessToken, refreshToken } = response.data;

  await AsyncStorage.setItem('accessToken', accessToken);
  await AsyncStorage.setItem('refreshToken', refreshToken);

  api.defaults.headers.Authorization = `Bearer ${accessToken}`;

  const userResponse = await api.get('/auth/getUser');
  return userResponse.data;
}

//criar excluir conta com await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);