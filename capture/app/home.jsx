import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Modal, Pressable, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Drawer, Provider as PaperProvider, Portal } from 'react-native-paper';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../context/authContext';
import { deleteOCR, listOCR } from '../services/ocrService';
import { colors, fonts, spacing } from '../styles/theme';

export default function Home() {
    const [registros, setRegistros] = useState([]);
    const [busca, setBusca] = useState('');
    const [showConsent, setShowConsent] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const { user, logout } = useAuth();
    const router = useRouter();
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        if (user) {
            setPage(1);
            setRegistros([]);
            fetchDados(1, true);
            verificarConsentimento();
        }
    }, [user, busca]);

    const verificarConsentimento = async () => {
        const consent = await AsyncStorage.getItem('termo');
        if (!consent) setShowConsent(true);
    };

    const fetchDados = async (pagina = 1, replace = false) => {
        if (loading) return;
        setLoading(true);
        try {
            const { registros: novos, total } = await listOCR({ page: pagina, limit, busca });
            setRegistros(prev => replace ? novos : [...prev, ...novos]);
            setTotal(total);
            setPage(pagina);
        } catch (error) {
            console.error('Erro ao buscar registros:', error);
        } finally {
            setLoading(false);
        }
    };

    const carregarMais = () => {
        if (registros.length >= total || loading) return;
        fetchDados(page + 1);
    };

    const aceitarConsentimento = async () => {
        await AsyncStorage.setItem('termo', 'S');
        setShowConsent(false);
    };

    return (
        <PaperProvider>
            <SafeAreaView style={styles.safeArea}>
                {loading && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color="#5E213E" />
                        <Text style={styles.loadingText}>Processando...</Text>
                    </View>
                )}
                <View style={styles.container}>
                    <View style={styles.topo}>
                        <Image source={require('../assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
                        <Text style={styles.bemVindo}>Bem-vindo(a), {user?.nome?.trim().split(' ')[0] || 'Visitante'}</Text>

                        <TouchableOpacity onPress={() => setDrawerOpen(!drawerOpen)}>
                            <Icon name="menu-outline" size={24} color={colors.primary} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.icones}>
                        <TextInput
                            style={styles.busca}
                            placeholder="Buscar"
                            value={busca}
                            onChangeText={setBusca}
                            placeholderTextColor="#aaa"
                        />
                        <TouchableOpacity onPress={() => router.push({ pathname: '/ocrCreate', params: { from: 'home' } })}>
                            <Icon name="create-outline" size={28} color={colors.primary} />
                        </TouchableOpacity>
                    </View>

                    <FlatList
                        data={registros}
                        keyExtractor={(item) => item.id}
                        onEndReached={carregarMais}
                        onEndReachedThreshold={0.2}
                        ListFooterComponent={loading && <ActivityIndicator size="small" color={colors.primary} />}
                        renderItem={({ item }) => (
                            <View style={styles.item}>
                                <Text style={styles.titulo}>{item.titulo}</Text>
                                <View style={styles.acoes}>
                                    <TouchableOpacity onPress={() => router.push({ pathname: '/ocrCreate', params: { from: 'home', id: item.id } })}>
                                        <Icon name="pencil-outline" size={22} color={colors.primary} />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => {
                                            Alert.alert('Confirmar Exclusão', 'Deseja excluir?', [
                                                { text: 'Cancelar', style: 'cancel' },
                                                {
                                                    text: 'Excluir',
                                                    style: 'destructive',
                                                    onPress: async () => {
                                                        try {
                                                            await deleteOCR(item.id);
                                                            Alert.alert('Sucesso', 'Registro excluído.');
                                                            fetchDados(1, true);
                                                        } catch {
                                                            Alert.alert('Erro', 'Falha ao excluir o registro.');
                                                        }
                                                    }
                                                }
                                            ]);
                                        }}
                                    >
                                        <MaterialIcons name="delete" size={24} color="black" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    />

                    <Text style={styles.footer}>Este aplicativo é destinado exclusivamente para uso pessoal.</Text>

                    <Modal visible={showConsent} transparent animationType="fade">
                        <View style={styles.modalOverlay}>
                            <View style={styles.modalContainer}>
                                <Text style={styles.modalTitle}>Termo de Consentimento</Text>
                                <Text style={styles.modalText}>
                                    Ao continuar, você declara estar ciente de que é o único responsável pelas informações que decidir digitalizar ou armazenar no app, incluindo dados sensíveis como documentos pessoais ou dados de saúde.
                                </Text>
                                <Text style={styles.modalText}>
                                    Seus dados não são compartilhados com terceiros sem seu consentimento e são tratados conforme a Lei Geral de Proteção de Dados (LGPD).
                                </Text>
                                <Text style={styles.modalText}>
                                    Ao aceitar, você consente de forma livre e informada com o uso e tratamento desses dados conforme descrito.
                                </Text>
                                <Pressable style={styles.modalButton} onPress={aceitarConsentimento}>
                                    <Text style={styles.modalButtonText}>Aceito</Text>
                                </Pressable>
                            </View>
                        </View>
                    </Modal>
                </View>

                <Portal>
                    {drawerOpen && (
                        <>
                            <Pressable
                                style={styles.drawerOverlay}
                                onPress={() => setDrawerOpen(false)}
                            />
                            <Drawer.Section style={styles.drawer}>
                                <Drawer.Item
                                    label="Ver Perfil"
                                    icon="account-circle-outline"
                                    onPress={() => {
                                        setDrawerOpen(false);
                                        router.push('/profile');
                                    }}
                                />
                                <Drawer.Item
                                    label="Sair"
                                    icon="logout"
                                    onPress={() => {
                                        setDrawerOpen(false);
                                        logout();
                                    }}
                                />
                            </Drawer.Section>
                        </>
                    )}
                </Portal>
            </SafeAreaView>
        </PaperProvider>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: spacing.padding, backgroundColor: '#fff' },
    topo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        marginTop: 20,
    },
    logo: {
        marginTop: 10,
        height: 40,
        width: 120,
        fontSize: 24
    },
    bemVindo: {
        fontSize: 14,
        color: colors.text,
    },
    icones: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 12,
    },
    busca: {
        flex: 1,
        borderColor: '#ccc',
        borderWidth: 1,
        backgroundColor: colors.inputBackground,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginRight: 10,
        borderRadius: 8,
        fontSize: parseInt(fonts.regular),
        color: colors.text,
    },

    item: {
        backgroundColor: colors.inputBackground,
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 12,
        marginBottom: 10,
        borderRadius: 8,
        elevation: 1,
    },
    titulo: {
        fontSize: 16,
        color: colors.text,
        flex: 1,
    },
    acoes: {
        flexDirection: 'row',
        gap: 12,
    },
    footer: {
        padding: 16,
        textAlign: 'center',
        color: '#888',
        fontSize: 12,
        marginTop: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        backgroundColor: '#fff',
        padding: 24,
        borderRadius: 16,
        marginHorizontal: 30,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 10,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.primaryDark,
        marginBottom: 10,
        textAlign: 'center',
    },
    modalText: {
        fontSize: 15,
        color: colors.text,
        marginBottom: 5,
        textAlign: 'justify',
    },
    modalButton: {
        backgroundColor: colors.primary,
        paddingVertical: 12,
        borderRadius: 8,
        marginTop: 15
    },
    modalButtonText: {
        color: '#fff',
        textAlign: 'center',
        fontWeight: '600',
    },
    safeArea: {
        flex: 1,
        backgroundColor: '#fff',
    },
    drawer: {
        backgroundColor: '#fff',
        position: 'absolute',
        top: 60,
        right: 10,
        width: 220,
        borderRadius: 12,
        elevation: 4,
        zIndex: 10,
    }, drawerOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'transparent', // ou 'rgba(0,0,0,0.1)' para escurecer levemente
        zIndex: 5,
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
});
