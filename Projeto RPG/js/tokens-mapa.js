// Tokens no mapa do mestre: criar, arrastar, clicar e o painel de
// vida/sanidade que abre ao clicar num personagem.

const personagensMapa = document.getElementById("personagens-mapa");
const painelPersonagem = document.getElementById("painel-personagem");
const fecharPainel = document.getElementById("fechar-painel");
const removerPersonagem = document.getElementById("remover-personagem");
const nomePersonagem = document.getElementById("nome-personagem");
const hpPersonagem = document.getElementById("hp-personagem");
const hpMaximoPersonagem = document.getElementById("hp-maximo-personagem");
const sanidadePersonagem = document.getElementById("sanidade-personagem");
const sanidadeMaximaPersonagem = document.getElementById("sanidade-maxima-personagem");
const valorHp = document.getElementById("valor-hp");
const botaoDano = document.getElementById("botao-dano");
const botaoCura = document.getElementById("botao-cura");
const valorSanidade = document.getElementById("valor-sanidade");
const botaoDanoSanidade = document.getElementById("botao-dano-sanidade");
const botaoCuraSanidade = document.getElementById("botao-cura-sanidade");
const blocoSanidade = document.getElementById("bloco-sanidade");

// Abre o painel de vida de um personagem ou inimigo
function abrirPainelPersonagem(id) {
    personagemSelecionado = personagens[id];
    idSelecionado = id;

    const ehInimigo = personagemSelecionado.tipo === "inimigo";

    nomePersonagem.textContent = personagemSelecionado.nome;
    hpPersonagem.textContent = personagemSelecionado.hp;
    hpMaximoPersonagem.textContent = personagemSelecionado.hpMaximo;

    // Inimigo: esconde a sanidade e pinta o painel de vermelho
    blocoSanidade.style.display = ehInimigo ? "none" : "block";
    painelPersonagem.classList.toggle("painel-inimigo", ehInimigo);

    if (!ehInimigo) {
        sanidadePersonagem.textContent = personagemSelecionado.sanidade;
        sanidadeMaximaPersonagem.textContent = personagemSelecionado.sanidadeMaxima;
    }

    painelPersonagem.style.display = "block";
}

botaoDano.addEventListener("click", function() {
    const valor = Number(valorHp.value);

    personagemSelecionado.hp -= valor;

    if (personagemSelecionado.hp < 0) {
        personagemSelecionado.hp = 0;
    }

    hpPersonagem.textContent = personagemSelecionado.hp;
    valorHp.value = "";

    salvarPersonagemNoStorage(idSelecionado);

    if (valor > 0) {
        animarDano(personagensCriados[idSelecionado]);
    }

    // Inimigo com vida zerada fica "derrotado" no mapa
    atualizarEstadoToken(personagensCriados[idSelecionado], personagemSelecionado);
});

// Faz o token tremer e piscar em vermelho.
function animarDano(elemento) {
    if (!elemento) {
        return;
    }

    // Tirar a classe, forçar o navegador a "notar" (offsetWidth) e
    // colocar de novo faz a animação recomeçar mesmo em danos seguidos.
    elemento.classList.remove("levou-dano");
    void elemento.offsetWidth;
    elemento.classList.add("levou-dano");
}

botaoCura.addEventListener("click", function() {
    const valor = Number(valorHp.value);

    personagemSelecionado.hp += valor;

    if (personagemSelecionado.hp > personagemSelecionado.hpMaximo) {
        personagemSelecionado.hp = personagemSelecionado.hpMaximo;
    }

    hpPersonagem.textContent = personagemSelecionado.hp;
    valorHp.value = "";

    salvarPersonagemNoStorage(idSelecionado);

    // Curou um inimigo derrotado? Ele volta ao normal
    atualizarEstadoToken(personagensCriados[idSelecionado], personagemSelecionado);
});

botaoDanoSanidade.addEventListener("click", function() {
    const valor = Number(valorSanidade.value);

    personagemSelecionado.sanidade -= valor;

    if (personagemSelecionado.sanidade < 0) {
        personagemSelecionado.sanidade = 0;
    }

    sanidadePersonagem.textContent = personagemSelecionado.sanidade;

    valorSanidade.value = "";

    salvarPersonagemNoStorage(idSelecionado);
});

botaoCuraSanidade.addEventListener("click", function() {
    const valor = Number(valorSanidade.value);

    personagemSelecionado.sanidade += valor;

    if (personagemSelecionado.sanidade > personagemSelecionado.sanidadeMaxima) {
        personagemSelecionado.sanidade = personagemSelecionado.sanidadeMaxima;
    }

    sanidadePersonagem.textContent = personagemSelecionado.sanidade;

    valorSanidade.value = "";

    salvarPersonagemNoStorage(idSelecionado);
});

