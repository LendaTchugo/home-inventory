import { StyleSheet, TextInput } from 'react-native';

export default function CampoTexto({ style, ...outrasProps }) {
  return <TextInput placeholderTextColor="#999" style={[estilos.base, style]} {...outrasProps} />;
}

const estilos = StyleSheet.create({
  base: {
    color: '#000',
  },
});
