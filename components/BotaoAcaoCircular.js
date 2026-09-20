import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { cores } from '../lib/tema';

export default function BotaoAcaoCircular({ icone, rotulo, onPress }) {
  return (
    <TouchableOpacity style={estilos.botao} onPress={onPress}>
      <View style={estilos.circulo}>
        <Image source={icone} style={estilos.imagem} resizeMode="cover" />
      </View>
      <View style={estilos.pilulaRotulo}>
        <Text style={estilos.rotuloTexto}>{rotulo}</Text>
      </View>
    </TouchableOpacity>
  );
}

const estilos = StyleSheet.create({
  botao: {
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  circulo: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: cores.painel,
    borderWidth: 3,
    borderColor: cores.borda,
    overflow: 'hidden',
  },
  imagem: {
    width: '100%',
    height: '100%',
  },
  pilulaRotulo: {
    backgroundColor: cores.painel,
    borderWidth: 2,
    borderColor: cores.borda,
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  rotuloTexto: {
    color: cores.texto,
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
