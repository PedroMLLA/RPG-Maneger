// Estado "morrendo": quando um aliado chega a 0 de vida, o mestre escolhe
// quantas rodadas o grupo tem para salvá-lo. A contagem diminui 1 a cada
// vez que a iniciativa passa, e a vez de quem está morrendo é pulada.
//
// O que fica salvo no personagem:
//   morrendo: { rodadas: 3, total: 3 }   enquanto a contagem está rolando
//   morto: true                           se a contagem chegou a zero

const janelaMorrendo = document.getElementById("janela-morrendo");
const tituloMorrendo = document.getElementById("titulo-morrendo");
const rodadasMorrendoInput = document.getElementById("rodadas-morrendo-input");
const botaoIniciarMorrendo = document.getElementById("botao-iniciar-morrendo");
const botaoIgnorarMorrendo = document.getElementById("botao-ignorar-morrendo");
const atalhosRodadas = document.querySelectorAll(".botao-rodadas");

const blocoMorrendo = document.getElementById("bloco-morrendo");
const rodadasMorrendoPainel = document.getElementById("rodadas-morrendo");
const botaoEstabilizar = document.getElementById("botao-estabilizar");
const botaoDeclararMorte = document.getElementById("botao-declarar-morte");

const avisoMestre = document.getElementById("aviso-mestre");

// De quem é a janela aberta
let idMorrendo = null;


// Publica para os jogadores E mostra um aviso pequeno na tela do mestre,
// para ele saber o que os jogadores estão vendo.
function anunciar(tipo, titulo, texto, duracao) {
    const anuncio = publicarAnuncio(tipo, titulo, texto, duracao);
    exibirAnuncio(avisoMestre, anuncio);
}

// Atualiza o token e o painel depois de qualquer mudança
function atualizarTelaMorrendo(id) {
    atualizarEstadoToken(personagensCriados[id], personagens[id]);

    if (idSelecionado === id) {
        atualizarBlocoMorrendo();
    }
}


// ----- 1) Chegou a zero: abre a janela -----
// Chamada pelo botão de Dano (tokens-mapa.js)
function verificarMorrendo(id, vidaAntes) {
    const personagem = personagens[id];

    // Só para aliados, só quando a vida ACABOU de chegar a zero
    // e se a contagem ainda não começou
    if (personagem.tipo === "inimigo") {
        return;
    }

    if (vidaAntes > 0 && personagem.hp <= 0 && !personagem.morrendo && !personagem.morto) {
        abrirJanelaMorrendo(id);
    }
}

function abrirJanelaMorrendo(id) {
    idMorrendo = id;

    tituloMorrendo.textContent = `☠ ${personagens[id].nome} caiu!`;
    rodadasMorrendoInput.value = 3;
    marcarAtalho(3);

    janelaMorrendo.style.display = "flex";
}

function fecharJanelaMorrendo() {
    janelaMorrendo.style.display = "none";
    idMorrendo = null;
}

// Botões rápidos (1, 2, 3, 5): preenchem o campo
function marcarAtalho(valor) {
    for (const atalho of atalhosRodadas) {
        atalho.classList.toggle("ativo", Number(atalho.dataset.rodadas) === valor);
    }
}

for (const atalho of atalhosRodadas) {
    atalho.addEventListener("click", function() {
        const valor = Number(atalho.dataset.rodadas);
        rodadasMorrendoInput.value = valor;
        marcarAtalho(valor);
    });
}

rodadasMorrendoInput.addEventListener("input", function() {
    marcarAtalho(Number(rodadasMorrendoInput.value));
});

botaoIniciarMorrendo.addEventListener("click", function() {
    const rodadas = Math.max(1, Number(rodadasMorrendoInput.value) || 1);
    const id = idMorrendo;

    fecharJanelaMorrendo();
    iniciarMorrendo(id, rodadas);
});

// "Agora não": o personagem fica com 0 de vida, sem contagem
botaoIgnorarMorrendo.addEventListener("click", fecharJanelaMorrendo);


// ----- 2) Começa a contagem -----
function iniciarMorrendo(id, rodadas) {
    const personagem = personagens[id];

    personagem.morrendo = { rodadas: rodadas, total: rodadas };
    salvarPersonagemNoStorage(id);
    atualizarTelaMorrendo(id);

    anunciar(
        "morrendo",
        `${personagem.nome} está morrendo`,
        `Vocês têm ${textoRodadas(rodadas)} para salvar ${personagem.nome}!`,
        7000
    );
}


