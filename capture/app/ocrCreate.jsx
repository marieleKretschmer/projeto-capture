import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
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
  View
} from 'react-native';
import QuillEditor, { QuillToolbar } from 'react-native-cn-quill';
import { getOCRById, saveOCR, sendImageOCR, updateOCR } from '../services/ocrService';
import { colors, spacing } from '../styles/theme';

export default function OcrCreate() {
  const [imagem, setImagem] = useState(null);
  const [titulo, setTitulo] = useState('');
  const [delta, setDelta] = useState({});
  const [comentario, setComentario] = useState('');
  const router = useRouter();
  const editorRef = useRef();
  const { id } = useLocalSearchParams();

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const dados = await getOCRById(id);
      const deltaObject = JSON.parse(dados.texto_extraido); 
      setTitulo(dados.titulo || '');
      setComentario(dados.comentario || '');
      setDelta(deltaObject);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar os dados para edição.');
    }
  };

  useEffect(() => {
    if (!!delta) {
      const timeout = setTimeout(() => {
        editorRef.current?.setContents(delta);
      }, 500);

      return () => clearTimeout(timeout);
    }
  }, [delta]);


  const selecionarImagem = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Permita acesso à galeria para selecionar uma imagem.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaType: ['Images'],
      quality: 1,
      base64: false,
    });

    if (!result.canceled) {
      const imageUri = result.assets[0].uri;
      setImagem(imageUri);
      processOCR(result.assets[0]);
    }
  };

  const processOCR = async (asset) => {
    try {
      const response = await sendImageOCR(asset);
      setDelta(response.delta);
      Alert.alert('Sucesso', 'Imagem processada com sucesso!');
    } catch (err) {
      Alert.alert('Erro', 'Falha ao enviar imagem.');
    }
  };

  const salvar = async () => {
    const delta = await editorRef.current?.getContents();
   
    const conteudo = JSON.stringify(delta);
    if (!titulo || !conteudo) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios.');
      return;
    }

    const dados = {
      texto_extraido: conteudo,
      comentario,
      titulo,
    };
    try {
      if (id) {
        await updateOCR(id, dados);
        Alert.alert('Atualizado', 'Registro atualizado com sucesso!');
      } else {
        await saveOCR(dados);
        Alert.alert('Sucesso', 'Registro salvo com sucesso!');
      }

      router.replace('/home');
    } catch (error) {
      Alert.alert('Erro', 'Falha ao salvar os dados.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Image source={require('../assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
      </View>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 25 }}>
          <Text style={styles.label}>Selecione sua imagem</Text>
          <View style={styles.uploadRow}>
            <TouchableOpacity style={styles.uploadBox} onPress={selecionarImagem}>
              <MaterialIcons name="photo-camera" size={28} color="#888" />
            </TouchableOpacity>
            {imagem && <Image source={{ uri: imagem }} style={styles.imagePreviewSmall} />}
          </View>

          <Text style={styles.label}>Título</Text>
          <TextInput
            placeholder="Título (máx. 100 caracteres)"
            value={titulo}
            onChangeText={(text) => setTitulo(text.slice(0, 100))}
            style={styles.input}
          />

          <Text style={styles.label}>Texto extraído</Text>

          <View style={styles.editorContainer}>
            <QuillEditor
              ref={editorRef}
              style={styles.editor}
              webview={{
                nestedScrollEnabled: true,
              }}
              quill={{
                placeholder: 'Edite o texto extraído aqui...',
                theme: 'snow',
                modules: { toolbar: false },
              }}
            />
          </View>
          <QuillToolbar
            editor={editorRef}
            styles={{
              toolbar: {
                provider: (provided) => ({
                  ...provided,
                  borderTopWidth: 0,
                  borderLeftWidth: 0,
                  borderRightWidth: 0,
                  paddingBottom: 5,
                  backgroundColor: '#ddd'
                }),
                root: (provided) => ({
                  ...provided,
                  backgroundColor: '#ddd',
                  width: '100%',
                  paddingBottom: 5,
                  borderRadius: 5,
                  flex: 1,
                }),
              },
            }}
            theme="light"
            options={[
              ['bold', 'italic', 'underline', 'strike'],
              [{ color: [] }, { background: [] }],
            ]}
          />
          <Text style={styles.label}>Comentário</Text>
          <TextInput
            placeholder="Comentário (opcional)"
            value={comentario}
            onChangeText={setComentario}
            style={[styles.input, { height: 80 }]}
            multiline
          />

          <TouchableOpacity style={styles.button} onPress={salvar}>
            <Text style={styles.buttonText}>Salvar</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingBottom: 50, height: '100%' },
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
  logo: {
    height: 30,
    width: 120,
    alignSelf: 'center',
  },
  scroll: {
    padding: spacing.padding,
    paddingBottom: 80,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: spacing.inputMargin,
    color: colors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: colors.inputBackground,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    fontSize: 14,
    color: colors.text,
  },
  uploadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 16,
  },
  uploadBox: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: colors.inputBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePreviewSmall: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  editorContainer: {
    flex: 1,
    marginBottom: 10,
    minHeight: 250,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    backgroundColor: 'white',
    overflow: 'hidden',
  },
  editor: {
    flex: 1,
    padding: 5,
    backgroundColor: '#ddd'
  }
});
