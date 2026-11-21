// O mapa: imagem, zoom com a roda do mouse, arrastar, trocar a imagem,
// e os botões que abrem as outras janelas.

const botaoMenu = document.getElementById("botao-menu");
const barraLateral = document.getElementById("barra-lateral");
const botaoModoMestre = document.getElementById("botao-modo-mestre");
const botaoVisaoJogadores = document.getElementById("botao-visao-jogadores");
const botaoEscolherMapa = document.getElementById("botao-escolher-mapa");
const arquivoMapa = document.getElementById("arquivo-mapa");

const mapa = document.getElementById("mapa");
const imagemMapa = document.getElementById("imagem-mapa");
const conteudoMapa = document.getElementById("conteudo-mapa");


// ----- Botões das janelas e da barra lateral -----
botaoMenu.addEventListener("click", function() {
    barraLateral.classList.toggle("fechada");
});

// Tela de celular: a barra lateral cobriria o mapa, então começa fechada
// (o ☰ abre). É a mesma regra de largura do CSS (max-width: 760px).
const TELA_PEQUENA = window.matchMedia("(max-width: 760px)").matches;

if (TELA_PEQUENA) {
    barraLateral.classList.add("fechada");
}

botaoModoMestre.addEventListener("click", function() {
    window.open("mestre.html", "painelMestre", "width=400,height=600");
});

// Abre a tela dos jogadores numa janela própria, para arrastar
// até a TV/projetor e deixar em tela cheia (F11).
botaoVisaoJogadores.addEventListener("click", function() {
    window.open("jogador.html", "visaoJogadores", "width=1280,height=720");
});


// ----- Campanha escolhida na roda (campanhas.html) -----
// Mostra o nome dela no cabeçalho, ao lado do título.
// Se nenhuma foi escolhida (ou ela foi excluída), volta para a roda.
const campanhaAtual = campanhaEscolhida();

if (!campanhaAtual) {
    location.replace("campanhas.html");
} else {
    const etiquetaCampanha = document.getElementById("campanha-atual");
    etiquetaCampanha.textContent = campanhaAtual.nome;
    etiquetaCampanha.hidden = false;

    // Código para os jogadores (V3). Clicar copia para mandar no grupo.
    if (campanhaAtual.codigo) {
        const botaoCodigo = document.getElementById("codigo-campanha");
        const textoCodigo = `🔑 ${campanhaAtual.codigo}`;

        botaoCodigo.textContent = textoCodigo;
        botaoCodigo.hidden = false;

        botaoCodigo.addEventListener("click", async function() {
            try {
                await navigator.clipboard.writeText(campanhaAtual.codigo);
                botaoCodigo.textContent = "✔ Copiado!";
            } catch (erro) {
                botaoCodigo.textContent = "Não deu para copiar";
            }

            setTimeout(function() {
                botaoCodigo.textContent = textoCodigo;
            }, 1500);
        });
    }
}


// ----- Imagem do mapa -----
// Usa o último mapa enviado NESTA campanha; se nunca enviaram nenhum,
// abre o mapa padrão dela (veja campanha-atual.js).
const mapaPersonalizado =
    Armazenamento.ler("mapa");

if (mapaPersonalizado) {
    imagemMapa.src = mapaPersonalizado;
} else {
    imagemMapa.src = mapaPadraoDaCampanha();
}

botaoEscolherMapa.addEventListener("click", function() {
    arquivoMapa.click();
});

arquivoMapa.addEventListener("change", function() {

    const arquivo = arquivoMapa.files[0];

    if (!arquivo) {
        return;
    }

    // Mapas precisam de mais detalhe que tokens, então o limite é 2000px.
    otimizarImagem(arquivo, function(imagemOtimizada) {
        // Quando a imagem nova carregar, o "load" lá embaixo encaixa ela na tela
        imagemMapa.src = imagemOtimizada;

        try {
            Armazenamento.salvar("mapa", imagemOtimizada);
        } catch (erro) {
            alert("O mapa foi aberto, mas é grande demais para ficar salvo.");
            console.error(erro);
        }
    }, 2000);
});


// ----- Zoom e arrastar o mapa -----
let escala = 1;
let posicaoX = 0;
let posicaoY = 0;

let arrastando = false;
let mouseX = 0;
let mouseY = 0;

// Limites do zoom. O mínimo muda com o mapa: um mapa grande num
// celular precisa diminuir bem mais que 0.5 para caber inteiro.
let escalaMinima = 0.5;
const ESCALA_MAXIMA = 3;

function limitarEscala(valor) {
    return Math.min(ESCALA_MAXIMA, Math.max(escalaMinima, valor));
}

function atualizarMapa() {
    conteudoMapa.style.transform =
        `translate(${posicaoX}px, ${posicaoY}px) scale(${escala})`;
}