// ----- 3) A cada vez que a iniciativa passa -----
// Chamada pelo botão "Próximo" da iniciativa (iniciativa.js), depois que
// o turno já avançou. Faz duas coisas:
//   a) pula a vez de quem está morrendo (ou morto): eles não jogam
//   b) tira 1 rodada de cada personagem que está morrendo
//
// Exemplo: iniciativa Nero, Shin, Jotton. Nero cai e o mestre dá 4.
//   vez do Shin   -> 3
//   vez do Jotton -> 2
//   (vez do Nero é pulada)
//   vez do Shin   -> 1   ...e assim por diante.
function avancarMorrendo() {
    pularQuemNaoJoga();
    descontarRodada();
}

// Quem está morrendo ou morto não pode agir no seu turno
function naoPodeJogar(id) {
    const personagem = personagens[id];
    return Boolean(personagem && (personagem.morrendo || personagem.morto));
}

function pularQuemNaoJoga() {
    let pulados = 0;

    // O "pulados < length" evita um laço infinito se TODOS estiverem
    // morrendo: nesse caso a vez fica onde está.
    while (
        ordemIniciativa.length > 0 &&
        naoPodeJogar(ordemIniciativa[turnoAtual]) &&
        pulados < ordemIniciativa.length
    ) {
        turnoAtual = (turnoAtual + 1) % ordemIniciativa.length;
        pulados++;
    }

    // Se pulou alguém, redesenha a iniciativa com a vez certa
    if (pulados > 0) {
        atualizarIniciativa();
    }
}

function descontarRodada() {
    for (const id in personagensCriados) {
        const personagem = personagens[id];

        if (!personagem || !personagem.morrendo) {
            continue;
        }

        personagem.morrendo.rodadas -= 1;

        if (personagem.morrendo.rodadas <= 0) {
            declararMorte(id);
            continue;
        }

        salvarPersonagemNoStorage(id);
        atualizarTelaMorrendo(id);

        const restam = personagem.morrendo.rodadas;

        if (restam === 1) {
            anunciar(
                "rodada",
                "Última rodada!",
                `É agora ou nunca para salvar ${personagem.nome}.`,
                5000
            );
        } else {
            anunciar(
                "rodada",
                `Restam ${textoRodadas(restam)}`,
                `para salvar ${personagem.nome}`,
                4500
            );
        }
    }
}


// ----- 4) Finais possíveis -----
// Curaram (vida voltou a ser maior que 0) — chamada pelo botão de Cura
function verificarSalvamento(id) {
    const personagem = personagens[id];

    if (personagem.hp <= 0) {
        return;
    }

    // Curaram alguém que estava morto: ele simplesmente volta
    if (personagem.morto) {
        delete personagem.morto;
        salvarPersonagemNoStorage(id);
        atualizarTelaMorrendo(id);
        return;
    }

    if (!personagem.morrendo) {
        return;
    }

    delete personagem.morrendo;
    salvarPersonagemNoStorage(id);
    atualizarTelaMorrendo(id);

    anunciar(
        "salvo",
        `${personagem.nome} está de pé!`,
        "O grupo conseguiu a tempo.",
        6000
    );
}

// Estabilizar: para a contagem, mesmo sem curar a vida
function estabilizar(id) {
    const personagem = personagens[id];

    delete personagem.morrendo;
    salvarPersonagemNoStorage(id);
    atualizarTelaMorrendo(id);

    anunciar(
        "salvo",
        `${personagem.nome} se estabilizou`,
        "Fora de perigo, por enquanto.",
        6000
    );
}

function declararMorte(id) {
    const personagem = personagens[id];

    delete personagem.morrendo;
    personagem.morto = true;
    salvarPersonagemNoStorage(id);
    atualizarTelaMorrendo(id);

    anunciar(
        "morreu",
        `${personagem.nome} morreu`,
        "Que descanse em paz.",
        7000
    );
}


// ----- 5) Bloco no painel de vida -----
// Mostra a contagem e os botões quando o personagem aberto está morrendo
function atualizarBlocoMorrendo() {
    const personagem = personagens[idSelecionado];

    if (personagem && personagem.morrendo) {
        rodadasMorrendoPainel.textContent = textoRodadas(personagem.morrendo.rodadas);
        blocoMorrendo.style.display = "block";
    } else {
        blocoMorrendo.style.display = "none";
    }
}

botaoEstabilizar.addEventListener("click", function() {
    estabilizar(idSelecionado);
});

botaoDeclararMorte.addEventListener("click", function() {
    const confirmou = confirm(`Declarar a morte de ${personagens[idSelecionado].nome}?`);

    if (confirmou) {
        declararMorte(idSelecionado);
    }
});
