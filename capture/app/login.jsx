import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useAuth } from '../context/authContext';
import { colors, fonts, spacing } from '../styles/theme';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !senha) {
      Alert.alert('Erro', 'Preencha todos os campos.');
      return;
    }

    try {
      await login(email, senha);
      router.push({ pathname: '/home', params: { from: 'login' } });
    } catch (err) {
      Alert.alert('Erro ao entrar', 'Verifique suas credenciais.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 5 }}>
        <View style={styles.overlay}>
          <Image
            source={require('../assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.titulo}>Login</Text>
          <TextInput
            placeholder="E-mail"
            placeholderTextColor="#aaa"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            placeholder="Senha"
            placeholderTextColor="#aaa"
            value={senha}
            onChangeText={setSenha}
            style={styles.input}
            secureTextEntry
          />

          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Entrar</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.replace('/register')}>
            <Text style={styles.link}>Ainda não tem conta? Cadastre-se</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.whiteOverlay,
    justifyContent: 'center',
    paddingHorizontal: spacing.padding,
  },
  titulo: {
    fontSize: parseInt(fonts.title),
    fontWeight: '600',
    color: colors.primaryDark,
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: colors.inputBackground,
    padding: 12,
    borderRadius: 8,
    marginBottom: spacing.inputMargin,
    fontSize: parseInt(fonts.regular),
    color: colors.text,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 12,
    marginBottom: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: parseInt(fonts.medium),
    textAlign: 'center',
    fontWeight: '600',
  },
  link: {
    color: colors.primary,
    fontSize: 15,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  logo: {
    width: 150,
    height: 80,
    marginBottom: 30,
    alignSelf: 'center',
  }
});
