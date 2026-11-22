// Inicialização da tela do mestre. Este é o ÚLTIMO arquivo carregado:
// quando ele roda, todas as funções dos outros arquivos já existem.

// 1) Junta o que estava salvo (HP atual, fichas, personagens criados,
//    inimigos) com os personagens padrão de dados.js.
const personagensSalvos =
    Armazenamento.ler("personagens", {});

for (const id in personagensSalvos) {
    // Guarda a ficha padrão antes de juntar com o que estava salvo
    const fichaBase = personagens[id];

    personagens[id] = {
        ...personagens[id],
        ...personagensSalvos[id]
    };

    if (idsFixos.includes(id) && fichaBase) {
        atualizarFichaBase(id, fichaBase);
    }
}

// Os 4 principais: vida máxima, sanidade máxima e imagem vêm do dados.js.
// A vida e a sanidade ATUAIS se ajustam ao novo máximo:
//  - quem estava cheio continua cheio (70/70 vira 78/78)
//  - quem estava machucado continua com o mesmo valor, sem passar do máximo
function atualizarFichaBase(id, fichaBase) {
    const personagem = personagens[id];
    let mudou = false;

    function ajustar(campoAtual, campoMaximo) {
        const maximoAntigo = personagem[campoMaximo];
        const maximoNovo = fichaBase[campoMaximo];

        if (maximoAntigo === maximoNovo) {
            return;
        }

        const estavaCheio = personagem[campoAtual] >= maximoAntigo;

        personagem[campoMaximo] = maximoNovo;
        personagem[campoAtual] = estavaCheio
            ? maximoNovo
            : Math.min(personagem[campoAtual], maximoNovo);

        mudou = true;
    }

    ajustar("hp", "hpMaximo");
    ajustar("sanidade", "sanidadeMaxima");

    if (personagem.imagem !== fichaBase.imagem) {
        personagem.imagem = fichaBase.imagem;
        mudou = true;
    }

    // Salva, para a visão dos jogadores também ver os valores novos
    if (mudou) {
        salvarPersonagemNoStorage(id);
    }
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
    Armazenamento.ler("batalha", { tokens: {}, turnoAtual: 0 });

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

// 6) Tempo real (V3): mudanças feitas em outro aparelho chegam na hora
Armazenamento.ligarTempoReal();

// 7) Imagens de antes do Storage (ainda em base64 dentro dos dados):
//    envia cada uma como arquivo e troca pelo endereço. Roda sempre que
//    o mapa abre, mas depois da primeira vez não acha mais nada para fazer.
//    "async" deixa usar "await": espera cada envio sem travar a tela.
async function migrarImagensParaStorage() {
    if (!temBanco()) {
        return;
    }

    // Mapa
    const mapaAntigo = Armazenamento.ler("mapa");

    if (ehBase64(mapaAntigo)) {
        const endereco = await enviarImagemParaStorage(mapaAntigo);

        // Deu errado: para aqui e tenta de novo na próxima vez que abrir
        if (ehBase64(endereco)) {
            return;
        }

        // Só troca se o mestre não escolheu OUTRO mapa enquanto enviava
        if (Armazenamento.ler("mapa") === mapaAntigo) {
            Armazenamento.salvar("mapa", endereco);
        }
    }

    // Galeria (imagensMestre vem do galeria.js)
    for (const imagem of imagensMestre) {
        if (!ehBase64(imagem.src)) {
            continue;
        }

        const endereco = await enviarImagemParaStorage(imagem.src);

        if (ehBase64(endereco)) {
            return;
        }

        imagem.src = endereco;
        salvarImagens();
    }

    // Imagens dos personagens e inimigos
    for (const id in personagens) {
        if (!ehBase64(personagens[id].imagem)) {
            continue;
        }

        const endereco = await enviarImagemParaStorage(personagens[id].imagem);

        if (ehBase64(endereco)) {
            return;
        }

        personagens[id].imagem = endereco;
        salvarPersonagemNoStorage(id);
    }
}

migrarImagensParaStorage();
