import { useEffect, useState } from 'react';
import { StyleSheet, View, Text, Alert, TouchableOpacity } from 'react-native';
import { lerRefeicoes, lerInventario, ajustarQuantidadeInventario } from '../lib/dados';
import { cores } from '../lib/tema';
import BotaoPilula from './BotaoPilula';

export default function UsarRefeicao({ aoConcluir }) {
  const [refeicoes, setRefeicoes] = useState([]);
  const [inventario, setInventario] = useState([]);
  const [erro, setErro] = useState(null);
  const [refeicaoSelecionada, setRefeicaoSelecionada] = useState(null);
  const [itensConfirmar, setItensConfirmar] = useState([]);

  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const [refeicoesAtuais, inventarioAtual] = await Promise.all([lerRefeicoes(), lerInventario()]);
        if (ativo) {
          setRefeicoes(refeicoesAtuais);
          setInventario(inventarioAtual);
        }
      } catch (e) {
        if (ativo) setErro('Não foi possível carregar as refeições.');
      }
    })();
    return () => {
      ativo = false;
    };
  }, []);

  function selecionarRefeicao(refeicao) {
    setRefeicaoSelecionada(refeicao.id);
    setItensConfirmar(
      refeicao.itens.map((item) => {
        const inv = inventario.find((invItem) => invItem.id === item.categoriaId);
        return {
          categoriaId: item.categoriaId,
          nome: inv ? inv.nome : 'Categoria removida',
          unidade: inv ? inv.unidade : '',
          quantidade: item.quantidade,
          usar: true,
        };
      })
    );
  }

  function alternarItem(categoriaId) {
    setItensConfirmar((atual) =>
      atual.map((item) => (item.categoriaId === categoriaId ? { ...item, usar: !item.usar } : item))
    );
  }

  async function confirmarUso() {
    let inventarioAtual;
    try {
      inventarioAtual = await lerInventario();
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível verificar o stock atual.');
      return;
    }

    const itensAUsar = itensConfirmar.filter((item) => item.usar);

    const itensInsuficientes = itensAUsar.filter((item) => {
      const invItem = inventarioAtual.find((i) => i.id === item.categoriaId);
      return invItem && item.quantidade > invItem.quantidade;
    });

    if (itensInsuficientes.length > 0) {
      const detalhes = itensInsuficientes
        .map((item) => {
          const invItem = inventarioAtual.find((i) => i.id === item.categoriaId);
          return `${item.nome} (tens ${invItem.quantidade}${item.unidade}, precisas de ${item.quantidade}${item.unidade})`;
        })
        .join('\n');

      Alert.alert(
        'Não há stock suficiente',
        `Estes itens não têm stock suficiente:\n${detalhes}\n\nO stock destes fica a 0 se continuares.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Continuar', onPress: aplicarUso },
        ]
      );
      return;
    }

    aplicarUso();
  }

  async function aplicarUso() {
    const itensAUsar = itensConfirmar.filter((item) => item.usar);
    try {
      await Promise.all(
        itensAUsar.map((item) => ajustarQuantidadeInventario(item.categoriaId, -item.quantidade))
      );
      setRefeicaoSelecionada(null);
      setItensConfirmar([]);
      aoConcluir?.();
    } catch (e) {
      Alert.alert('Erro ao usar refeição', e.message);
    }
  }

  if (refeicaoSelecionada) {
    return (
      <View style={styles.bloco}>
        <Text style={styles.titulo}>Confirmar itens usados</Text>
        <Text style={styles.subtitulo}>Desmarca o que não usaste desta vez.</Text>

        {itensConfirmar.map((item) => (
          <TouchableOpacity
            key={item.categoriaId}
            style={styles.linhaConfirmar}
            onPress={() => alternarItem(item.categoriaId)}
          >
            <Text style={styles.caixa}>{item.usar ? '☑' : '☐'}</Text>
            <Text style={styles.nomeItem}>
              {item.nome} — {item.quantidade}
              {item.unidade}
            </Text>
          </TouchableOpacity>
        ))}

        <View style={styles.linhaBotoes}>
          <BotaoPilula texto="Confirmar" cor={cores.verde} onPress={confirmarUso} />
          <BotaoPilula texto="Cancelar" cor={cores.painel} onPress={() => setRefeicaoSelecionada(null)} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.bloco}>
      <Text style={styles.titulo}>Usar refeição</Text>
      {erro && <Text style={styles.aviso}>{erro}</Text>}
      {refeicoes.length === 0 ? (
        <Text style={styles.vazio}>Ainda não definiste nenhuma refeição.</Text>
      ) : (
        refeicoes.map((refeicao) => (
          <BotaoPilula
            key={refeicao.id}
            texto={refeicao.nome}
            cor={cores.painel}
            onPress={() => selecionarRefeicao(refeicao)}
          />
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bloco: {
    width: '100%',
    gap: 12,
  },
  titulo: {
    fontWeight: 'bold',
    fontSize: 16,
    color: cores.texto,
  },
  subtitulo: {
    fontSize: 13,
    color: cores.texto,
  },
  aviso: {
    color: cores.rosaEscuro,
    fontSize: 13,
  },
  vazio: {
    color: cores.texto,
  },
  linhaConfirmar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  caixa: {
    fontSize: 18,
  },
  nomeItem: {
    fontSize: 15,
    color: cores.texto,
  },
  linhaBotoes: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
});
