// Inicialização da tela do mestre. Este é o ÚLTIMO arquivo carregado:
// quando ele roda, todas as funções dos outros arquivos já existem.

// 1) Junta o que estava salvo (HP atual, fichas, personagens criados,
//    inimigos) com os personagens padrão de dados.js.
const personagensSalvos =
    JSON.parse(localStorage.getItem(chave("personagens"))) || {};

for (const id in personagensSalvos) {
    personagens[id] = {
        ...personagens[id],
        ...personagensSalvos[id]
    };
}

// 2) Garante que os personagens padrão (Nero, Shin...) também estejam
//    salvos, para a visão dos jogadores conseguir desenhá-los.
for (const id in personagens) {
    if (!personagensSalvos[id]) {
        salvarPersonagemNoStorage(id);
    }
}

// 3) Recria os botões dos personagens salvos na barra lateral.
//    Os 4 fixos já têm botão no HTML, então pulamos eles.
for (const id in personagens) {
    if (!idsFixos.includes(id) && personagens[id].nome) {
        criarBotaoPersonagem(id);
    }
}

// 4) Coloca de volta os tokens que estavam no mapa.
//    Lemos o estado INTEIRO antes do laço, porque cada criarPersonagem()
//    salva de novo e sobrescreveria o que ainda não foi restaurado.
const estadoSalvo =
    JSON.parse(localStorage.getItem(chave("estadoBatalha"))) || { tokens: {}, turnoAtual: 0 };

for (const id in estadoSalvo.tokens) {
    const personagem = personagens[id];

    // Se o personagem foi excluído nesse meio-tempo, pula
    if (!personagem) {
        continue;
    }

    const posicao = estadoSalvo.tokens[id];

    criarPersonagem(
        id,
        personagem.nome.charAt(0).toUpperCase(),
        posicao.x,
        posicao.y,
        personagem.tipo || "player",
        tamanhoEmPixels(personagem.tamanho)
    );
}

// 5) O turno só é restaurado no fim, com todos os tokens já no mapa
turnoAtual = estadoSalvo.turnoAtual || 0;
atualizarIniciativa();
