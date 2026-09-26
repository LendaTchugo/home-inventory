import { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Image,
  Alert,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { guardarCompra, lerInventario, criarItemInventario, ajustarQuantidadeInventario } from '../../lib/dados';
import { sugerirCategoria, filtrarOrdenarInventario } from '../../lib/categorias';
import { cores } from '../../lib/tema';
import CampoTexto from '../../components/CampoTexto';
import SeletorUnidade from '../../components/SeletorUnidade';
import BotaoPilula from '../../components/BotaoPilula';
import BotaoAcaoCircular from '../../components/BotaoAcaoCircular';
import BarraFiltroOrdenacao from '../../components/BarraFiltroOrdenacao';

const PROMPT = `Analisa esta fatura de supermercado e extrai todos os artigos comprados.
As faturas de supermercado são impressas em papel térmico e podem estar desbotadas, amarrotadas ou com pouco contraste — faz o melhor esforço para ler texto pouco nítido, usando o contexto (preços e nomes de artigos típicos de supermercado) para desambiguar quando necessário.
Devolve APENAS um array JSON válido, sem texto antes ou depois, neste formato exato:
[{"item": "nome do artigo", "quantidade": numero, "preco": numero}]
Se mesmo assim não conseguires ler algum valor com confiança, usa null nesse campo em vez de adivinhar.`;

const SEM_CATEGORIA = 'sem-categoria';
const NOVA_CATEGORIA = 'nova-categoria';

function extrairJSON(texto) {
  const limpo = texto.replace(/```json\n?/g, '').replace(/```/g, '').trim();
  return JSON.parse(limpo);
}

function ItemParaConfirmar({ item, inventario, onAtualizar }) {
  const [filtro, setFiltro] = useState('');
  const [ordenacao, setOrdenacao] = useState('nome-asc');
  const [unidadesFiltro, setUnidadesFiltro] = useState([]);
  const modo = item.categoriaId ?? (item.novaCategoria ? NOVA_CATEGORIA : SEM_CATEGORIA);
  const inventarioExibido = filtrarOrdenarInventario(inventario, filtro, ordenacao, unidadesFiltro);

  function alterarMultiplicador(texto) {
    const multiplicador = Number(texto) || 1;
    onAtualizar({
      multiplicador: texto,
      quantidadeStock: String((item.quantidade || 0) * multiplicador),
    });
  }

  return (
    <View style={styles.itemConfirmar}>
      <Text style={styles.nomeItemConfirmar}>
        {item.quantidade}x {item.item} — {item.preco != null ? `${item.preco}€` : '?'}
      </Text>

      {inventario.length > 0 && (
        <BarraFiltroOrdenacao
          filtro={filtro}
          aoMudarFiltro={setFiltro}
          ordenacao={ordenacao}
          aoMudarOrdenacao={setOrdenacao}
          unidadesSelecionadas={unidadesFiltro}
          aoMudarUnidadesSelecionadas={setUnidadesFiltro}
        />
      )}

      <View style={styles.linhaChips}>
        {inventarioExibido.map((invItem) => (
          <TouchableOpacity
            key={invItem.id}
            style={[styles.chip, modo === invItem.id && styles.chipSelecionado]}
            onPress={() =>
              onAtualizar({
                categoriaId: invItem.id,
                novaCategoria: false,
                multiplicador: '1',
                quantidadeStock: String(item.quantidade || 0),
              })
            }
          >
            <Text style={modo === invItem.id ? styles.chipTextoSelecionado : styles.chipTexto}>
              {invItem.nome}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[styles.chip, modo === NOVA_CATEGORIA && styles.chipSelecionado]}
          onPress={() =>
            onAtualizar({
              categoriaId: null,
              novaCategoria: true,
              multiplicador: '1',
              quantidadeStock: String(item.quantidade || 0),
            })
          }
        >
          <Text style={modo === NOVA_CATEGORIA ? styles.chipTextoSelecionado : styles.chipTexto}>
            + Nova categoria
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.chip, modo === SEM_CATEGORIA && styles.chipSelecionado]}
          onPress={() => onAtualizar({ categoriaId: null, novaCategoria: false })}
        >
          <Text style={modo === SEM_CATEGORIA ? styles.chipTextoSelecionado : styles.chipTexto}>
            Sem categoria
          </Text>
        </TouchableOpacity>
      </View>

      {item.novaCategoria && (
        <>
          <CampoTexto
            style={styles.input}
            placeholder="Nome da categoria"
            value={item.novaCategoriaNome}
            onChangeText={(texto) => onAtualizar({ novaCategoriaNome: texto })}
          />
          <View style={styles.linhaForm}>
            <Text style={styles.rotuloQuantidade}>Unidade:</Text>
            <SeletorUnidade
              valor={item.novaCategoriaUnidade}
              onSelecionar={(unidade) => onAtualizar({ novaCategoriaUnidade: unidade })}
            />
          </View>
        </>
      )}

      {modo !== SEM_CATEGORIA && (
        <>
          <View style={styles.linhaForm}>
            <Text style={styles.rotuloQuantidade}>Cada unidade da fatura equivale a:</Text>
            <CampoTexto
              style={[styles.input, styles.inputPequeno]}
              placeholder="1"
              keyboardType="numeric"
              value={item.multiplicador}
              onChangeText={alterarMultiplicador}
            />
          </View>
          <View style={styles.linhaForm}>
            <Text style={styles.rotuloQuantidade}>Somar ao stock:</Text>
            <CampoTexto
              style={[styles.input, styles.inputPequeno]}
              keyboardType="numeric"
              value={item.quantidadeStock}
              onChangeText={(texto) => onAtualizar({ quantidadeStock: texto })}
            />
          </View>
        </>
      )}
    </View>
  );
}

export default function Scan() {
  const [fotoUri, setFotoUri] = useState(null);
  const [fotoBase64, setFotoBase64] = useState(null);
  const [itensParaConfirmar, setItensParaConfirmar] = useState(null);
  const [inventario, setInventario] = useState([]);
  const [mensagemToast, setMensagemToast] = useState(null);
  const [erro, setErro] = useState(null);
  const [aCarregar, setACarregar] = useState(false);
  const [aEnviar, setAEnviar] = useState(false);
  const [mostrarManual, setMostrarManual] = useState(false);
  const [nomeManual, setNomeManual] = useState('');
  const [quantidadeManual, setQuantidadeManual] = useState('');
  const [precoManual, setPrecoManual] = useState('');

  useEffect(() => {
    if (!mensagemToast) {
      return;
    }
    const temporizador = setTimeout(() => setMensagemToast(null), 2000);
    return () => clearTimeout(temporizador);
  }, [mensagemToast]);

  function limparFoto() {
    setFotoUri(null);
    setFotoBase64(null);
    setItensParaConfirmar(null);
    setErro(null);
    setMostrarManual(false);
  }

  async function prepararEntradaManual() {
    const nome = nomeManual.trim();
    if (!nome) {
      Alert.alert('Falta o nome', 'Dá um nome ao artigo antes de continuar.');
      return;
    }

    const quantidade = Number(quantidadeManual) || 1;
    const preco = precoManual.trim() === '' ? null : Number(precoManual);

    let inventarioAtual;
    try {
      inventarioAtual = await lerInventario();
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível carregar o inventário.');
      return;
    }
    setInventario(inventarioAtual);
    const categoriaSugerida = sugerirCategoria(nome, inventarioAtual);

    setItensParaConfirmar([
      {
        item: nome,
        quantidade,
        preco,
        categoriaId: categoriaSugerida,
        novaCategoria: false,
        novaCategoriaNome: '',
        novaCategoriaUnidade: 'un',
        multiplicador: '1',
        quantidadeStock: String(quantidade),
      },
    ]);
    setMostrarManual(false);
    setNomeManual('');
    setQuantidadeManual('');
    setPrecoManual('');
    setErro(null);
  }

  async function tirarFoto() {
    const permissao = await ImagePicker.requestCameraPermissionsAsync();

    if (!permissao.granted) {
      Alert.alert('Permissão necessária', 'Preciso de acesso à câmara para tirar a foto da fatura.');
      return;
    }

    const captura = await ImagePicker.launchCameraAsync({
      quality: 0.9,
      base64: true,
    });

    if (!captura.canceled) {
      setFotoUri(captura.assets[0].uri);
      setFotoBase64(captura.assets[0].base64);
      setItensParaConfirmar(null);
      setErro(null);
    }
  }

  async function interpretarFatura() {
    setACarregar(true);
    setErro(null);

    if (!process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY) {
      setErro('Chave da API não encontrada. Confirma o ficheiro .env e faz reload completo da app (abanar > Reload).');
      setACarregar(false);
      return;
    }

    try {
      const resposta = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-5',
          max_tokens: 1024,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: 'image/jpeg',
                    data: fotoBase64,
                  },
                },
                { type: 'text', text: PROMPT },
              ],
            },
          ],
        }),
      });

      const dados = await resposta.json();

      if (dados.error) {
        setErro(`Erro da API: ${dados.error.message}`);
        return;
      }

      const blocoTexto = dados.content.find((bloco) => bloco.type === 'text');
      if (!blocoTexto) {
        setErro('A resposta da API não incluiu texto interpretável.');
        return;
      }

      const itensExtraidos = extrairJSON(blocoTexto.text);
      const inventarioAtual = await lerInventario();
      setInventario(inventarioAtual);
      setItensParaConfirmar(
        itensExtraidos.map((item) => {
          const categoriaSugerida = sugerirCategoria(item.item, inventarioAtual);
          return {
            ...item,
            categoriaId: categoriaSugerida,
            novaCategoria: false,
            novaCategoriaNome: '',
            novaCategoriaUnidade: 'un',
            multiplicador: '1',
            quantidadeStock: String(item.quantidade ?? ''),
          };
        })
      );
    } catch (e) {
      setErro(`Erro: ${e.message}`);
    } finally {
      setACarregar(false);
    }
  }

  function atualizarItemConfirmar(indice, alteracoes) {
    setItensParaConfirmar((atual) =>
      atual.map((item, i) => (i === indice ? { ...item, ...alteracoes } : item))
    );
  }

  async function confirmarCompra() {
    setAEnviar(true);
    try {
      const itensParaCompra = [];

      for (const item of itensParaConfirmar) {
        if (item.novaCategoria) {
          const nome = item.novaCategoriaNome.trim();
          if (!nome) {
            itensParaCompra.push({ item: item.item, quantidade: item.quantidade, preco: item.preco, categoriaId: null });
            continue;
          }
          const novaCategoriaId = Date.now().toString() + Math.random().toString(36).slice(2, 6);
          const quantidadeStock = Number(item.quantidadeStock) || 0;
          await criarItemInventario({ id: novaCategoriaId, nome, unidade: item.novaCategoriaUnidade, quantidade: quantidadeStock });
          itensParaCompra.push({
            item: item.item,
            quantidade: item.quantidade,
            preco: item.preco,
            categoriaId: novaCategoriaId,
            quantidadeStock,
          });
        } else if (item.categoriaId) {
          const quantidadeStock = Number(item.quantidadeStock) || 0;
          await ajustarQuantidadeInventario(item.categoriaId, quantidadeStock);
          itensParaCompra.push({
            item: item.item,
            quantidade: item.quantidade,
            preco: item.preco,
            categoriaId: item.categoriaId,
            quantidadeStock,
          });
        } else {
          itensParaCompra.push({ item: item.item, quantidade: item.quantidade, preco: item.preco, categoriaId: null });
        }
      }

      await guardarCompra(itensParaCompra);
      setMensagemToast(`Guardado! ${itensParaCompra.length} artigo(s)`);
      setItensParaConfirmar(null);
      setFotoUri(null);
      setFotoBase64(null);
      setMostrarManual(false);
    } catch (e) {
      Alert.alert('Erro ao guardar', e.message);
    } finally {
      setAEnviar(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {mensagemToast && (
        <View style={styles.toast}>
          <Text style={styles.toastTexto}>{mensagemToast}</Text>
        </View>
      )}

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {!fotoUri && !mostrarManual && !itensParaConfirmar && (
          <View style={styles.linhaAcoes}>
            <BotaoAcaoCircular icone={require('../../assets/camera.png')} rotulo="Scan faturas" onPress={tirarFoto} />
            <BotaoAcaoCircular
              icone={require('../../assets/form.png')}
              rotulo="Inserir manualmente"
              onPress={() => setMostrarManual(true)}
            />
          </View>
        )}

        {!fotoUri && !mostrarManual && !itensParaConfirmar && (
          <View style={styles.blocoImagemScan}>
            <Image source={require('../../assets/ScanImage.png')} style={styles.imagemScan} resizeMode="contain" />
          </View>
        )}

        {mostrarManual && (
          <View style={styles.formularioManual}>
            <Text style={styles.tituloConfirmacao}>Adicionar produto manualmente</Text>
            <CampoTexto
              style={styles.input}
              placeholder="Nome do artigo"
              value={nomeManual}
              onChangeText={setNomeManual}
            />
            <View style={styles.linhaForm}>
              <CampoTexto
                style={[styles.input, styles.inputPequeno]}
                placeholder="Quantidade"
                keyboardType="numeric"
                value={quantidadeManual}
                onChangeText={setQuantidadeManual}
              />
              <CampoTexto
                style={[styles.input, styles.inputPequeno]}
                placeholder="Preço (opcional)"
                keyboardType="numeric"
                value={precoManual}
                onChangeText={setPrecoManual}
              />
            </View>
            <View style={styles.linhaBotoes}>
              <BotaoPilula texto="Continuar" cor={cores.verde} onPress={prepararEntradaManual} />
              <BotaoPilula texto="Cancelar" cor={cores.painel} onPress={() => setMostrarManual(false)} />
            </View>
          </View>
        )}

        {fotoUri && <Image source={{ uri: fotoUri }} style={styles.preview} />}

        {fotoUri && !itensParaConfirmar && (
          <View style={styles.linhaBotoes}>
            <BotaoPilula texto="Interpretar fatura" cor={cores.verde} onPress={interpretarFatura} disabled={aCarregar} />
            <BotaoPilula texto="Limpar" cor={cores.painel} onPress={limparFoto} disabled={aCarregar} />
          </View>
        )}

        {aCarregar && <ActivityIndicator size="large" color={cores.borda} style={styles.loading} />}

        {erro && <Text style={styles.erro}>{erro}</Text>}

        {itensParaConfirmar && (
          <View style={styles.confirmarBloco}>
            <Text style={styles.tituloConfirmacao}>Associar artigos ao inventário</Text>
            {itensParaConfirmar.map((item, indice) => (
              <ItemParaConfirmar
                key={indice}
                item={item}
                inventario={inventario}
                onAtualizar={(alteracoes) => atualizarItemConfirmar(indice, alteracoes)}
              />
            ))}
            {aEnviar && <ActivityIndicator size="large" color={cores.borda} style={styles.loading} />}
            <View style={styles.linhaBotoes}>
              <BotaoPilula texto="Confirmar compra" cor={cores.verde} onPress={confirmarCompra} disabled={aEnviar} />
              <BotaoPilula texto="Limpar" cor={cores.painel} onPress={limparFoto} disabled={aEnviar} />
            </View>
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
  scrollView: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    gap: 16,
    padding: 16,
  },
  blocoImagemScan: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  linhaAcoes: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  preview: {
    width: 300,
    height: 400,
    borderRadius: 16,
  },
  imagemScan: {
    width: 320,
    height: 320,
  },
  loading: {
    marginTop: 10,
  },
  erro: {
    color: '#fff',
    backgroundColor: cores.rosaEscuro,
    padding: 10,
    borderRadius: 10,
    width: '100%',
  },
  toast: {
    position: 'absolute',
    top: 12,
    left: 20,
    right: 20,
    zIndex: 10,
    elevation: 5,
    backgroundColor: cores.verdeEscuro,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  toastTexto: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  tituloConfirmacao: {
    fontWeight: 'bold',
    marginBottom: 4,
    color: cores.texto,
  },
  linhaBotoes: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  confirmarBloco: {
    width: '100%',
    gap: 14,
  },
  formularioManual: {
    width: '100%',
    backgroundColor: cores.painel,
    borderWidth: 3,
    borderColor: cores.borda,
    padding: 14,
    borderRadius: 16,
    gap: 8,
  },
  itemConfirmar: {
    width: '100%',
    backgroundColor: cores.painel,
    borderWidth: 3,
    borderColor: cores.borda,
    padding: 12,
    borderRadius: 16,
    gap: 8,
  },
  nomeItemConfirmar: {
    fontWeight: 'bold',
    color: cores.texto,
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
  linhaForm: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  input: {
    borderWidth: 2,
    borderColor: cores.borda,
    borderRadius: 10,
    padding: 8,
    backgroundColor: '#fff',
  },
  inputFlex: {
    flex: 2,
  },
  inputPequeno: {
    flex: 1,
  },
  rotuloQuantidade: {
    fontSize: 13,
    color: cores.texto,
  },
});
