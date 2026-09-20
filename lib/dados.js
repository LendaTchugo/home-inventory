const BASE_URL = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/rest/v1`;
const CHAVE = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

async function pedido(caminho, opcoes = {}) {
  const resposta = await fetch(`${BASE_URL}${caminho}`, {
    ...opcoes,
    headers: {
      apikey: CHAVE,
      'Content-Type': 'application/json',
      ...opcoes.headers,
    },
  });

  const texto = await resposta.text();
  const corpo = texto ? JSON.parse(texto) : null;

  if (!resposta.ok) {
    throw new Error(corpo?.message || `Erro ${resposta.status}`);
  }

  return corpo;
}

async function pedidoAlvo(caminho, opcoes, mensagemSeVazio) {
  const linhas = await pedido(caminho, {
    ...opcoes,
    headers: { Prefer: 'return=representation', ...opcoes.headers },
  });
  if (linhas.length === 0) {
    throw new Error(mensagemSeVazio);
  }
  return linhas[0];
}

// --- Inventário ---

export async function lerInventario() {
  return pedido('/inventario?select=*&order=id.asc');
}

export async function criarItemInventario(item) {
  return pedidoAlvo('/inventario', { method: 'POST', body: JSON.stringify(item) }, 'Não foi possível criar o item.');
}

export async function atualizarItemInventario(id, campos) {
  return pedidoAlvo(
    `/inventario?id=eq.${encodeURIComponent(id)}`,
    { method: 'PATCH', body: JSON.stringify(campos) },
    'Este item já não existe — pode ter sido alterado no outro telemóvel.'
  );
}

export async function eliminarItemInventario(id) {
  return pedidoAlvo(
    `/inventario?id=eq.${encodeURIComponent(id)}`,
    { method: 'DELETE' },
    'Este item já tinha sido eliminado no outro telemóvel.'
  );
}

export async function ajustarQuantidadeInventario(id, delta) {
  const resultado = await pedido('/rpc/ajustar_quantidade', {
    method: 'POST',
    body: JSON.stringify({ item_id: id, delta }),
  });
  if (resultado === null) {
    throw new Error('Este item já não existe — pode ter sido eliminado no outro telemóvel.');
  }
  return resultado;
}

// --- Compras ---

export async function lerCompras() {
  return pedido('/compras?select=*&order=data.desc');
}

export async function guardarCompra(itens, dataISO = new Date().toISOString()) {
  return pedido('/compras', { method: 'POST', body: JSON.stringify({ data: dataISO, itens }) });
}

export async function atualizarCompra(id, itens) {
  return pedidoAlvo(
    `/compras?id=eq.${encodeURIComponent(id)}`,
    { method: 'PATCH', body: JSON.stringify({ itens }) },
    'Esta compra já não existe — pode ter sido eliminada no outro telemóvel.'
  );
}

export async function eliminarCompra(id) {
  return pedidoAlvo(
    `/compras?id=eq.${encodeURIComponent(id)}`,
    { method: 'DELETE' },
    'Esta compra já tinha sido eliminada no outro telemóvel.'
  );
}

// --- Refeições ---

export async function lerRefeicoes() {
  return pedido('/refeicoes?select=*&order=id.asc');
}

export async function criarRefeicao(refeicao) {
  return pedidoAlvo('/refeicoes', { method: 'POST', body: JSON.stringify(refeicao) }, 'Não foi possível criar a refeição.');
}

export async function atualizarRefeicao(id, campos) {
  return pedidoAlvo(
    `/refeicoes?id=eq.${encodeURIComponent(id)}`,
    { method: 'PATCH', body: JSON.stringify(campos) },
    'Esta refeição já não existe — pode ter sido alterada no outro telemóvel.'
  );
}

export async function eliminarRefeicao(id) {
  return pedidoAlvo(
    `/refeicoes?id=eq.${encodeURIComponent(id)}`,
    { method: 'DELETE' },
    'Esta refeição já tinha sido eliminada no outro telemóvel.'
  );
}