// A imagem agora fica no tamanho original (pode ter 2000px), então
// começamos com um zoom que mostra o mapa inteiro, centralizado.
// Igual ao ajustarNaTela() da visão dos jogadores.
function encaixarMapa() {
    const largura = imagemMapa.naturalWidth;
    const altura = imagemMapa.naturalHeight;

    if (!largura || !altura) {
        return;
    }

    const cabe = Math.min(mapa.clientWidth / largura, mapa.clientHeight / altura);

    escalaMinima = Math.min(0.5, cabe);
    escala = cabe;
    posicaoX = (mapa.clientWidth - largura * escala) / 2;
    posicaoY = (mapa.clientHeight - altura * escala) / 2;

    atualizarMapa();
}

imagemMapa.addEventListener("load", encaixarMapa);

// A imagem pode ter carregado antes deste código rodar (já estava no cache)
if (imagemMapa.complete) {
    encaixarMapa();
}

mapa.addEventListener("wheel", function(event) {
    event.preventDefault();

    if (event.deltaY < 0) {
        escala = limitarEscala(escala + 0.1);
    } else {
        escala = limitarEscala(escala - 0.1);
    }

    atualizarMapa();
});

// Apertar o mouse no mapa: começa a medir (se a régua estiver ligada)
// ou começa a arrastar o mapa.
// Dedos encostados no mapa agora (id -> posição). Com dois, é zoom.
const dedosNoMapa = new Map();

mapa.addEventListener("pointerdown", function(event) {
    dedosNoMapa.set(event.pointerId, { x: event.clientX, y: event.clientY });

    // Segundo dedo: para de arrastar e começa o zoom de pinça
    if (dedosNoMapa.size === 2) {
        arrastando = false;
        return;
    }

    if (modoRegua) {
        comecarMedicao(event);
        return;
    }

    arrastando = true;
    mouseX = event.clientX;
    mouseY = event.clientY;
});

function distanciaDosDedos() {
    const [a, b] = [...dedosNoMapa.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
}

document.addEventListener("pointermove", function(event) {

    // Pinça com dois dedos: dedos se afastando = zoom maior
    if (dedosNoMapa.size === 2 && dedosNoMapa.has(event.pointerId)) {
        const antes = distanciaDosDedos();
        dedosNoMapa.set(event.pointerId, { x: event.clientX, y: event.clientY });
        const agora = distanciaDosDedos();

        escala = limitarEscala(escala * (agora / antes));
        atualizarMapa();
        return;
    }

    if (medindo) {
        continuarMedicao(event);
        return;
    }

    if (!arrastando) {
        return;
    }

    const movimentoX = event.clientX - mouseX;
    const movimentoY = event.clientY - mouseY;

    posicaoX += movimentoX;
    posicaoY += movimentoY;

    mouseX = event.clientX;
    mouseY = event.clientY;

    atualizarMapa();
});

function soltarPonteiro(event) {
    dedosNoMapa.delete(event.pointerId);

    if (medindo) {
        terminarMedicao();
    }

    arrastando = false;
}

document.addEventListener("pointerup", soltarPonteiro);
// pointercancel: o celular "roubou" o toque (ex.: chegou uma notificação)
document.addEventListener("pointercancel", soltarPonteiro);


// ----- Celular: segurar o dedo = botão direito -----
// O Android já faz isso sozinho; o iPhone não. Depois de 600 ms com o
// dedo parado, mandamos um "contextmenu" para o que está embaixo do dedo
// (token ou imagem), e o menu de sempre abre.
let toqueLongo = null;

document.addEventListener("pointerdown", function(event) {
    if (event.pointerType !== "touch") {
        return;
    }

    const alvo = event.target;
    const inicio = { x: event.clientX, y: event.clientY };

    toqueLongo = {
        inicio,
        menuJaAbriu: false,
        relogio: setTimeout(function() {
            // O próprio celular já abriu o menu (Android)? Não abre de novo.
            if (toqueLongo && !toqueLongo.menuJaAbriu) {
                alvo.dispatchEvent(new MouseEvent("contextmenu", {
                    bubbles: true,
                    cancelable: true,
                    clientX: inicio.x,
                    clientY: inicio.y
                }));
            }
            toqueLongo = null;
        }, 600)
    };
}, true); // true = captura: roda antes do token, que para o evento (stopPropagation)

document.addEventListener("pointermove", function(event) {
    // Mexeu o dedo mais de 10px: era um arraste, não um "segurar"
    if (toqueLongo && Math.hypot(event.clientX - toqueLongo.inicio.x, event.clientY - toqueLongo.inicio.y) > 10) {
        cancelarToqueLongo();
    }
});

function cancelarToqueLongo() {
    if (toqueLongo) {
        clearTimeout(toqueLongo.relogio);
        toqueLongo = null;
    }
}

document.addEventListener("pointerup", cancelarToqueLongo);
document.addEventListener("pointercancel", cancelarToqueLongo);

document.addEventListener("contextmenu", function() {
    if (toqueLongo) {
        toqueLongo.menuJaAbriu = true;
    }
}, true);
