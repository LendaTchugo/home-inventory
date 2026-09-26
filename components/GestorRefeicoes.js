import { useEffect, useState } from 'react';
import { StyleSheet, View, Text, Alert, TouchableOpacity } from 'react-native';
import { lerRefeicoes, criarRefeicao, atualizarRefeicao, eliminarRefeicao, lerInventario } from '../lib/dados';
import { filtrarOrdenarInventario } from '../lib/categorias';
import { cores } from '../lib/tema';
import CampoTexto from './CampoTexto';
import BotaoPilula from './BotaoPilula';
import BarraFiltroOrdenacao from './BarraFiltroOrdenacao';

export default function GestorRefeicoes() {
  const [refeicoes, setRefeicoes] = useState([]);
  const [inventario, setInventario] = useState([]);
  const [erro, setErro] = useState(null);
  const [emEdicao, setEmEdicao] = useState(null);
  const [nome, setNome] = useState('');
  const [itens, setItens] = useState([]);
  const [aGuardar, setAGuardar] = useState(false);
  const [filtro, setFiltro] = useState('');
  const [ordenacao, setOrdenacao] = useState('nome-asc');
  const [unidadesFiltro, setUnidadesFiltro] = useState([]);

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

  function iniciarNova() {
    setEmEdicao('nova');
    setNome('');
    setItens([]);
  }

  function iniciarEdicaoRefeicao(refeicao) {
    setEmEdicao(refeicao.id);
    setNome(refeicao.nome);
    setItens(
      refeicao.itens.map((item) => {
        const inv = inventario.find((i) => i.id === item.categoriaId);
        return {
          categoriaId: item.categoriaId,
          nome: inv ? inv.nome : 'Categoria removida',
          quantidade: String(item.quantidade),
        };
      })
    );
  }

  function cancelar() {
    setEmEdicao(null);
  }

  function adicionarItemARefeicao(categoria) {
    if (itens.some((item) => item.categoriaId === categoria.id)) {
      return;
    }
    setItens((atual) => [...atual, { categoriaId: categoria.id, nome: categoria.nome, quantidade: '1' }]);
  }

  function removerItemDaRefeicao(categoriaId) {
    setItens((atual) => atual.filter((item) => item.categoriaId !== categoriaId));
  }

  function atualizarQuantidadeItem(categoriaId, valor) {
    setItens((atual) =>
      atual.map((item) => (item.categoriaId === categoriaId ? { ...item, quantidade: valor } : item))
    );
  }

  async function guardarRefeicao() {
    const nomeFinal = nome.trim();
    if (!nomeFinal) {
      Alert.alert('Falta o nome', 'Dá um nome à refeição antes de gravar.');
      return;
    }
    if (itens.length === 0) {
      Alert.alert('Sem itens', 'Adiciona pelo menos um item à refeição.');
      return;
    }

    const itensFinais = itens.map((item) => ({
      categoriaId: item.categoriaId,
      quantidade: Number(item.quantidade) || 0,
    }));

    setAGuardar(true);
    try {
      if (emEdicao === 'nova') {
        const novaRefeicao = { id: Date.now().toString(), nome: nomeFinal, itens: itensFinais };
        await criarRefeicao(novaRefeicao);
        setRefeicoes((atual) => [...atual, novaRefeicao]);
      } else {
        await atualizarRefeicao(emEdicao, { nome: nomeFinal, itens: itensFinais });
        setRefeicoes((atual) =>
          atual.map((refeicao) =>
            refeicao.id === emEdicao ? { ...refeicao, nome: nomeFinal, itens: itensFinais } : refeicao
          )
        );
      }
      setEmEdicao(null);
    } catch (e) {
      Alert.alert('Erro ao guardar', e.message);
    } finally {
      setAGuardar(false);
    }
  }

  function confirmarEliminar(id, nomeRefeicao) {
    Alert.alert('Eliminar refeição', `Eliminar "${nomeRefeicao}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await eliminarRefeicao(id);
            setRefeicoes((atual) => atual.filter((refeicao) => refeicao.id !== id));
          } catch (e) {
            Alert.alert('Erro ao eliminar', e.message);
          }
        },
      },
    ]);
  }

  if (emEdicao !== null) {
    const categoriasDisponiveis = filtrarOrdenarInventario(
      inventario.filter((invItem) => !itens.some((item) => item.categoriaId === invItem.id)),
      filtro,
      ordenacao,
      unidadesFiltro
    );

    return (
      <View style={styles.bloco}>
        <Text style={styles.titulo}>{emEdicao === 'nova' ? 'Nova refeição' : 'Editar refeição'}</Text>
        <CampoTexto
          style={styles.input}
          placeholder="Nome da refeição (ex: Pequeno-almoço)"
          value={nome}
          onChangeText={setNome}
        />

        {itens.length > 0 && (
          <View style={styles.listaItensRefeicao}>
            {itens.map((item) => (
              <View key={item.categoriaId} style={styles.linhaItemRefeicao}>
                <Text style={styles.nomeItemRefeicao}>{item.nome}</Text>
                <CampoTexto
                  style={styles.inputQuantidade}
                  keyboardType="numeric"
                  value={item.quantidade}
                  onChangeText={(texto) => atualizarQuantidadeItem(item.categoriaId, texto)}
                />
                <BotaoPilula texto="×" cor={cores.rosa} onPress={() => removerItemDaRefeicao(item.categoriaId)} />
              </View>
            ))}
          </View>
        )}

        <Text style={styles.subtitulo}>Adicionar item do inventário:</Text>
        <BarraFiltroOrdenacao
          filtro={filtro}
          aoMudarFiltro={setFiltro}
          ordenacao={ordenacao}
          aoMudarOrdenacao={setOrdenacao}
          unidadesSelecionadas={unidadesFiltro}
          aoMudarUnidadesSelecionadas={setUnidadesFiltro}
        />
        <View style={styles.linhaChips}>
          {categoriasDisponiveis.length === 0 ? (
            <Text style={styles.vazio}>Todos os itens do inventário já estão nesta refeição.</Text>
          ) : (
            categoriasDisponiveis.map((invItem) => (
              <TouchableOpacity
                key={invItem.id}
                style={styles.chip}
                onPress={() => adicionarItemARefeicao(invItem)}
              >
                <Text style={styles.chipTexto}>+ {invItem.nome}</Text>
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={styles.linhaBotoes}>
          <BotaoPilula texto="Guardar" cor={cores.verde} onPress={guardarRefeicao} disabled={aGuardar} />
          <BotaoPilula texto="Cancelar" cor={cores.painel} onPress={cancelar} disabled={aGuardar} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.bloco}>
      <Text style={styles.titulo}>Refeições</Text>
      {erro && <Text style={styles.aviso}>{erro}</Text>}
      <BotaoPilula texto="+ Nova refeição" cor={cores.verde} onPress={iniciarNova} />
      {refeicoes.length === 0 ? (
        <Text style={styles.vazio}>Ainda não definiste nenhuma refeição.</Text>
      ) : (
        refeicoes.map((refeicao) => (
          <View key={refeicao.id} style={styles.linhaRefeicao}>
            <Text style={styles.nomeRefeicao}>{refeicao.nome}</Text>
            <Text style={styles.detalheRefeicao}>{refeicao.itens.length} item(ns)</Text>
            <View style={styles.linhaBotoes}>
              <BotaoPilula texto="Editar" cor={cores.painel} onPress={() => iniciarEdicaoRefeicao(refeicao)} />
              <BotaoPilula
                texto="Eliminar"
                cor={cores.rosa}
                onPress={() => confirmarEliminar(refeicao.id, refeicao.nome)}
              />
            </View>
          </View>
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
  input: {
    borderWidth: 2,
    borderColor: cores.borda,
    borderRadius: 10,
    padding: 8,
    backgroundColor: '#fff',
  },
  linhaChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: cores.borda,
    backgroundColor: '#fff',
  },
  chipTexto: {
    color: cores.borda,
    fontSize: 13,
  },
  listaItensRefeicao: {
    gap: 6,
  },
  linhaItemRefeicao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nomeItemRefeicao: {
    flex: 1,
    color: cores.texto,
  },
  inputQuantidade: {
    width: 60,
    borderWidth: 2,
    borderColor: cores.borda,
    borderRadius: 10,
    padding: 6,
    backgroundColor: '#fff',
    textAlign: 'center',
  },
  linhaBotoes: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  linhaRefeicao: {
    borderBottomWidth: 2,
    borderBottomColor: cores.borda,
    paddingBottom: 10,
    gap: 4,
  },
  nomeRefeicao: {
    fontWeight: 'bold',
    color: cores.texto,
  },
  detalheRefeicao: {
    color: cores.texto,
    fontSize: 13,
  },
});
