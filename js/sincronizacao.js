// Sincronização com as outras janelas (Painel do Mestre).
// O Armazenamento avisa quando OUTRA janela muda os dados.

Armazenamento.quandoMudar("personagens", function(personagensNovos) {

    const personagensAtualizados = personagensNovos || {};

    for (const id in personagensAtualizados) {

        // Vida antes da atualização, para saber se o Mestre curou
        const vidaAntes = personagens[id] ? personagens[id].hp : null;

        if (personagens[id]) {

            // Atualiza o MESMO objeto (em vez de criar outro),
            // assim o personagemSelecionado continua apontando para ele.
            Object.assign(personagens[id], personagensAtualizados[id]);

            // Curado pelo Painel do Mestre: faíscas no token do mapa também
            const curou = personagens[id].hp - vidaAntes;

            if (curou > 0 && personagensCriados[id]) {
                efeitoCura(personagensCriados[id], curou);
            }

        } else {

            // Personagem novo, criado no Mestre: ganha botão na barra lateral.
            personagens[id] = personagensAtualizados[id];
            criarBotaoPersonagem(id);
        }

        // Se está no mapa, atualiza o visual: inimigo com vida zerada
        // fica "derrotado" (antes ele sumia do mapa; agora o mestre
        // decide quando remover) e os ícones de condição se atualizam.
        if (personagensCriados[id]) {
            atualizarEstadoToken(personagensCriados[id], personagens[id]);
        }
    }

    // Inimigo que o Mestre excluiu: some da barra lateral e do mapa.
    for (const id in personagens) {

        const foiExcluido = !personagensAtualizados[id];

        if (!foiExcluido || personagens[id].tipo !== "inimigo") {
            continue;
        }

        const botao = document.querySelector(`[data-id="${id}"]`);

        if (botao) {
            botao.remove();
        }

        if (personagensCriados[id]) {
            personagensCriados[id].remove();
            delete personagensCriados[id];
            atualizarIniciativa();
        }

        delete personagens[id];
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
