import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { deleteAccount, getUserFromToken, updateProfile } from '../services/authService';
import { colors } from '../styles/theme';

export default function Profile() {
  const router = useRouter();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [senhaError, setSenhaError] = useState('');
  const [senhaErrorConfere, setSenhaErrorConfere] = useState('');

  useEffect(() => {
    async function loadUser() {
      setLoading(true);
      try {
        const user = await getUserFromToken(await AsyncStorage.getItem('accessToken'));
        setNome(user.nome);
        setEmail(user.email);
      } catch (err) {
        Alert.alert('Erro', 'Não foi possível carregar os dados do usuário.');
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  const salvar = async () => {
    await validateSenha(novaSenha);
    await confereSenhas(novaSenha);

    if (!!senhaError || !!senhaErrorConfere) {
      return;
    }

    if (novaSenha && novaSenha !== confirmarSenha) {
      Alert.alert('Erro', 'A nova senha e a confirmação não coincidem.');
      return;
    }

    try {
      setLoading(true);
      await updateProfile({
        nome,
        senhaAtual,
        novaSenha,
      });

      Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
      router.replace('/home');
    } catch (err) {
      Alert.alert('Erro', err.response?.data?.message || 'Erro ao atualizar perfil.');
    } finally {
      setLoading(false);
    }
  };

  const excluirConta = () => {
    Alert.alert(
      'Tem certeza?',
      'Essa ação não poderá ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await deleteAccount();
              Alert.alert('Conta excluída com sucesso!');
              router.replace('/login');
            } catch (err) {
              Alert.alert('Erro', 'Erro ao excluir conta.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
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

  const confereSenhas = async (value) => {
    if (value !== novaSenha){
      setSenhaErrorConfere('As senhas não conferem.')
    }else{
      setSenhaErrorConfere('');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#5E213E" />
          <Text style={styles.loadingText}>Processando...</Text>
        </View>
      )}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Image source={require('../assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Nome</Text>
          <TextInput style={styles.input} value={nome} onChangeText={setNome} />

          <Text style={styles.label}>E-mail</Text>
          <TextInput style={[styles.input, styles.disabled]} value={email} editable={false} />

          <Text style={styles.label}>Senha atual</Text>
          <TextInput style={styles.input} secureTextEntry value={senhaAtual} onChangeText={setSenhaAtual} />

          <Text style={styles.label}>Nova senha</Text>
          <TextInput
            placeholderTextColor="#aaa"
            value={novaSenha}
            onChangeText={(text) => {
              setNovaSenha(text);
              if (senhaError) validateSenha(text);
            }}
            onBlur={() => validateSenha(novaSenha)}
            style={[styles.input, senhaError ? styles.inputError : null]}
            secureTextEntry
          />
          {senhaError ? <Text style={styles.errorText}>{senhaError}</Text> : null}

          <Text style={styles.label}>Confirmar nova senha</Text>
          <TextInput style={styles.input}
            secureTextEntry
            value={confirmarSenha}
            onChangeText={(text) => {
              setConfirmarSenha(text);
              if (senhaErrorConfere) confereSenhas(text);
            }}
            onBlur={() => confereSenhas(confirmarSenha)}
          />
          {senhaErrorConfere ? <Text style={styles.errorText}>{senhaErrorConfere}</Text> : null}

          <TouchableOpacity style={styles.button} onPress={salvar}>
            <Text style={styles.buttonText}>Salvar alterações</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteButton} onPress={excluirConta}>
            <Text style={styles.deleteText}>Excluir conta</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 10,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    backgroundColor: colors.whiteCard,
    elevation: 4,
  },
  backButton: { padding: 4 },
  logo: { height: 30, width: 120, alignSelf: 'center' },
  scroll: { padding: 20, paddingBottom: 40 },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.inputBackground,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    color: colors.text,
  },
  disabled: {
    backgroundColor: '#eee',
    color: '#666',
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    elevation: 5,
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  deleteButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  deleteText: {
    color: '#b00020',
    fontSize: 16,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#5E213E',
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
});
