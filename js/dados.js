// Dados dos personagens: a lista da campanha, a função que salva e
// quem está selecionado/no mapa.
// Este arquivo vem ANTES dos outros da tela do mestre, porque todos usam "personagens".

// Começa vazia: o inicio.js enche com o que a campanha tem salvo.
const personagens = {};

// Personagens FIXOS: escolhidos ao criar a campanha (campanhas.js).
// Ficam marcados com "fixo: true" e não têm o × para excluir.
function ehFixo(id) {
    return Boolean(personagens[id] && personagens[id].fixo);
}

// Os 4 de Insurreição, de antes de cada campanha ter os próprios fixos.
// Só servem para as campanhas ANTIGAS (veja o inicio.js).
// Campanhas novas não recebem mais esses 4.
const fixosAntigos = {
    nero: {
        nome: "Nero",
        hp: 60,
        hpMaximo: 60,
        sanidade: 29,
        sanidadeMaxima: 29,
        imagem: "imagens-personagens/nero.png"
    },

    shin: {
        nome: "Shin",
        hp: 38,
        hpMaximo: 38,
        sanidade: 36,
        sanidadeMaxima: 36,
        imagem: "imagens-personagens/shin.png"
    },

    jotton: {
        nome: "Jotton",
        hp: 78,
        hpMaximo: 78,
        sanidade: 25,
        sanidadeMaxima: 25,
        imagem: "imagens-personagens/jotton.jpg"
    },

    calisto: {
        nome: "Calisto",
        hp: 59,
        hpMaximo: 59,
        sanidade: 24,
        sanidadeMaxima: 24,
        imagem: "imagens-personagens/calisto.png"
    }
};

// Para esses 4, a vida máxima, a sanidade máxima e a imagem vêm
// SEMPRE daqui (veja atualizarFichaBase no inicio.js).

// Salva UM personagem sem apagar o que a janela do Mestre salvou.
function salvarPersonagemNoStorage(id) {
    const salvos =
        Armazenamento.ler("personagens", {});

    salvos[id] = personagens[id];

    try {
        Armazenamento.salvar("personagens", salvos);
    } catch (erro) {
        alert("Sem espaço para salvar. Tente uma imagem menor.");
        console.error(erro);
    }
}

// Quem está aberto no painel de vida/sanidade
let personagemSelecionado = null;
let idSelecionado = null;
