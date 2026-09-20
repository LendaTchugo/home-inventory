import { useCallback, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { lerInventario, atualizarItemInventario } from '../../lib/dados';
import { cores } from '../../lib/tema';
import CampoTexto from '../../components/CampoTexto';

export default function ListaCompras() {
  const [itens, setItens] = useState([]);
  const [erro, setErro] = useState(null);

  useFocusEffect(
    useCallback(() => {
      let ativo = true;
      (async () => {
        try {
          const dados = await lerInventario();
          if (ativo) {
            setItens(dados);
            setErro(null);
          }
        } catch (e) {
          if (ativo) setErro('Não foi possível atualizar a lista.');
        }
      })();
      return () => {
        ativo = false;
      };
    }, [])
  );

  async function guardarMinimo(id, valorTexto) {
    const valor = Number(valorTexto) || 0;
    try {
      await atualizarItemInventario(id, { quantidadeMinima: valor });
      setItens((atual) =>
        atual.map((item) => (item.id === id ? { ...item, quantidadeMinima: valor } : item))
      );
    } catch (e) {
      Alert.alert('Erro ao guardar', e.message);
    }
  }

  const itensEmFalta = itens.filter(
    (item) => item.quantidadeMinima > 0 && item.quantidade < item.quantidadeMinima
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {erro && <Text style={styles.aviso}>{erro}</Text>}

        <View style={styles.secao}>
          <Text style={styles.tituloSecao}>A comprar</Text>
          {itensEmFalta.length === 0 ? (
            <Text style={styles.vazio}>Nada a acabar, por agora.</Text>
          ) : (
            itensEmFalta.map((item) => (
              <View key={item.id} style={styles.linhaFalta}>
                <Text style={styles.nomeItem}>{item.nome}</Text>
                <Text style={styles.detalheFalta}>
                  tens {item.quantidade}
                  {item.unidade}, mínimo {item.quantidadeMinima}
                  {item.unidade}
                </Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.secao}>
          <Text style={styles.tituloSecao}>Configurar mínimos</Text>
          <View style={styles.painel}>
            {itens.length === 0 ? (
              <Text style={styles.vazio}>Ainda não há itens no inventário.</Text>
            ) : (
              itens.map((item, indice) => (
                <View
                  key={item.id}
                  style={[styles.linhaConfig, indice === itens.length - 1 && styles.linhaSemBorda]}
                >
                  <Text style={styles.nomeItemConfig}>
                    {item.nome} ({item.quantidade}
                    {item.unidade})
                  </Text>
                  <CampoTexto
                    style={styles.inputMinimo}
                    keyboardType="numeric"
                    placeholder="mínimo"
                    defaultValue={item.quantidadeMinima ? String(item.quantidadeMinima) : ''}
                    onEndEditing={(evento) => guardarMinimo(item.id, evento.nativeEvent.text)}
                  />
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: cores.fundo,
  },
  scroll: {
    padding: 16,
    gap: 20,
  },
  aviso: {
    color: cores.rosaEscuro,
    fontSize: 13,
  },
  secao: {
    gap: 8,
  },
  tituloSecao: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
    color: cores.texto,
  },
  vazio: {
    color: cores.texto,
  },
  linhaFalta: {
    backgroundColor: cores.painel,
    borderWidth: 3,
    borderColor: cores.borda,
    padding: 12,
    borderRadius: 16,
    gap: 2,
  },
  nomeItem: {
    fontWeight: 'bold',
    color: cores.texto,
  },
  detalheFalta: {
    color: cores.texto,
    fontSize: 13,
  },
  painel: {
    backgroundColor: cores.painel,
    borderWidth: 3,
    borderColor: cores.borda,
    borderRadius: 16,
    paddingHorizontal: 12,
  },
  linhaConfig: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: cores.borda,
    gap: 10,
  },
  linhaSemBorda: {
    borderBottomWidth: 0,
  },
  nomeItemConfig: {
    flex: 1,
    color: cores.texto,
  },
  inputMinimo: {
    width: 70,
    borderWidth: 2,
    borderColor: cores.borda,
    borderRadius: 10,
    padding: 6,
    backgroundColor: '#fff',
    textAlign: 'center',
  },
});
