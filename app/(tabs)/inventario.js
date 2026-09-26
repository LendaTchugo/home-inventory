import { useCallback, useState } from 'react';
import {
  StyleSheet,
  View,
  Image,
  Alert,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import {
  lerInventario,
  criarItemInventario,
  atualizarItemInventario,
  eliminarItemInventario,
  ajustarQuantidadeInventario,
} from '../../lib/dados';
import { filtrarOrdenarInventario } from '../../lib/categorias';
import { cores } from '../../lib/tema';
import CampoTexto from '../../components/CampoTexto';
import SeletorUnidade from '../../components/SeletorUnidade';
import BotaoAcaoCircular from '../../components/BotaoAcaoCircular';
import BotaoPilula from '../../components/BotaoPilula';
import BarraFiltroOrdenacao from '../../components/BarraFiltroOrdenacao';
import GestorRefeicoes from '../../components/GestorRefeicoes';
import UsarRefeicao from '../../components/UsarRefeicao';

const ICONES_UNIDADE = {
  g: require('../../assets/ItemG.png'),
  L: require('../../assets/ItemL.png'),
  un: require('../../assets/ItemUn.png'),
};

export default function Inventario() {
  const [itens, setItens] = useState([]);
  const [erro, setErro] = useState(null);
  const [mostrarFormAdicionar, setMostrarFormAdicionar] = useState(false);
  const [nomeNovo, setNomeNovo] = useState('');
  const [unidadeNovo, setUnidadeNovo] = useState('un');
  const [quantidadeNovo, setQuantidadeNovo] = useState('');
  const [aGuardar, setAGuardar] = useState(false);
  const [idEmEdicao, setIdEmEdicao] = useState(null);
  const [edicao, setEdicao] = useState(null);
  const [idEmUso, setIdEmUso] = useState(null);
  const [modoUso, setModoUso] = useState('quantidade');
  const [valorUso, setValorUso] = useState('');
  const [mostrarGestorRefeicoes, setMostrarGestorRefeicoes] = useState(false);
  const [mostrarUsarRefeicao, setMostrarUsarRefeicao] = useState(false);
  const [filtro, setFiltro] = useState('');
  const [ordenacao, setOrdenacao] = useState('nome-asc');
  const [unidadesFiltro, setUnidadesFiltro] = useState([]);

  useFocusEffect(
    useCallback(() => {
      let ativo = true;
      setMostrarFormAdicionar(false);
      setIdEmEdicao(null);
      setEdicao(null);
      setIdEmUso(null);
      setValorUso('');
      setMostrarGestorRefeicoes(false);
      setMostrarUsarRefeicao(false);
      (async () => {
        try {
          const dados = await lerInventario();
          if (ativo) {
            setItens(dados);
            setErro(null);
          }
        } catch (e) {
          if (ativo) setErro('Não foi possível atualizar o inventário.');
        }
      })();
      return () => {
        ativo = false;
      };
    }, [])
  );

  async function adicionarItem() {
    const nome = nomeNovo.trim();
    if (!nome) {
      Alert.alert('Falta o nome', 'Dá um nome ao item antes de adicionar.');
      return;
    }

    const novoItem = {
      id: Date.now().toString(),
      nome,
      unidade: unidadeNovo,
      quantidade: Number(quantidadeNovo) || 0,
    };

    setAGuardar(true);
    try {
      await criarItemInventario(novoItem);
      setItens((atual) => [...atual, novoItem]);
      setNomeNovo('');
      setUnidadeNovo('un');
      setQuantidadeNovo('');
      setMostrarFormAdicionar(false);
    } catch (e) {
      Alert.alert('Erro ao adicionar', e.message);
    } finally {
      setAGuardar(false);
    }
  }

  function iniciarEdicao(item) {
    setIdEmEdicao(item.id);
    setEdicao({ nome: item.nome, unidade: item.unidade, quantidade: String(item.quantidade) });
  }

  function cancelarEdicao() {
    setIdEmEdicao(null);
    setEdicao(null);
  }

  async function guardarEdicao() {
    const nomeFinal = edicao.nome.trim();
    const campos = {
      nome: nomeFinal || undefined,
      unidade: edicao.unidade,
      quantidade: Number(edicao.quantidade) || 0,
    };
    try {
      await atualizarItemInventario(idEmEdicao, campos);
      setItens((atual) =>
        atual.map((item) =>
          item.id === idEmEdicao
            ? { ...item, nome: nomeFinal || item.nome, unidade: campos.unidade, quantidade: campos.quantidade }
            : item
        )
      );
      setIdEmEdicao(null);
      setEdicao(null);
    } catch (e) {
      Alert.alert('Erro ao guardar', e.message);
    }
  }

  function iniciarUso(item) {
    setIdEmUso(item.id);
    setModoUso('quantidade');
    setValorUso('');
  }

  function cancelarUso() {
    setIdEmUso(null);
    setValorUso('');
  }

  function confirmarUso() {
    const item = itens.find((i) => i.id === idEmUso);
    const valor = Number(valorUso) || 0;
    const aSubtrair = modoUso === 'percentagem' ? (item.quantidade * valor) / 100 : valor;

    if (aSubtrair > item.quantidade) {
      Alert.alert(
        'Não há stock suficiente',
        `Só tens ${item.quantidade}${item.unidade} de "${item.nome}", mas estás a tentar usar ${aSubtrair}${item.unidade}. O stock fica a 0 se continuares.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Continuar', onPress: () => aplicarUso(item, aSubtrair) },
        ]
      );
      return;
    }

    aplicarUso(item, aSubtrair);
  }

  async function aplicarUso(item, aSubtrair) {
    try {
      await ajustarQuantidadeInventario(item.id, -aSubtrair);
      setItens((atual) =>
        atual.map((i) => (i.id === item.id ? { ...i, quantidade: Math.max(0, i.quantidade - aSubtrair) } : i))
      );
      setIdEmUso(null);
      setValorUso('');
    } catch (e) {
      Alert.alert('Erro ao usar', e.message);
    }
  }

  function confirmarEliminar(id, nome) {
    Alert.alert(
      'Eliminar item',
      `Tens a certeza que queres eliminar "${nome}" do inventário? O histórico de compras não é afetado.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await eliminarItemInventario(id);
              setItens((atual) => atual.filter((item) => item.id !== id));
            } catch (e) {
              Alert.alert('Erro ao eliminar', e.message);
            }
          },
        },
      ]
    );
  }

  const nadaEmDestaque =
    !mostrarGestorRefeicoes && !mostrarUsarRefeicao && !mostrarFormAdicionar;
  const itensExibidos = filtrarOrdenarInventario(itens, filtro, ordenacao, unidadesFiltro);

  return (
    <KeyboardAvoidingView
      style={estilos.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={estilos.scroll} keyboardShouldPersistTaps="handled">
        {erro && <Text style={estilos.aviso}>{erro}</Text>}

        {nadaEmDestaque && (
          <View style={estilos.linhaAcoes}>
            <BotaoAcaoCircular
              icone={require('../../assets/AddIngredientIcon.png')}
              rotulo="Adicionar Item"
              onPress={() => setMostrarFormAdicionar(true)}
            />
            <BotaoAcaoCircular
              icone={require('../../assets/AddMealIcon.png')}
              rotulo="Adicionar Refeição"
              onPress={() => setMostrarGestorRefeicoes(true)}
            />
            <BotaoAcaoCircular
              icone={require('../../assets/UseMeal.png')}
              rotulo="Usar Refeição"
              onPress={() => setMostrarUsarRefeicao(true)}
            />
          </View>
        )}

        {mostrarFormAdicionar && (
          <View style={estilos.formularioNovo}>
            <Text style={estilos.tituloForm}>Adicionar item ao inventário</Text>
            <CampoTexto
              style={estilos.input}
              placeholder="Nome (ex: Ovos)"
              value={nomeNovo}
              onChangeText={setNomeNovo}
            />
            <View style={estilos.linhaForm}>
              <Text style={estilos.rotuloInline}>Unidade:</Text>
              <SeletorUnidade valor={unidadeNovo} onSelecionar={setUnidadeNovo} />
            </View>
            <CampoTexto
              style={estilos.input}
              placeholder="Quantidade inicial"
              value={quantidadeNovo}
              keyboardType="numeric"
              onChangeText={setQuantidadeNovo}
            />
            <View style={estilos.linhaBotoes}>
              <BotaoPilula texto="Adicionar" cor={cores.verde} onPress={adicionarItem} disabled={aGuardar} />
              <BotaoPilula
                texto="Cancelar"
                cor={cores.painel}
                onPress={() => setMostrarFormAdicionar(false)}
                disabled={aGuardar}
              />
            </View>
          </View>
        )}

        {mostrarGestorRefeicoes && (
          <View style={estilos.blocoRefeicoes}>
            <BotaoPilula
              texto="< Voltar ao Inventário"
              cor={cores.painel}
              onPress={() => setMostrarGestorRefeicoes(false)}
            />
            <GestorRefeicoes />
          </View>
        )}

        {mostrarUsarRefeicao && (
          <View style={estilos.blocoRefeicoes}>
            <BotaoPilula
              texto="< Voltar ao Inventário"
              cor={cores.painel}
              onPress={() => setMostrarUsarRefeicao(false)}
            />
            <UsarRefeicao
              aoConcluir={async () => {
                setMostrarUsarRefeicao(false);
                try {
                  setItens(await lerInventario());
                } catch (e) {
                  setErro('Não foi possível atualizar o inventário.');
                }
              }}
            />
          </View>
        )}

        {nadaEmDestaque && itens.length > 0 && (
          <BarraFiltroOrdenacao
            filtro={filtro}
            aoMudarFiltro={setFiltro}
            ordenacao={ordenacao}
            aoMudarOrdenacao={setOrdenacao}
            unidadesSelecionadas={unidadesFiltro}
            aoMudarUnidadesSelecionadas={setUnidadesFiltro}
          />
        )}

        {nadaEmDestaque && (
          <View style={estilos.painelLista}>
            {itens.length === 0 ? (
              <Text style={estilos.vazio}>Ainda não há itens no inventário.</Text>
            ) : itensExibidos.length === 0 ? (
              <Text style={estilos.vazio}>Nenhum item corresponde ao filtro.</Text>
            ) : (
              itensExibidos.map((item, indice) => (
                <View
                  key={item.id}
                  style={[estilos.item, indice === itensExibidos.length - 1 && estilos.itemSemBorda]}
                >
                  {idEmEdicao === item.id ? (
                    <>
                      <CampoTexto
                        style={estilos.input}
                        value={edicao.nome}
                        onChangeText={(texto) => setEdicao((atual) => ({ ...atual, nome: texto }))}
                      />
                      <View style={estilos.linhaForm}>
                        <Text style={estilos.rotuloInline}>Unidade:</Text>
                        <SeletorUnidade
                          valor={edicao.unidade}
                          onSelecionar={(unidade) => setEdicao((atual) => ({ ...atual, unidade }))}
                        />
                      </View>
                      <CampoTexto
                        style={estilos.input}
                        value={edicao.quantidade}
                        keyboardType="numeric"
                        onChangeText={(texto) => setEdicao((atual) => ({ ...atual, quantidade: texto }))}
                      />
                      <View style={estilos.linhaBotoes}>
                        <BotaoPilula texto="Guardar" cor={cores.verde} onPress={guardarEdicao} />
                        <BotaoPilula texto="Cancelar" cor={cores.painel} onPress={cancelarEdicao} />
                      </View>
                    </>
                  ) : idEmUso === item.id ? (
                    <View style={estilos.usoForm}>
                      <Text style={estilos.nomeItem}>{item.nome}</Text>
                      <View style={estilos.linhaBotoes}>
                        <BotaoPilula
                          texto="Quantidade"
                          cor={modoUso === 'quantidade' ? cores.verde : cores.painel}
                          onPress={() => setModoUso('quantidade')}
                        />
                        <BotaoPilula
                          texto="Percentagem"
                          cor={modoUso === 'percentagem' ? cores.verde : cores.painel}
                          onPress={() => setModoUso('percentagem')}
                        />
                      </View>
                      <CampoTexto
                        style={estilos.input}
                        placeholder={
                          modoUso === 'percentagem' ? '% a usar (ex: 50)' : `Quantidade em ${item.unidade}`
                        }
                        keyboardType="numeric"
                        value={valorUso}
                        onChangeText={setValorUso}
                      />
                      <View style={estilos.linhaBotoes}>
                        <BotaoPilula texto="Confirmar" cor={cores.verde} onPress={confirmarUso} />
                        <BotaoPilula texto="Cancelar" cor={cores.painel} onPress={cancelarUso} />
                      </View>
                    </View>
                  ) : (
                    <View style={estilos.linhaItem}>
                      <View style={estilos.circuloItem}>
                        <Image
                          source={ICONES_UNIDADE[item.unidade] ?? ICONES_UNIDADE.un}
                          style={estilos.imagemItem}
                          resizeMode="cover"
                        />
                      </View>
                      <View style={estilos.infoItem}>
                        <View style={estilos.linhaNomeQuantidade}>
                          <Text style={estilos.nomeItem}>{item.nome}</Text>
                          <Text style={estilos.quantidadeItem}>
                            {item.quantidade} {item.unidade}
                          </Text>
                        </View>
                        {idEmEdicao === null && idEmUso === null && (
                          <View style={estilos.botoesItem}>
                            <BotaoPilula texto="Usar" cor={cores.verde} onPress={() => iniciarUso(item)} />
                            <BotaoPilula texto="Editar" cor={cores.painel} onPress={() => iniciarEdicao(item)} />
                            <BotaoPilula
                              texto="Eliminar"
                              cor={cores.rosa}
                              onPress={() => confirmarEliminar(item.id, item.nome)}
                            />
                          </View>
                        )}
                      </View>
                    </View>
                  )}
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: cores.fundo,
  },
  scroll: {
    padding: 16,
    gap: 16,
  },
  aviso: {
    color: cores.rosaEscuro,
    fontSize: 13,
  },
  linhaAcoes: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  blocoRefeicoes: {
    width: '100%',
    gap: 12,
  },
  formularioNovo: {
    backgroundColor: cores.painel,
    borderWidth: 3,
    borderColor: cores.borda,
    padding: 14,
    borderRadius: 16,
    gap: 8,
  },
  tituloForm: {
    fontWeight: 'bold',
    color: cores.texto,
  },
  linhaForm: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  rotuloInline: {
    fontSize: 13,
    color: cores.texto,
  },
  input: {
    borderWidth: 2,
    borderColor: cores.borda,
    borderRadius: 10,
    padding: 8,
    backgroundColor: '#fff',
  },
  vazio: {
    color: cores.texto,
    padding: 12,
  },
  painelLista: {
    backgroundColor: cores.painel,
    borderWidth: 3,
    borderColor: cores.borda,
    borderRadius: 16,
    paddingHorizontal: 12,
  },
  item: {
    borderBottomWidth: 2,
    borderBottomColor: cores.borda,
    paddingVertical: 12,
    gap: 8,
  },
  itemSemBorda: {
    borderBottomWidth: 0,
  },
  linhaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  circuloItem: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: cores.fundo,
    borderWidth: 2,
    borderColor: cores.borda,
    overflow: 'hidden',
  },
  imagemItem: {
    width: '100%',
    height: '100%',
  },
  infoItem: {
    flex: 1,
    gap: 8,
  },
  linhaNomeQuantidade: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  nomeItem: {
    fontWeight: 'bold',
    fontSize: 16,
    color: cores.texto,
    flexShrink: 1,
  },
  quantidadeItem: {
    color: cores.texto,
  },
  botoesItem: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  linhaBotoes: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  usoForm: {
    gap: 8,
  },
});
