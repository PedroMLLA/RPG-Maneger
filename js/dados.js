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
        hp: 70,
        hpMaximo: 70,
        sanidade: 29,
        sanidadeMaxima: 29,
        imagem: "imagens-personagens/jotton.png"
    },

    calisto: {
        nome: "Calisto",
        hp: 100,
        hpMaximo: 100,
        sanidade: 50,
        sanidadeMaxima: 50
    }
};

// Os 4 personagens fixos já têm botão no HTML
const idsFixos = ["nero", "shin", "jotton", "calisto"];

// Salva UM personagem sem apagar o que a janela do Mestre salvou.
function salvarPersonagemNoStorage(id) {
    const salvos =
        JSON.parse(localStorage.getItem(chave("personagens"))) || {};

    salvos[id] = personagens[id];

    try {
        localStorage.setItem(chave("personagens"), JSON.stringify(salvos));
    } catch (erro) {
        alert("Sem espaço para salvar. Tente uma imagem menor.");
        console.error(erro);
    }
}

// Quem está aberto no painel de vida/sanidade
let personagemSelecionado = personagens.nero;
let idSelecionado = "nero";
