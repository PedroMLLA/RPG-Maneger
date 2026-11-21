// Peso do inventário: usado pela janela do inventário (tela do mestre)
// e pelos cartões de inventário da visão dos jogadores.

// Soma o peso de todos os itens. O peso de cada item é POR UNIDADE,
// então 3 poções de 0,5 kg pesam 1,5 kg.
function calcularPesoTotal(itens) {
    let total = 0;

    for (const item of itens) {
        total += (Number(item.peso) || 0) * (Number(item.quantidade) || 0);
    }

    return total;
}

// Mostra o número no jeito brasileiro (vírgula), com no máximo 2 casas:
// 12.5 vira "12,5" e 3 vira "3".
function formatarPeso(numero) {
    return numero.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
}
