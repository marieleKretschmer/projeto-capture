import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import QuillEditor, { QuillToolbar } from 'react-native-cn-quill';
import { getOCRById, saveOCR, sendImageOCR, updateOCR } from '../services/ocrService';
import { colors } from '../styles/theme';

export default function ocrEditor() {
    const [imagem, setImagem] = useState(null);
    const [titulo, setTitulo] = useState('');
    const [texto, setTexto] = useState('');
    const [comentario, setComentario] = useState('');
    const router = useRouter();
    const editorRef = useRef();
    const { id } = useLocalSearchParams();

    const exemploDelta = {
        ops: [
            { insert: 'Este é um texto ' },
            { insert: 'negrito', attributes: { bold: true } },
            { insert: ', ' },
            { insert: 'itálico', attributes: { italic: true } },
            { insert: ' e com ' },
            { insert: 'fundo amarelo', attributes: { background: 'yellow' } },
            { insert: '.\n' },
            { insert: 'Nova linha com ' },
            { insert: 'título', attributes: { header: 2 } },
            { insert: '\n' },
        ],
    };

    useEffect(() => {
        if (id) loadData();
    }, [id]);

    const loadData = async () => {
        try {
            const dados = await getOCRById(id);
            setTitulo(dados.titulo || '');
            setComentario(dados.comentario || '');
            setTexto(dados.texto_extraido || '');
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível carregar os dados para edição.');
        }
    };

    useEffect(() => {
        if (!!texto) {
            const timeout = setTimeout(() => {
                //alterar aqui
                editorRef.current?.setContents(exemploDelta);
            }, 100);

            return () => clearTimeout(timeout);
        }
    }, [texto]);


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
            setTexto(response.cleanedText);
            //editorRef.current?.setContentHTML(response.cleanedText || '');
            Alert.alert('Sucesso', 'Imagem processada com sucesso!');
        } catch (err) {
            Alert.alert('Erro', 'Falha ao enviar imagem.');
        }
    };

    const salvar = async () => {
        const conteudo = await editorRef.current?.getContentHtml();

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

    const handleGetHtml = () => {
        editorRef.current?.getHtml().then((res) => {
            Alert.alert('HTML gerado', res);
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.topBar}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <MaterialIcons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Image source={require('../assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
            </View>
            <StatusBar barStyle="dark-content" backgroundColor="#fdfdfd" />
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0} // ajuste conforme seu header
            >
                <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 15 }}>
                    <Text style={styles.label}>Selecione sua imagem</Text>
                    <View style={styles.uploadRow}>
                        <TouchableOpacity style={styles.uploadBox} onPress={selecionarImagem}>
                            <MaterialIcons name="photo-camera" size={28} color="#888" />
                        </TouchableOpacity>
                        {imagem && <Image source={{ uri: imagem }} style={styles.imagePreviewSmall} />}
                    </View>
                    <TextInput
                        placeholder="Título (máx. 100 caracteres)"
                        style={styles.input}
                    />
                    <TextInput
                        placeholder="Título (máx. 100 caracteres)"
                        style={styles.input}
                    />
                    <Text style={styles.title}>Editar texto OCR</Text>
<QuillToolbar
                        editor={editorRef}
                        styles={{
                            toolbar: {
                                provider: (provided) => ({
                                    ...provided,
                                    borderTopWidth: 0,
                                    borderLeftWidth: 0,
                                    borderRightWidth: 0,
                                    backgroundColor: 'white'
                                    
                                }),
                                root: (provided) => ({
                                    backgroundColor: 'ddd',
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
                    <View style={styles.editorContainer}>
                        <QuillEditor
                            ref={editorRef}
                            style={styles.editor}
                            initialDelta={exemploDelta}
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

                    
                    <Text >Comentário</Text>
                    <TextInput
                        placeholder="Título (máx. 100 caracteres)"
                        style={styles.input}
                    />

                    <TouchableOpacity style={styles.button} onPress={handleGetHtml}>
                        <Text style={styles.buttonText}>Ver HTML gerado</Text>
                    </TouchableOpacity></ScrollView>
            </KeyboardAvoidingView>


        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fdfdfd',
        paddingTop: StatusBar.currentHeight || 10,
    },


    editorContainer: {
        flex: 1,
        marginHorizontal: 10,
        marginBottom: 10,
        minHeight: 400,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 12,
        backgroundColor: 'white',
        overflow: 'hidden',
    },
    editorToolbar: {
        marginHorizontal: 20,
    },
    editor: {
        flex: 1,
        padding: 5,
    },
    button: {
        margin: 16,
        backgroundColor: '#5E213E',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
});
