function normalizar(texto) {
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
