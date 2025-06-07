import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../context/authContext';
import { colors, fonts, spacing } from '../styles/theme';

export default function Register() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [emailError, setEmailError] = useState('');
  const [senhaError, setSenhaError] = useState('');

  const { register } = useAuth();
  const router = useRouter();

  const validateEmail = async (value) => {
    const regex = /\S+@\S+\.\S+/;
    if (!regex.test(value)) {
      setEmailError('Digite um e-mail válido.');
    } else {
      setEmailError('');
    }
  };

  const validateSenha = async (value) => {
    if (value.length >= 6 &&
      /[A-Z]/.test(value) &&
      /[a-z]/.test(value) &&
      /\d/.test(value)) {
      setSenhaError('');
    } else {
      setSenhaError('A senha deve ter 6+ caracteres, letra maiúscula, minúscula e número.');
    }
  };

  const handleCadastro = async () => {
    await validateEmail(email);
    await validateSenha(senha);

    if (!nome || !email || !senha || emailError || senhaError) {
      Alert.alert('Erro', 'Preencha todos os campos corretamente.');
      return;
    }

    try {
      await register(nome, email, senha);
      router.push({ pathname: '/home', params: { from: 'register' } });
      //router.replace('/home');
    } catch (err) {
      Alert.alert('Erro ao cadastrar', 'Tente novamente mais tarde.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0} // ajuste conforme seu header
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 5 }}>
        <View style={styles.container}>
          <Text style={styles.titulo}>Cadastro</Text>

          <TextInput
            placeholder="Nome"
            placeholderTextColor="#aaa"
            value={nome}
            onChangeText={setNome}
            style={styles.input}
          />

          <TextInput
            placeholder="Email"
            placeholderTextColor="#aaa"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (emailError) validateEmail(text);
            }}
            onBlur={() => validateEmail(email)}
            style={[styles.input, emailError ? styles.inputError : null]}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

          <TextInput
            placeholder="Senha"
            placeholderTextColor="#aaa"
            value={senha}
            onChangeText={(text) => {
              setSenha(text);
              if (senhaError) validateSenha(text);
            }}
            onBlur={() => validateSenha(senha)}
            style={[styles.input, senhaError ? styles.inputError : null]}
            secureTextEntry
          />
          {senhaError ? <Text style={styles.errorText}>{senhaError}</Text> : null}

          <TouchableOpacity style={styles.button} onPress={handleCadastro}>
            <Text style={styles.buttonText}>Cadastrar</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.replace('/login')}>
            <Text style={styles.link}>Já tem uma conta? Entrar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    padding: spacing.padding,
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
  inputError: {
    borderColor: colors.error,
  },
  errorText: {
    color: colors.error,
    marginTop: -10,
    marginBottom: 8,
    fontSize: 13,
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
});
