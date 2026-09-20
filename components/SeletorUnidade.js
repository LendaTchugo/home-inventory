import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { cores } from '../lib/tema';

const UNIDADES = ['un', 'g', 'L'];

export default function SeletorUnidade({ valor, onSelecionar }) {
  return (
    <View style={styles.linha}>
      {UNIDADES.map((unidade) => (
        <TouchableOpacity
          key={unidade}
          style={[styles.chip, valor === unidade && styles.chipSelecionado]}
          onPress={() => onSelecionar(unidade)}
        >
          <Text style={valor === unidade ? styles.chipTextoSelecionado : styles.chipTexto}>
            {unidade}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  linha: {
    flexDirection: 'row',
    gap: 6,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: cores.borda,
    backgroundColor: '#fff',
  },
  chipSelecionado: {
    backgroundColor: cores.borda,
  },
  chipTexto: {
    color: cores.borda,
    fontSize: 13,
  },
  chipTextoSelecionado: {
    color: '#fff',
    fontSize: 13,
  },
});
