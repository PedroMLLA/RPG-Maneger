// Dados dos personagens: os 4 principais, a função que salva no
// localStorage e quem está selecionado/no mapa.
// Este arquivo vem ANTES dos outros da tela do mestre, porque todos usam "personagens".

const personagens = {
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

// Para os 4 principais, a vida máxima, a sanidade máxima e a imagem
// vêm SEMPRE daqui, mesmo que o navegador tenha um valor antigo salvo
// (veja atualizarFichaBase no inicio.js). Assim, mudar esses números
// aqui vale para todas as campanhas.

// Os 4 personagens fixos já têm botão no HTML
const idsFixos = ["nero", "shin", "jotton", "calisto"];

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
let personagemSelecionado = personagens.nero;
let idSelecionado = "nero";
