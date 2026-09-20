import { useCallback, useState } from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { lerCompras, lerInventario } from '../../lib/dados';
import { cores } from '../../lib/tema';

const ORDEM_UNIDADES = ['un', 'L', 'g'];

function ordenarUnidades(unidades) {
  return [...unidades].sort((a, b) => {
    const indiceA = ORDEM_UNIDADES.indexOf(a);
    const indiceB = ORDEM_UNIDADES.indexOf(b);
    if (indiceA === -1 && indiceB === -1) return a.localeCompare(b);
    if (indiceA === -1) return 1;
    if (indiceB === -1) return -1;
    return indiceA - indiceB;
  });
}

function calcularEstatisticas(compras, inventario) {
  const agora = new Date();
  const mesAtual = agora.getMonth();
  const anoAtual = agora.getFullYear();

  let totalGeral = 0;
  let totalMes = 0;
  const quantidadesPorCategoria = {};

  for (const compra of compras) {
    const dataCompra = new Date(compra.data);
    const noMesAtual =
      dataCompra.getMonth() === mesAtual && dataCompra.getFullYear() === anoAtual;

    for (const item of compra.itens) {
      if (item.preco != null && item.quantidade != null) {
        const subtotal = item.quantidade * item.preco;
        totalGeral += subtotal;
        if (noMesAtual) {
          totalMes += subtotal;
        }
      }

      if (item.categoriaId) {
        const quantidadeReal = item.quantidadeStock ?? item.quantidade ?? 0;
        quantidadesPorCategoria[item.categoriaId] =
          (quantidadesPorCategoria[item.categoriaId] || 0) + quantidadeReal;
      }
    }
  }

  const rankingsPorUnidade = {};

  for (const [categoriaId, quantidade] of Object.entries(quantidadesPorCategoria)) {
    const itemInventario = inventario.find((inv) => inv.id === categoriaId);
    const unidade = itemInventario ? itemInventario.unidade : '?';
    const nome = itemInventario ? itemInventario.nome : 'Categoria removida';

    if (!rankingsPorUnidade[unidade]) {
      rankingsPorUnidade[unidade] = [];
    }
    rankingsPorUnidade[unidade].push({ nome, quantidade });
  }

  for (const unidade of Object.keys(rankingsPorUnidade)) {
    rankingsPorUnidade[unidade].sort((a, b) => b.quantidade - a.quantidade);
    rankingsPorUnidade[unidade] = rankingsPorUnidade[unidade].slice(0, 10);
  }

  return { totalGeral, totalMes, rankingsPorUnidade };
}

export default function Estatisticas() {
  const [dados, setDados] = useState({ totalGeral: 0, totalMes: 0, rankingsPorUnidade: {} });
  const [erro, setErro] = useState(null);

  useFocusEffect(
    useCallback(() => {
      let ativo = true;
      (async () => {
        try {
          const [compras, inventario] = await Promise.all([lerCompras(), lerInventario()]);
          if (ativo) {
            setDados(calcularEstatisticas(compras, inventario));
            setErro(null);
          }
        } catch (e) {
          if (ativo) setErro('Não foi possível atualizar as estatísticas.');
        }
      })();
      return () => {
        ativo = false;
      };
    }, [])
  );

  const unidades = ordenarUnidades(Object.keys(dados.rankingsPorUnidade)).filter((unidade) =>
    ORDEM_UNIDADES.includes(unidade)
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      {erro && <Text style={styles.aviso}>{erro}</Text>}

      <View style={styles.cartao}>
        <Text style={styles.rotulo}>Total gasto (tudo)</Text>
        <Text style={styles.valor}>{dados.totalGeral.toFixed(2)}€</Text>
      </View>

      <View style={styles.cartao}>
        <Text style={styles.rotulo}>Total gasto este mês</Text>
        <Text style={styles.valor}>{dados.totalMes.toFixed(2)}€</Text>
      </View>

      {unidades.length === 0 ? (
        <Text style={styles.vazio}>Ainda não há dados suficientes.</Text>
      ) : (
        unidades.map((unidade) => (
          <View key={unidade} style={styles.secaoRanking}>
            <Text style={styles.tituloSecao}>Mais comprados ({unidade})</Text>
            {dados.rankingsPorUnidade[unidade].map((item, i) => (
              <View
                key={i}
                style={[
                  styles.linhaRanking,
                  i === dados.rankingsPorUnidade[unidade].length - 1 && styles.linhaSemBorda,
                ]}
              >
                <Text style={styles.posicaoRanking}>{i + 1}.</Text>
                <Text style={styles.nomeRanking}>{item.nome}</Text>
                <Text style={styles.quantidadeRanking}>
                  {item.quantidade} {unidade}
                </Text>
              </View>
            ))}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
  cartao: {
    backgroundColor: cores.painel,
    borderWidth: 3,
    borderColor: cores.borda,
    borderRadius: 16,
    padding: 16,
  },
  rotulo: {
    fontSize: 13,
    color: cores.texto,
  },
  valor: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 4,
    color: cores.texto,
  },
  secaoRanking: {
    backgroundColor: cores.painel,
    borderWidth: 3,
    borderColor: cores.borda,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingTop: 12,
    gap: 4,
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
  linhaRanking: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: cores.borda,
  },
  linhaSemBorda: {
    borderBottomWidth: 0,
  },
  posicaoRanking: {
    fontWeight: 'bold',
    color: cores.texto,
    width: 20,
  },
  nomeRanking: {
    flex: 1,
    color: cores.texto,
  },
  quantidadeRanking: {
    color: cores.texto,
  },
});
