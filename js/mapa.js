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
        imagemMapa.src = imagemOtimizada;

        escala = 1;
        posicaoX = 0;
        posicaoY = 0;

        atualizarMapa();

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

function atualizarMapa() {
    conteudoMapa.style.transform =
        `translate(${posicaoX}px, ${posicaoY}px) scale(${escala})`;
}

mapa.addEventListener("wheel", function(event) {
    event.preventDefault();

    if (event.deltaY < 0) {
        escala += 0.1;
    } else {
        escala -= 0.1;
    }

    if (escala < 0.5) {
        escala = 0.5;
    }

    if (escala > 3) {
        escala = 3;
    }

    atualizarMapa();
});

// Apertar o mouse no mapa: começa a medir (se a régua estiver ligada)
// ou começa a arrastar o mapa.
mapa.addEventListener("mousedown", function(event) {
    if (modoRegua) {
        comecarMedicao(event);
        return;
    }

    arrastando = true;
    mouseX = event.clientX;
    mouseY = event.clientY;
});

document.addEventListener("mousemove", function(event) {

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

document.addEventListener("mouseup", function() {

    if (medindo) {
        terminarMedicao();
    }

    arrastando = false;
});
