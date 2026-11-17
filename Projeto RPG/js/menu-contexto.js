// Menu do botão direito nos tokens e os botões de
// "mostrar aos jogadores" usados pelas janelas.

// ----- Menu do botão direito -----
const menuContexto = document.getElementById("menu-contexto");
const opcaoVidaVisivel = document.getElementById("opcao-vida-visivel");
const condicoesMenu = document.getElementById("condicoes-menu");

// Opções que só fazem sentido para aliados (inimigos não têm ficha etc.)
const opcoesSoDeAliados = [
    opcaoVidaVisivel,
    document.getElementById("opcao-inventario"),
    document.getElementById("opcao-ficha"),
    document.getElementById("opcao-habilidades")
];

// Guarda em qual personagem o menu foi aberto
let idDoMenu = null;

function abrirMenuContexto(id, x, y) {
    idDoMenu = id;

    const ehInimigo = personagens[id].tipo === "inimigo";

    // Para inimigos, esconde as opções de aliado: sobram só as condições
    for (const opcao of opcoesSoDeAliados) {
        opcao.hidden = ehInimigo;
    }

    // O texto da opção depende do estado atual: mostrar ou esconder
    if (personagens[id].vidaVisivel) {
        opcaoVidaVisivel.textContent = "🙈 Esconder vida e sanidade";
    } else {
        opcaoVidaVisivel.textContent = "👁️ Mostrar vida e sanidade aos jogadores";
    }

    desenharCondicoesDoMenu();

    // Abre o menu exatamente onde o mouse está
    menuContexto.style.left = `${x}px`;
    menuContexto.style.top = `${y}px`;
    menuContexto.style.display = "block";
}

function fecharMenuContexto() {
    menuContexto.style.display = "none";
    idDoMenu = null;
}


// ----- Condições -----
// Um botãozinho por condição. Clicar liga/desliga NA HORA e salva,
// e o menu continua aberto para marcar várias de uma vez.
function desenharCondicoesDoMenu() {
    condicoesMenu.innerHTML = "";

    const personagem = personagens[idDoMenu];
    const ativas = personagem.condicoes || [];

    for (const condicao of CONDICOES) {
        const botao = document.createElement("button");
        botao.classList.add("chip-condicao");
        botao.textContent = condicao.icone;
        botao.title = condicao.nome;

        // .includes() diz se a lista tem aquele valor
        botao.classList.toggle("ativo", ativas.includes(condicao.chave));

        botao.addEventListener("click", function() {
            alternarCondicao(idDoMenu, condicao.chave);
            botao.classList.toggle("ativo");
        });

        condicoesMenu.appendChild(botao);
    }
}

function alternarCondicao(id, chave) {
    const personagem = personagens[id];
    const condicoes = personagem.condicoes || [];

    if (condicoes.includes(chave)) {
        // .filter() cria uma lista nova SEM aquela condição
        personagem.condicoes = condicoes.filter(function(c) {
            return c !== chave;
        });
    } else {
        personagem.condicoes = [...condicoes, chave];
    }

    // Salvar avisa a visão dos jogadores, que redesenha os ícones
    salvarPersonagemNoStorage(id);

    atualizarEstadoToken(personagensCriados[id], personagem);
}

opcaoVidaVisivel.addEventListener("click", function() {
    const personagem = personagens[idDoMenu];

    // "!" inverte: true vira false e false vira true
    personagem.vidaVisivel = !personagem.vidaVisivel;

    // Salvar dispara o evento "storage" e a visão dos jogadores se atualiza
    salvarPersonagemNoStorage(idDoMenu);

    if (personagensCriados[idDoMenu]) {
        personagensCriados[idDoMenu].classList.toggle(
            "vida-visivel",
            personagem.vidaVisivel
        );
    }

    fecharMenuContexto();
});

// ----- Botão "mostrar aos jogadores" (usado no inventário e na ficha) -----
// Muda o texto e a cor do botão conforme o estado atual.
function atualizarBotaoVisivel(botao, visivel) {
    if (visivel) {
        botao.textContent = "👁 Jogadores estão vendo";
    } else {
        botao.textContent = "🙈 Escondido dos jogadores";
    }

    // toggle(classe, true/false) liga ou desliga a classe
    botao.classList.toggle("ativo", Boolean(visivel));
}

// Inverte uma propriedade (ex.: "inventarioVisivel") do personagem e salva
// NA HORA. Isso não depende do botão "Salvar" da janela.
function alternarVisibilidade(id, propriedade, botao) {
    personagens[id][propriedade] = !personagens[id][propriedade];
    salvarPersonagemNoStorage(id);
    atualizarBotaoVisivel(botao, personagens[id][propriedade]);
}

// Clicar em qualquer lugar fora do menu fecha ele.
// O "true" no fim faz este código rodar ANTES dos outros cliques,
// então funciona mesmo se o clique for num token.
document.addEventListener("mousedown", function(event) {
    if (!menuContexto.contains(event.target)) {
        fecharMenuContexto();
    }
}, true);

document.addEventListener("keydown", function(event) {
    if (event.key === "Escape") {
        fecharMenuContexto();
    }
});
