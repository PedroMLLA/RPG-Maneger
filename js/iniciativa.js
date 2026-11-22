// Iniciativa: ordem de combate, turno atual, estado salvo da batalha
// e o botão Nova batalha.

const botaoIniciativa = document.getElementById("botao-iniciativa");
const painelIniciativa = document.getElementById("painel-iniciativa");
const listaIniciativa = document.getElementById("lista-iniciativa");
const vezAtual = document.getElementById("vez-atual");
const botaoProximoTurno = document.getElementById("botao-proximo-turno");

let ordemIniciativa = [];
let turnoAtual = 0;

botaoIniciativa.addEventListener("click", function() {

    if (painelIniciativa.style.display === "block") {
        painelIniciativa.style.display = "none";
    } else {
        painelIniciativa.style.display = "block";
    }

    // O botão fica "aceso" enquanto o painel está aberto
    botaoIniciativa.classList.toggle(
        "ativo",
        painelIniciativa.style.display === "block"
    );
});

// Guarda quem está no mapa, onde cada token está e de quem é a vez.
// Fica numa chave separada ("estadoBatalha") dos dados dos personagens.
// true enquanto aplicamos uma batalha que veio de OUTRA tela
// (sincronizacao.js). Aí não salvamos: ela já está salva, e salvar de
// novo faria as duas telas ficarem se reenviando a mesma coisa.
let aplicandoBatalhaDeFora = false;

function salvarEstadoBatalha() {
    if (aplicandoBatalhaDeFora) {
        return;
    }

    const tokens = {};

    for (const id in personagensCriados) {
        const boneco = personagensCriados[id];

        tokens[id] = {
            x: parseFloat(boneco.style.left),
            y: parseFloat(boneco.style.top)
        };
    }

    // De quem é a vez, já calculado, para a visão dos jogadores
    // não precisar refazer a ordenação da iniciativa.
    const idDaVez = ordemIniciativa[turnoAtual] || null;

    const estado = {
        tokens: tokens,
        turnoAtual: turnoAtual,
        idDaVez: idDaVez,
        nomeDaVez: idDaVez && personagens[idDaVez] ? personagens[idDaVez].nome : null
    };

    try {
        Armazenamento.salvar("batalha", estado);
    } catch (erro) {
        console.error(erro);
    }
}

// Toda mudança na batalha (token entrou, saiu, turno mudou) passa por
// atualizarIniciativa(), então é aqui que salvamos o estado.
function atualizarIniciativa() {

    listaIniciativa.innerHTML = "";

    ordemIniciativa = Object.keys(personagensCriados);

    ordemIniciativa.sort(function(a, b) {

        const iniciativaA =
            personagens[a].iniciativa || 0;

        const iniciativaB =
            personagens[b].iniciativa || 0;

        return iniciativaB - iniciativaA;
    });

    if (ordemIniciativa.length === 0) {

        turnoAtual = 0;

        vezAtual.textContent = "Vez de: -";

        salvarEstadoBatalha();

        return;
    }

    if (turnoAtual >= ordemIniciativa.length) {

        turnoAtual = 0;

    }

    ordemIniciativa.forEach(function(id, indice) {

        const personagem = personagens[id];

        const item = document.createElement("div");

        item.classList.add("item-iniciativa");

        if (indice === turnoAtual) {

            item.classList.add("atual");

        }

        item.innerHTML = `
            <span>${personagem.nome}</span>

            <input
                type="number"
                value="${personagem.iniciativa || ""}"
                placeholder="Iniciativa">
        `;

        const input =
            item.querySelector("input");

        input.addEventListener("change", function() {

            personagem.iniciativa =
                Number(input.value);

            // A iniciativa é um dado do personagem, então vai junto com o HP
            salvarPersonagemNoStorage(id);

            atualizarIniciativa();

        });

        listaIniciativa.appendChild(item);

    });

    const personagemAtual =
        personagens[ordemIniciativa[turnoAtual]];

    vezAtual.textContent =
        `Vez de: ${personagemAtual.nome}`;

    salvarEstadoBatalha();
}

botaoProximoTurno.addEventListener("click", function() {

    if (ordemIniciativa.length === 0) {

        return;

    }

    turnoAtual++;

    if (turnoAtual >= ordemIniciativa.length) {

        turnoAtual = 0;

    }

    atualizarIniciativa();

    // Se agora é a vez de alguém que está morrendo, a contagem diminui
    avancarMorrendo();

});

const botaoNovaBatalha = document.getElementById("botao-nova-batalha");

botaoNovaBatalha.addEventListener("click", function() {

    // confirm() mostra uma caixa com OK/Cancelar e devolve true ou false
    const confirmou = confirm(
        "Começar uma nova batalha?\n\n" +
        "Todos os tokens saem do mapa e a iniciativa é zerada.\n" +
        "HP e sanidade dos personagens continuam como estão."
    );

    if (!confirmou) {
        return;
    }

    for (const id in personagensCriados) {
        personagensCriados[id].remove();
        delete personagensCriados[id];

        // A iniciativa vale só para uma batalha, então apagamos
        if (personagens[id]) {
            delete personagens[id].iniciativa;

            // A contagem de "morrendo" também não passa para a próxima batalha
            delete personagens[id].morrendo;

            salvarPersonagemNoStorage(id);
        }
    }

    turnoAtual = 0;
    painelPersonagem.style.display = "none";

    // Atualiza a lista (agora vazia) e salva o estado limpo
    atualizarIniciativa();
});