const botaoNero = document.getElementById("botao-nero");
const botaoShin = document.getElementById("botao-shin");
const botaoJotton = document.getElementById("botao-jotton");
const botaoCalisto = document.getElementById("botao-calisto");

const personagensCriados = {};

function criarPersonagem(id, letra, posicaoX, posicaoY, tipo, tamanho) {

    if (personagensCriados[id]) {
        return;
    }

    const boneco = document.createElement("div");

    // A aparência do token fica em tokens.js, porque a visão dos
    // jogadores desenha os tokens do mesmo jeito.
    aplicarVisualToken(boneco, personagens[id], tipo, tamanho, letra);

    // Animação de "surgir" só na criação. Quando ela termina, tiramos a
    // classe, para não repetir quando outra animação (ex.: dano) acabar.
    boneco.classList.add("surgindo");

    boneco.addEventListener("animationend", function() {
        boneco.classList.remove("surgindo");
    }, { once: true });

    // Marca (só na tela do mestre) quem está com a vida à mostra
    if (personagens[id] && personagens[id].vidaVisivel) {
        boneco.classList.add("vida-visivel");
    }

    // Ícones de condição e o visual de "derrotado"
    atualizarEstadoToken(boneco, personagens[id]);

    // Botão direito: abre o nosso menu em vez do menu do navegador.
    // Para inimigos, o menu mostra só as condições (veja menu-contexto.js).
    boneco.addEventListener("contextmenu", function(event) {
        event.preventDefault();
        event.stopPropagation();

        abrirMenuContexto(id, event.clientX, event.clientY);
    });

    boneco.style.left = `${posicaoX}px`;
    boneco.style.top = `${posicaoY}px`;

    personagensMapa.appendChild(boneco);
    personagensCriados[id] = boneco;
    atualizarIniciativa();

    tornarArrastavel(boneco);

    // Clique: abre o painel de vida. Para inimigos, só a vida (sem sanidade).
    boneco.addEventListener("click", function(event) {
        event.stopPropagation();
        abrirPainelPersonagem(id);
    });
}

botaoNero.addEventListener("click", function() {
    criarPersonagem("nero", "N", 300, 200, "player");
});

botaoShin.addEventListener("click", function() {
    criarPersonagem("shin", "S", 400, 200, "player");
});

botaoJotton.addEventListener("click", function() {
    criarPersonagem("jotton", "J", 500, 200, "player");
});

botaoCalisto.addEventListener("click", function() {
    criarPersonagem("calisto", "C", 600, 200, "player");
});

fecharPainel.addEventListener("click", function() {
    painelPersonagem.style.display = "none";
});

removerPersonagem.addEventListener("click", function() {
    const id = Object.keys(personagens).find(function(chave) {
        return personagens[chave] === personagemSelecionado;
    });

    if (id && personagensCriados[id]) {
        personagensCriados[id].remove();
        delete personagensCriados[id];
        atualizarIniciativa();
    }

    painelPersonagem.style.display = "none";
});

function tornarArrastavel(boneco) {
    let arrastandoBoneco = false;
    let mouseXBoneco = 0;
    let mouseYBoneco = 0;

    boneco.addEventListener("mousedown", function(event) {
        // Impede o mapa de começar a ser arrastado junto
        event.stopPropagation();

        // Só o botão esquerdo (button 0) arrasta; o direito abre o menu
        if (event.button !== 0) {
            return;
        }

        arrastandoBoneco = true;

        mouseXBoneco = event.clientX;
        mouseYBoneco = event.clientY;
    });

    document.addEventListener("mousemove", function(event) {
        if (!arrastandoBoneco) {
            return;
        }

        // O mouse anda em pixels da TELA, mas o token vive dentro do mapa,
        // que está ampliado/reduzido por "escala". Dividindo, os dois andam juntos.
        const movimentoX = (event.clientX - mouseXBoneco) / escala;
        const movimentoY = (event.clientY - mouseYBoneco) / escala;

        const posicaoAtualX = parseFloat(boneco.style.left);
        const posicaoAtualY = parseFloat(boneco.style.top);

        boneco.style.left = `${posicaoAtualX + movimentoX}px`;
        boneco.style.top = `${posicaoAtualY + movimentoY}px`;

        mouseXBoneco = event.clientX;
        mouseYBoneco = event.clientY;
    });

    document.addEventListener("mouseup", function() {
        // Só salva se ESTE token estava sendo arrastado
        if (arrastandoBoneco) {
            arrastandoBoneco = false;
            salvarEstadoBatalha();
        }
    });
}
