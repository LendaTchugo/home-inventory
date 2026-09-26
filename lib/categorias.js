export function normalizar(texto) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

export function sugerirCategoria(nomeItem, inventario) {
  const nomeNormalizado = normalizar(nomeItem);
  const encontrado = inventario.find((item) => nomeNormalizado.includes(normalizar(item.nome)));
  return encontrado ? encontrado.id : null;
}

export function filtrarOrdenarInventario(inventario, filtro, ordenacao, unidades) {
  let filtrado = filtro
    ? inventario.filter((item) => normalizar(item.nome).includes(normalizar(filtro)))
    : inventario;

  if (unidades && unidades.length > 0) {
    filtrado = filtrado.filter((item) => unidades.includes(item.unidade));
  }

  const ordenado = [...filtrado];
  switch (ordenacao) {
    case 'nome-desc':
      ordenado.sort((a, b) => b.nome.localeCompare(a.nome));
      break;
    case 'quantidade-asc':
      ordenado.sort((a, b) => a.quantidade - b.quantidade);
      break;
    case 'quantidade-desc':
      ordenado.sort((a, b) => b.quantidade - a.quantidade);
      break;
    case 'nome-asc':
    default:
      ordenado.sort((a, b) => a.nome.localeCompare(b.nome));
      break;
  }
  return ordenado;
}
