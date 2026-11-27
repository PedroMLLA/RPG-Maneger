// Menu do botão direito nos tokens e os botões de
// "mostrar aos jogadores" usados pelas janelas.

// ----- Menu do botão direito -----
const menuContexto = document.getElementById("menu-contexto");
const opcaoVidaVisivel = document.getElementById("opcao-vida-visivel");
const opcaoVisao = document.getElementById("opcao-visao");
const condicoesMenu = document.getElementById("condicoes-menu");

// Guarda em qual personagem o menu foi aberto
let idDoMenu = null;

// Aliados e inimigos têm as mesmas opções no menu.
function abrirMenuContexto(id, x, y) {
    idDoMenu = id;

    const personagem = personagens[id];

    // Quem não tem sanidade (como os inimigos do Painel do Mestre)
    // mostra só a vida, então o texto muda um pouco.
    const temSanidade = personagem.sanidadeMaxima > 0;
    const oQueMostra = temSanidade ? "vida e sanidade" : "vida";

    // O texto da opção depende do estado atual: mostrar ou esconder
    if (personagem.vidaVisivel) {
        opcaoVidaVisivel.textContent = `🙈 Esconder ${oQueMostra}`;
    } else {
        opcaoVidaVisivel.textContent = `👁️ Mostrar ${oQueMostra} aos jogadores`;
    }

    // Campo de visão: o texto diz o que o clique vai fazer
    const boneco = personagensCriados[id];
    const visaoLigada = boneco && boneco.dataset.visao !== undefined;

    opcaoVisao.textContent = visaoLigada
        ? "🔦 Desligar campo de visão"
        : "🔦 Ligar campo de visão";

    desenharCondicoesDoMenu();

    // Abre o menu onde o mouse (ou o dedo) está
    menuContexto.style.display = "block";
    posicionarNaTela(menuContexto, x, y);
}

// Põe o menu no ponto (x, y), mas empurra para dentro se ele fosse
// sair da tela (acontece muito no celular, que é estreito).
// Usado também pelo menu das imagens (galeria.js).
function posicionarNaTela(menu, x, y) {
    const margem = 8;
    const maxX = window.innerWidth - menu.offsetWidth - margem;
    const maxY = window.innerHeight - menu.offsetHeight - margem;

    menu.style.left = `${Math.max(margem, Math.min(x, maxX))}px`;
    menu.style.top = `${Math.max(margem, Math.min(y, maxY))}px`;
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

// Liga o cone olhando para a direita (depois é só girar pela alça),
// ou desliga. Fica salvo na batalha, junto com a posição do token.
opcaoVisao.addEventListener("click", function() {
    const boneco = personagensCriados[idDoMenu];

    if (boneco) {
        const ligado = boneco.dataset.visao !== undefined;
        aplicarCampoVisao(idDoMenu, ligado ? null : 0);
        salvarEstadoBatalha();
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
document.addEventListener("pointerdown", function(event) {
    if (!menuContexto.contains(event.target)) {
        fecharMenuContexto();
    }
}, true);

document.addEventListener("keydown", function(event) {
    if (event.key === "Escape") {
        fecharMenuContexto();
    }
});
