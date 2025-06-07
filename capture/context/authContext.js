import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePathname, useRouter } from 'expo-router';
import { createContext, useContext, useEffect, useState } from 'react';
import { getUserFromToken, loginUser, logoutUser, registerUser } from '../services/authService';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
 // const { from } = useLocalSearchParams();
  const pathname = usePathname();

  useEffect(() => {
    const loadUser = async () => {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const userData = await getUserFromToken(token);
        setUser(userData);
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  /*useEffect(() => {
    console.log('Rota atual mudou para:', pathname);
    // Aqui você pode fazer algo, como resetar estado ou atualizar layout
  }, [pathname]);*/

  useEffect(() => {
    if (!loading){
      router.replace(user ? '/home' : '/login');
    }
    /*if (user && (from === 'login' || from === 'register')) {
      router.replace('/home');
    } else if (!user && !from) {
      router.replace('/login');
    }*/
   
  }, [user, loading]);

  const login = async (email, senha) => {
    const userData = await loginUser(email, senha);
    setUser(userData);
  };

  const register = async (nome, email, senha) => {
    const userData = await registerUser(nome, email, senha);
    setUser(userData);
  };

  const logout = async () => {
    await logoutUser();
    setUser(null);
  };

  function updateUser(userData) {
    setUser(userData);
  }

  return (
    <AuthContext.Provider value={{ user, updateUser, login, logout, register, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
