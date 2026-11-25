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

    // Inimigo: painel com a etiqueta vermelha "INIMIGO"
    painelPersonagem.classList.toggle("painel-inimigo", ehInimigo);

    // A sanidade aparece para quem tem sanidade (aliado ou inimigo).
    // Os inimigos criados no Painel do Mestre não têm, então ela some.
    const temSanidade = personagemSelecionado.sanidadeMaxima > 0;
    blocoSanidade.style.display = temSanidade ? "block" : "none";

    if (temSanidade) {
        sanidadePersonagem.textContent = personagemSelecionado.sanidade;
        sanidadeMaximaPersonagem.textContent = personagemSelecionado.sanidadeMaxima;
    }

    // Se estiver morrendo, mostra a contagem e os botões (morrendo.js)
    atualizarBlocoMorrendo();

    painelPersonagem.style.display = "block";
}

botaoDano.addEventListener("click", function() {
    const valor = Number(valorHp.value);
    const vidaAntes = personagemSelecionado.hp;

    personagemSelecionado.hp -= valor;

    if (personagemSelecionado.hp < 0) {
        personagemSelecionado.hp = 0;
    }

    hpPersonagem.textContent = personagemSelecionado.hp;
    valorHp.value = "";

    salvarPersonagemNoStorage(idSelecionado);

    if (valor > 0) {
        animarDano(personagensCriados[idSelecionado]);

        // Chegou a 0 agora? Toca o som de morte no lugar do som de dano
        if (vidaAntes > 0 && personagemSelecionado.hp <= 0) {
            tocarSomMorte();
        } else {
            tocarSomDano();
        }
    }

    // Inimigo com vida zerada fica "derrotado" no mapa
    atualizarEstadoToken(personagensCriados[idSelecionado], personagemSelecionado);

    // Aliado que acabou de chegar a 0: abre a janela "morrendo"
    verificarMorrendo(idSelecionado, vidaAntes);
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

    // Quando o tremor acaba, tira a classe. Assim outras animações
    // do token (como o brilho de "morrendo") voltam a funcionar.
    elemento.addEventListener("animationend", function() {
        elemento.classList.remove("levou-dano");
    }, { once: true });
}

botaoCura.addEventListener("click", function() {
    const valor = Number(valorHp.value);
    const vidaAntes = personagemSelecionado.hp;

    personagemSelecionado.hp += valor;

    if (personagemSelecionado.hp > personagemSelecionado.hpMaximo) {
        personagemSelecionado.hp = personagemSelecionado.hpMaximo;
    }

    hpPersonagem.textContent = personagemSelecionado.hp;
    valorHp.value = "";

    salvarPersonagemNoStorage(idSelecionado);

    // Faíscas verdes subindo, com o quanto curou de verdade
    // (se já estava com a vida cheia, não acontece nada)
    const curou = personagemSelecionado.hp - vidaAntes;

    if (curou > 0) {
        efeitoCura(personagensCriados[idSelecionado], curou);
    }

    // Curou um inimigo derrotado? Ele volta ao normal
    atualizarEstadoToken(personagensCriados[idSelecionado], personagemSelecionado);

    // Curou quem estava morrendo? "Está de pé!"
    verificarSalvamento(idSelecionado);
    atualizarBlocoMorrendo();
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
    // Aliados e inimigos têm o mesmo menu (veja menu-contexto.js).
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

    tornarArrastavel(boneco, id);

    // Clique: abre o painel de vida (a sanidade só aparece se o personagem tiver).
    boneco.addEventListener("click", function(event) {
        event.stopPropagation();
        abrirPainelPersonagem(id);
    });
}

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

// Avisa os jogadores no máximo a cada 50 ms (20 vezes por segundo).
// O mouse dispara "pointermove" bem mais que isso, e mandar tudo
// gastaria internet à toa (e o Supabase tem limite de mensagens).
const INTERVALO_AO_VIVO = 50;

function avisarPosicaoAoVivo(boneco, id) {
    Armazenamento.avisarAoVivo("token", {
        id: id,
        x: parseFloat(boneco.style.left),
        y: parseFloat(boneco.style.top)
    });
}

function tornarArrastavel(boneco, id) {
    let arrastandoBoneco = false;
    let mouseXBoneco = 0;
    let mouseYBoneco = 0;
    let ultimoAviso = 0;

    boneco.addEventListener("pointerdown", function(event) {
        // Impede o mapa de começar a ser arrastado junto
        event.stopPropagation();

        // Só o botão esquerdo (button 0) arrasta; o direito abre o menu
        if (event.button !== 0) {
            return;
        }

        arrastandoBoneco = true;

        // Avisa o sincronizacao.js: enquanto estamos arrastando, posições
        // vindas de outra tela não mexem neste token
        boneco.dataset.arrastando = "sim";

        mouseXBoneco = event.clientX;
        mouseYBoneco = event.clientY;
    });

    document.addEventListener("pointermove", function(event) {
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

        // Os jogadores veem o token andando, sem esperar soltar
        const agora = Date.now();

        if (agora - ultimoAviso >= INTERVALO_AO_VIVO) {
            ultimoAviso = agora;
            avisarPosicaoAoVivo(boneco, id);
        }
    });

    document.addEventListener("pointerup", function() {
        // Só salva se ESTE token estava sendo arrastado
        if (arrastandoBoneco) {
            arrastandoBoneco = false;
            delete boneco.dataset.arrastando;

            // A posição final na hora; o banco confirma logo depois
            avisarPosicaoAoVivo(boneco, id);
            salvarEstadoBatalha();
        }
    });
}
