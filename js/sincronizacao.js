// Sincronização com as outras janelas (Painel do Mestre).
// O Armazenamento avisa quando OUTRA janela muda os dados.

Armazenamento.quandoMudar("personagens", function(personagensNovos) {

    // Sem dados (algo deu errado no caminho): não mexe em nada. Sem isso,
    // a parte de "excluídos" lá embaixo apagaria todo mundo da tela.
    if (!personagensNovos) {
        return;
    }

    const personagensAtualizados = personagensNovos;

    for (const id in personagensAtualizados) {

        // Vida antes da atualização, para saber se o Mestre curou
        const vidaAntes = personagens[id] ? personagens[id].hp : null;

        if (personagens[id]) {

            // Atualiza o MESMO objeto (em vez de criar outro),
            // assim o personagemSelecionado continua apontando para ele.
            // Antes, tira os campos que a outra tela apagou (ex.: deixou
            // de ser fixo, ficou sem sanidade): Object.assign só copia o
            // que existe, então eles ficariam aqui para sempre.
            for (const campo in personagens[id]) {
                if (!(campo in personagensAtualizados[id])) {
                    delete personagens[id][campo];
                }
            }

            Object.assign(personagens[id], personagensAtualizados[id]);

            // Curado pelo Painel do Mestre: faíscas no token do mapa também
            const curou = personagens[id].hp - vidaAntes;

            if (curou > 0 && personagensCriados[id]) {
                efeitoCura(personagensCriados[id], curou);
            }

        } else {

            // Personagem novo, criado em outra tela (o botão dele aparece
            // quando a lista é redesenhada, lá embaixo)
            personagens[id] = personagensAtualizados[id];
        }

        // Se está no mapa, atualiza o visual: nome/imagem (✎), inimigo
        // com vida zerada fica "derrotado" e os ícones de condição.
        if (personagensCriados[id]) {
            trocarAparenciaToken(personagensCriados[id], personagens[id]);
        }
    }

    // Personagem ou inimigo excluído em outra tela (o × da barra lateral
    // ou o Painel do Mestre): some da barra lateral e do mapa.
    // Os fixos da campanha nunca são excluídos.
    for (const id in personagens) {

        const foiExcluido = !personagensAtualizados[id];

        if (!foiExcluido || ehFixo(id)) {
            continue;
        }

        if (personagensCriados[id]) {
            personagensCriados[id].remove();
            delete personagensCriados[id];
        }

        delete personagens[id];
    }

    // Barra lateral e iniciativa com os nomes, ✎ e × de agora.
    // A trava (iniciativa.js) faz a iniciativa só se redesenhar, sem
    // salvar a batalha de novo: quem mudou foi a outra tela.
    desenharListaPersonagens();

    aplicandoBatalhaDeFora = true;

    try {
        atualizarIniciativa();
    } finally {
        aplicandoBatalhaDeFora = false;
    }
});


// O Mestre manda só { id, momento }; os dados vêm de "personagens"
Armazenamento.quandoMudar("inimigoParaMapa", function(pedido) {

    if (!pedido) {
        return;
    }

    if (!personagens[pedido.id]) {
        const salvos =
            Armazenamento.ler("personagens", {});

        personagens[pedido.id] = salvos[pedido.id];
    }

    const inimigo = personagens[pedido.id];

    if (!inimigo) {
        return;
    }

    criarPersonagem(
        pedido.id,
        inimigo.nome.charAt(0).toUpperCase(),
        600,
        300,
        "inimigo",
        tamanhoEmPixels(inimigo.tamanho)
    );
});


// ----- Batalha mudou em OUTRA tela do mestre -----
// Ex.: o mestre abriu o mapa no PC e no celular. O que um faz (mover,
// pôr ou tirar token, passar o turno) aparece no outro.
Armazenamento.quandoMudar("batalha", function(estado) {
    const tokens = (estado && estado.tokens) || {};

    // Enquanto aplicamos, salvarEstadoBatalha() não salva (veja iniciativa.js)
    aplicandoBatalhaDeFora = true;

    try {
        // Tokens que saíram do mapa na outra tela
        for (const id in personagensCriados) {
            if (!tokens[id]) {
                personagensCriados[id].remove();
                delete personagensCriados[id];
            }
        }

        for (const id in tokens) {
            const posicao = tokens[id];

            // Já está aqui: só acerta a posição (menos se estamos arrastando ele)
            if (personagensCriados[id]) {
                moverTokenDeFora(id, posicao.x, posicao.y);
                continue;
            }

            // Personagem que esta tela ainda não conhece (ex.: inimigo novo):
            // pega do que está salvo
            if (!personagens[id]) {
                personagens[id] = Armazenamento.ler("personagens", {})[id];
            }

            const personagem = personagens[id];

            if (!personagem) {
                continue;
            }

            criarPersonagem(
                id,
                personagem.nome.charAt(0).toUpperCase(),
                posicao.x,
                posicao.y,
                personagem.tipo || "player",
                tamanhoEmPixels(personagem.tamanho)
            );
        }

        turnoAtual = (estado && estado.turnoAtual) || 0;
        atualizarIniciativa();

    } finally {
        // "finally" roda mesmo se der erro no meio: nunca fica travado em true
        aplicandoBatalhaDeFora = false;
    }
});

function moverTokenDeFora(id, x, y) {
    const boneco = personagensCriados[id];

    if (boneco && !boneco.dataset.arrastando) {
        boneco.style.left = `${x}px`;
        boneco.style.top = `${y}px`;
    }
}

// A outra tela está arrastando um token agora (mensagem ao vivo)
Armazenamento.quandoChegarAoVivo("token", function(dados) {
    moverTokenDeFora(dados.id, dados.x, dados.y);
});


// ----- Mapa e galeria mudaram em OUTRA tela -----
Armazenamento.quandoMudar("mapa", function(endereco) {
    imagemMapa.src = endereco || mapaPadraoDaCampanha();
});

Armazenamento.quandoMudar("imagens", function(lista) {
    imagensMestre = lista || [];
    desenharGaleria();
    desenharImagensNoMapa();
});
