// Inicialização da tela do mestre. Este é o ÚLTIMO arquivo carregado:
// quando ele roda, todas as funções dos outros arquivos já existem.

// 1) Carrega os personagens da campanha (fixos, criados e inimigos).
const personagensSalvos =
    Armazenamento.ler("personagens", {});

// Campanha de ANTES dos fixos por campanha: nenhum personagem marcado
// como fixo. Ela continua com os 4 de Insurreição, agora marcados.
// (Campanhas novas sempre têm pelo menos um fixo, então não caem aqui.)
const temFixos = Object.values(personagensSalvos).some(function(personagem) {
    return personagem && personagem.fixo;
});

if (!temFixos) {
    for (const id in fixosAntigos) {
        personagensSalvos[id] = {
            ...fixosAntigos[id],
            ...personagensSalvos[id],
            tipo: "player",
            fixo: true
        };
    }

    try {
        Armazenamento.salvar("personagens", personagensSalvos);
    } catch (erro) {
        console.error(erro);
    }
}

for (const id in personagensSalvos) {
    if (!personagensSalvos[id]) {
        continue;
    }

    personagens[id] = personagensSalvos[id];

    // Só na hora de virar fixo. Depois disso, quem manda é o ✎ da
    // barra lateral: se o dados.js ganhasse sempre, a edição do mestre
    // seria desfeita toda vez que o mapa abrisse.
    if (!temFixos && fixosAntigos[id]) {
        atualizarFichaBase(id, fixosAntigos[id]);
    }
}

// Os 4 antigos, ao virarem fixos: vida máxima, sanidade máxima e imagem
// vêm do dados.js. A vida e a sanidade ATUAIS se ajustam ao novo máximo:
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

// 2) Cria os botões na barra lateral: os fixos primeiro, depois o resto.
desenharListaPersonagens();

// 3) Coloca de volta os tokens que estavam no mapa.
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

// 4) O turno só é restaurado no fim, com todos os tokens já no mapa
turnoAtual = estadoSalvo.turnoAtual || 0;
atualizarIniciativa();

// 5) Tempo real (V3): mudanças feitas em outro aparelho chegam na hora
Armazenamento.ligarTempoReal();

// 6) Imagens de antes do Storage (ainda em base64 dentro dos dados):
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
