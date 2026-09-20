import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { cores } from '../lib/tema';

export default function BotaoPilula({ texto, cor, corTexto, onPress, disabled }) {
  return (
    <TouchableOpacity
      style={[estilos.pilula, { backgroundColor: cor }, disabled && estilos.desativado]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[estilos.texto, corTexto && { color: corTexto }]}>{texto}</Text>
    </TouchableOpacity>
  );
}

const estilos = StyleSheet.create({
  pilula: {
    borderWidth: 2,
    borderColor: cores.borda,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  desativado: {
    opacity: 0.5,
  },
  texto: {
    color: cores.texto,
    fontWeight: 'bold',
    fontSize: 13,
  },
});
