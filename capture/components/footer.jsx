import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../styles/theme';

export default function Footer() {
  return (
    <View style={styles.footer}>
      <Text style={styles.text}>App para fins de uso pessoal e educativo.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderColor: '#ccc',
    backgroundColor: colors.whiteOverlay,
    alignItems: 'center',
  },
  text: {
    fontSize: 12,
    color: colors.primaryDark,
    textAlign: 'center',
  },
});
