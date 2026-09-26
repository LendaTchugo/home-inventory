import { useState } from 'react';
import { View, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { cores } from '../lib/tema';
import CampoTexto from './CampoTexto';
import BotaoPilula from './BotaoPilula';

const OPCOES_ORDENACAO = [
  { valor: 'nome-asc', rotulo: 'Nome A-Z' },
  { valor: 'nome-desc', rotulo: 'Nome Z-A' },
  { valor: 'quantidade-desc', rotulo: 'Quantidade ↓' },
  { valor: 'quantidade-asc', rotulo: 'Quantidade ↑' },
];

const OPCOES_UNIDADE = [
  { valor: 'L', rotulo: 'Líquidos (L)' },
  { valor: 'g', rotulo: 'Gramas (g)' },
  { valor: 'un', rotulo: 'Unidades (un)' },
];

export default function BarraFiltroOrdenacao({
  filtro,
  aoMudarFiltro,
  ordenacao,
  aoMudarOrdenacao,
  unidadesSelecionadas = [],
  aoMudarUnidadesSelecionadas,
}) {
  const [mostrarFiltro, setMostrarFiltro] = useState(false);
  const [mostrarOrdenacao, setMostrarOrdenacao] = useState(false);

  function alternarUnidade(unidade) {
    if (!aoMudarUnidadesSelecionadas) return;
    aoMudarUnidadesSelecionadas(
      unidadesSelecionadas.includes(unidade)
        ? unidadesSelecionadas.filter((u) => u !== unidade)
        : [...unidadesSelecionadas, unidade]
    );
  }

  return (
    <View style={estilos.bloco}>
      <View style={estilos.linhaIcones}>
        <TouchableOpacity
          style={[estilos.botaoIcone, mostrarFiltro && estilos.botaoIconeAtivo]}
          onPress={() => {
            setMostrarFiltro((atual) => !atual);
            setMostrarOrdenacao(false);
          }}
        >
          <Image source={require('../assets/filter.png')} style={estilos.icone} resizeMode="contain" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[estilos.botaoIcone, mostrarOrdenacao && estilos.botaoIconeAtivo]}
          onPress={() => {
            setMostrarOrdenacao((atual) => !atual);
            setMostrarFiltro(false);
          }}
        >
          <Image source={require('../assets/sort.png')} style={estilos.icone} resizeMode="contain" />
        </TouchableOpacity>
      </View>

      {mostrarFiltro && (
        <>
          <CampoTexto
            style={estilos.input}
            placeholder="Procurar por nome..."
            value={filtro}
            onChangeText={aoMudarFiltro}
          />
          {aoMudarUnidadesSelecionadas && (
            <View style={estilos.linhaChipsOrdenacao}>
              {OPCOES_UNIDADE.map((opcao) => (
                <BotaoPilula
                  key={opcao.valor}
                  texto={opcao.rotulo}
                  cor={unidadesSelecionadas.includes(opcao.valor) ? cores.verde : cores.painel}
                  onPress={() => alternarUnidade(opcao.valor)}
                />
              ))}
            </View>
          )}
        </>
      )}

      {mostrarOrdenacao && (
        <View style={estilos.linhaChipsOrdenacao}>
          {OPCOES_ORDENACAO.map((opcao) => (
            <BotaoPilula
              key={opcao.valor}
              texto={opcao.rotulo}
              cor={ordenacao === opcao.valor ? cores.verde : cores.painel}
              onPress={() => aoMudarOrdenacao(opcao.valor)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  bloco: {
    width: '100%',
    gap: 8,
  },
  linhaIcones: {
    flexDirection: 'row',
    gap: 10,
  },
  botaoIcone: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: cores.painel,
    borderWidth: 2,
    borderColor: cores.borda,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoIconeAtivo: {
    backgroundColor: cores.fundo,
  },
  icone: {
    width: 22,
    height: 22,
  },
  input: {
    borderWidth: 2,
    borderColor: cores.borda,
    borderRadius: 10,
    padding: 8,
    backgroundColor: '#fff',
  },
  linhaChipsOrdenacao: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
});
