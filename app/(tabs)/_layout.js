import { Tabs } from 'expo-router';
import { Image, View, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { cores } from '../../lib/tema';

function IconeSeparador({ fonte, ativo }) {
  return (
    <View style={[estilos.celulaIcone, ativo && estilos.celulaIconeAtiva]}>
      <Image source={fonte} style={estilos.imagemIcone} resizeMode="contain" />
    </View>
  );
}

export default function LayoutTabs() {
  const insets = useSafeAreaInsets();

  return (
    <View style={estilos.raiz}>
      <SafeAreaView edges={['top']} style={estilos.fundoCabecalho}>
        <Image
          source={require('../../assets/HomeInventory Logo - Cópia.png')}
          style={estilos.logo}
          resizeMode="contain"
        />
      </SafeAreaView>

      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarStyle: [estilos.barraTabs, { height: 76 + insets.bottom, paddingBottom: insets.bottom + 10 }],
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Scan',
            tabBarIcon: ({ focused }) => (
              <IconeSeparador fonte={require('../../assets/ScannerIcon.png')} ativo={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="inventario"
          options={{
            title: 'Inventário',
            tabBarIcon: ({ focused }) => (
              <IconeSeparador fonte={require('../../assets/InventoryIcon.png')} ativo={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="lista-compras"
          options={{
            title: 'A Comprar',
            tabBarIcon: ({ focused }) => (
              <IconeSeparador fonte={require('../../assets/ToBuyIcon.png')} ativo={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="historico"
          options={{
            title: 'Histórico',
            tabBarIcon: ({ focused }) => (
              <IconeSeparador fonte={require('../../assets/HistoryIcon.png')} ativo={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="estatisticas"
          options={{
            title: 'Estatísticas',
            tabBarIcon: ({ focused }) => (
              <IconeSeparador fonte={require('../../assets/StatisticsIcon.png')} ativo={focused} />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: {
    flex: 1,
    backgroundColor: cores.fundo,
  },
  fundoCabecalho: {
    backgroundColor: cores.fundo,
    alignItems: 'center',
  },
  logo: {
    height: 100,
    aspectRatio: 800 / 290,
  },
  barraTabs: {
    backgroundColor: cores.footerFundo,
    borderTopWidth: 0,
    paddingTop: 17,
  },
  celulaIcone: {
    width: 60,
    height: 60,
    borderRadius: 14,
    backgroundColor: cores.painel,
    borderWidth: 2,
    borderColor: cores.fundo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  celulaIconeAtiva: {
    backgroundColor: cores.fundo,
  },
  imagemIcone: {
    width: 56,
    height: 56,
  },
});
