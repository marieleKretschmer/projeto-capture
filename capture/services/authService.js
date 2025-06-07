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
    api.defaults.headers.Authorization = `Bearer ${token}`;
    const response = await api.get('/auth/getUser');
    return response.data;
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

export const deleteAccount = async () => {
    const response = await api.delete(`/auth/perfil`);
    //await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
    await AsyncStorage.clear();
    return response.data;
};

export const updateProfile = async ({ nome, senhaAtual, novaSenha }) => {
  const response = await api.put('/auth/perfil', {
    nome,
    senhaAtual,
    novaSenha,
  });
  return response.data;
};