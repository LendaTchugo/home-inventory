import { useCallback, useState } from 'react';
import {
  StyleSheet,
  View,
  Alert,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { lerCompras, atualizarCompra, eliminarCompra } from '../../lib/dados';
import { cores } from '../../lib/tema';
import CampoTexto from '../../components/CampoTexto';
import BotaoPilula from '../../components/BotaoPilula';

export default function Historico() {
  const [compras, setCompras] = useState([]);
  const [erro, setErro] = useState(null);
  const [idEmEdicao, setIdEmEdicao] = useState(null);
  const [itensEmEdicao, setItensEmEdicao] = useState(null);

  useFocusEffect(
    useCallback(() => {
      let ativo = true;
      setIdEmEdicao(null);
      setItensEmEdicao(null);
      (async () => {
        try {
          const dados = await lerCompras();
          if (ativo) {
            setCompras(dados);
            setErro(null);
          }
        } catch (e) {
          if (ativo) setErro('Não foi possível atualizar o histórico.');
        }
      })();
      return () => {
        ativo = false;
      };
    }, [])
  );

  function iniciarEdicao(id, itensAtuais) {
    setIdEmEdicao(id);
    setItensEmEdicao(JSON.parse(JSON.stringify(itensAtuais)));
  }

  function cancelarEdicao() {
    setIdEmEdicao(null);
    setItensEmEdicao(null);
  }

  function removerItemEmEdicao(indiceItem) {
    setItensEmEdicao((atual) => atual.filter((_, i) => i !== indiceItem));
  }

  function atualizarCampoItem(indiceItem, campo, valor) {
    setItensEmEdicao((atual) =>
      atual.map((item, i) => (i === indiceItem ? { ...item, [campo]: valor } : item))
    );
  }

  async function guardarEdicao() {
    const itensConvertidos = itensEmEdicao.map((item) => ({
      ...item,
      quantidade: item.quantidade === '' || item.quantidade == null ? null : Number(item.quantidade),
      preco: item.preco === '' || item.preco == null ? null : Number(item.preco),
    }));

    try {
      await atualizarCompra(idEmEdicao, itensConvertidos);
      setCompras((atual) =>
        atual.map((compra) => (compra.id === idEmEdicao ? { ...compra, itens: itensConvertidos } : compra))
      );
      setIdEmEdicao(null);
      setItensEmEdicao(null);
    } catch (e) {
      Alert.alert('Erro ao guardar', e.message);
    }
  }

  function confirmarEliminar(id) {
    Alert.alert(
      'Eliminar compra',
      'Tens a certeza que queres eliminar esta compra? Não é possível desfazer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await eliminarCompra(id);
              setCompras((atual) => atual.filter((compra) => compra.id !== id));
            } catch (e) {
              Alert.alert('Erro ao eliminar', e.message);
            }
          },
        },
      ]
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {erro && <Text style={styles.aviso}>{erro}</Text>}

        {compras.length === 0 ? (
          <Text style={styles.vazio}>Ainda não há compras guardadas.</Text>
        ) : (
          <View style={styles.painel}>
            {compras.map((compra, posicao) => (
              <View
                key={compra.id}
                style={[styles.compra, posicao === compras.length - 1 && styles.semBorda]}
              >
                <Text style={styles.dataCompra}>
                  {new Date(compra.data).toLocaleString('pt-PT')}
                </Text>

                {idEmEdicao === compra.id ? (
                  <>
                    {itensEmEdicao.map((item, indiceItem) => (
                      <View key={indiceItem} style={styles.linhaEdicao}>
                        <CampoTexto
                          style={styles.inputItem}
                          value={String(item.item ?? '')}
                          onChangeText={(texto) => atualizarCampoItem(indiceItem, 'item', texto)}
                        />
                        <CampoTexto
                          style={styles.inputNumero}
                          value={String(item.quantidade ?? '')}
                          keyboardType="numeric"
                          onChangeText={(texto) => atualizarCampoItem(indiceItem, 'quantidade', texto)}
                        />
                        <CampoTexto
                          style={styles.inputNumero}
                          value={String(item.preco ?? '')}
                          keyboardType="numeric"
                          onChangeText={(texto) => atualizarCampoItem(indiceItem, 'preco', texto)}
                        />
                        <BotaoPilula texto="×" cor={cores.rosa} onPress={() => removerItemEmEdicao(indiceItem)} />
                      </View>
                    ))}
                    {itensEmEdicao.length === 0 && (
                      <Text style={styles.linhaItem}>Sem artigos — grava para ficar vazio, ou cancela.</Text>
                    )}
                    <View style={styles.linhaBotoes}>
                      <BotaoPilula texto="Guardar" cor={cores.verde} onPress={guardarEdicao} />
                      <BotaoPilula texto="Cancelar" cor={cores.painel} onPress={cancelarEdicao} />
                    </View>
                  </>
                ) : (
                  <>
                    {compra.itens.map((item, j) => (
                      <Text key={j} style={styles.linhaItem}>
                        {item.quantidade}x {item.item} —{' '}
                        {item.preco != null ? `${item.preco}€` : '?'}
                      </Text>
                    ))}
                    {idEmEdicao === null && (
                      <View style={styles.linhaBotoes}>
                        <BotaoPilula texto="Editar" cor={cores.painel} onPress={() => iniciarEdicao(compra.id, compra.itens)} />
                        <BotaoPilula texto="Eliminar" cor={cores.rosa} onPress={() => confirmarEliminar(compra.id)} />
                      </View>
                    )}
                  </>
                )}
              </View>
            ))}
          </View>
        )}
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
    gap: 12,
  },
  aviso: {
    color: cores.rosaEscuro,
    fontSize: 13,
  },
  vazio: {
    color: cores.texto,
  },
  painel: {
    backgroundColor: cores.painel,
    borderWidth: 3,
    borderColor: cores.borda,
    borderRadius: 16,
    paddingHorizontal: 12,
  },
  compra: {
    borderBottomWidth: 2,
    borderBottomColor: cores.borda,
    paddingVertical: 12,
    gap: 6,
  },
  semBorda: {
    borderBottomWidth: 0,
  },
  dataCompra: {
    fontWeight: 'bold',
    marginBottom: 2,
    color: cores.texto,
  },
  linhaItem: {
    fontSize: 14,
    color: cores.texto,
  },
  linhaEdicao: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  inputItem: {
    flex: 2,
    borderWidth: 2,
    borderColor: cores.borda,
    borderRadius: 10,
    padding: 6,
    backgroundColor: '#fff',
  },
  inputNumero: {
    flex: 1,
    borderWidth: 2,
    borderColor: cores.borda,
    borderRadius: 10,
    padding: 6,
    backgroundColor: '#fff',
  },
  linhaBotoes: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
});
