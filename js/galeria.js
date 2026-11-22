// Galeria de imagens do mestre: ele escolhe imagens do PC, elas ficam
// guardadas na aba "Imagens" da barra lateral e podem ser arrastadas
// para o mapa (e os jogadores veem). No mapa dá para mover, aumentar,
// diminuir e, pelo botão direito, devolver para a aba.
//
// Tudo fica numa chave só do localStorage, "imagensMestre":
//   [ { id, nome, src, noMapa, x, y, largura }, ... ]
// x, y e largura são em pixels DO MAPA (antes do zoom).

const botaoAdicionarImagem = document.getElementById("botao-adicionar-imagem");
const arquivoImagem = document.getElementById("arquivo-imagem");
const galeriaImagens = document.getElementById("galeria-imagens");
const galeriaVazia = document.getElementById("galeria-vazia");
const camadaImagens = document.getElementById("imagens-mapa");
const menuImagem = document.getElementById("menu-imagem");
const opcaoTirarImagem = document.getElementById("opcao-tirar-imagem");

const LARGURA_INICIAL = 300;
const LARGURA_MINIMA = 40;

let imagensMestre = Armazenamento.ler("imagens", []);

// Qual imagem abriu o menu do botão direito
let idImagemDoMenu = null;


// Salva a lista inteira. Se não couber no navegador, avisa e devolve false.
function salvarImagens() {
    try {
        Armazenamento.salvar("imagens", imagensMestre);
        return true;
    } catch (erro) {
        console.error(erro);
        alert("Não coube no armazenamento do navegador. Exclua alguma imagem da aba e tente de novo.");
        return false;
    }
}

function acharImagem(id) {
    return imagensMestre.find(function(imagem) {
        return imagem.id === id;
    });
}


// ----- Aba da barra lateral -----

// Mostra só as imagens que NÃO estão no mapa
function desenharGaleria() {
    galeriaImagens.innerHTML = "";

    for (const imagem of imagensMestre) {
        if (imagem.noMapa) {
            continue;
        }

        const miniatura = document.createElement("div");
        miniatura.classList.add("miniatura-imagem");
        miniatura.title = `${imagem.nome}\nArraste para o mapa`;

        // draggable: o navegador deixa "pegar" a miniatura e soltar em outro lugar
        miniatura.draggable = true;

        const foto = document.createElement("img");
        foto.src = imagem.src;
        foto.alt = imagem.nome;
        foto.draggable = false;
        miniatura.appendChild(foto);

        // Guarda a proporção (altura ÷ largura) para centralizar no "drop"
        foto.addEventListener("load", function() {
            imagem.proporcao = foto.naturalHeight / foto.naturalWidth;
        });

        miniatura.addEventListener("dragstart", function(event) {
            // Leva junto o id da imagem; o mapa lê isso no "drop"
            event.dataTransfer.setData("text/plain", imagem.id);
            event.dataTransfer.effectAllowed = "move";
        });

        // Clicar/tocar na miniatura: põe no meio do que aparece do mapa.
        // (No celular não existe arrastar e soltar, então é assim que funciona lá.)
        miniatura.addEventListener("click", function(event) {
            if (event.target === excluir) {
                return;
            }

            const tela = mapa.getBoundingClientRect();
            colocarNoMapa(imagem, tela.left + tela.width / 2, tela.top + tela.height / 2);
        });

        // × para excluir de vez
        const excluir = document.createElement("button");
        excluir.classList.add("excluir-imagem");
        excluir.textContent = "×";
        excluir.title = "Excluir imagem";

        excluir.addEventListener("click", function() {
            if (!confirm(`Excluir "${imagem.nome}"? Ela some da aba de vez.`)) {
                return;
            }

            imagensMestre = imagensMestre.filter(function(outra) {
                return outra.id !== imagem.id;
            });

            salvarImagens();
            desenharGaleria();
        });

        miniatura.appendChild(excluir);
        galeriaImagens.appendChild(miniatura);
    }

    galeriaVazia.style.display =
        galeriaImagens.children.length > 0 ? "none" : "block";
}

botaoAdicionarImagem.addEventListener("click", function() {
    arquivoImagem.click();
});

arquivoImagem.addEventListener("change", function() {

    // "multiple" no input: dá para escolher várias de uma vez
    for (const arquivo of arquivoImagem.files) {

        // 1200px: detalhe suficiente para mostrar na TV sem lotar o storage
        otimizarEEnviar(arquivo, function(imagemOtimizada) {
            imagensMestre.push({
                id: `imagem-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                nome: arquivo.name.replace(/\.[^.]+$/, ""),  // tira a extensão
                src: imagemOtimizada,
                noMapa: false,
                x: 0,
                y: 0,
                largura: LARGURA_INICIAL
            });

            // Não coube: tira de novo, para a lista bater com o que está salvo
            if (!salvarImagens()) {
                imagensMestre.pop();
            }

            desenharGaleria();
        }, 1200);
    }

    // Limpa, para conseguir escolher o mesmo arquivo de novo depois
    arquivoImagem.value = "";
});


// ----- Soltar no mapa -----

// Sem o preventDefault no "dragover", o navegador não deixa soltar ali
mapa.addEventListener("dragover", function(event) {
    event.preventDefault();
});

mapa.addEventListener("drop", function(event) {
    event.preventDefault();

    const imagem = acharImagem(event.dataTransfer.getData("text/plain"));

    if (!imagem) {
        return;
    }

    colocarNoMapa(imagem, event.clientX, event.clientY);
});

// Põe a imagem no mapa, centralizada no ponto (telaX, telaY) da tela.
function colocarNoMapa(imagem, telaX, telaY) {
    // Onde soltou, em pixels do mapa. O retângulo do conteúdo já vem
    // com o zoom e o arrasto aplicados; dividir por escala desfaz o zoom.
    const caixa = conteudoMapa.getBoundingClientRect();
    const pontoX = (telaX - caixa.left) / escala;
    const pontoY = (telaY - caixa.top) / escala;

    // Centraliza a imagem no ponto onde o mouse soltou
    const proporcao = imagem.proporcao || 1;

    imagem.largura = LARGURA_INICIAL;
    imagem.x = pontoX - LARGURA_INICIAL / 2;
    imagem.y = pontoY - (LARGURA_INICIAL * proporcao) / 2;
    imagem.noMapa = true;

    salvarImagens();
    desenharGaleria();
    desenharImagensNoMapa();

    // No celular a barra lateral cobre o mapa: fecha para ver a imagem
    if (TELA_PEQUENA) {
        barraLateral.classList.add("fechada");
    }
}


// ----- Imagens no mapa -----

function desenharImagensNoMapa() {
    camadaImagens.innerHTML = "";

    for (const imagem of imagensMestre) {
        if (imagem.noMapa) {
            camadaImagens.appendChild(criarImagemNoMapa(imagem));
        }
    }
}

function criarImagemNoMapa(imagem) {
    const caixa = document.createElement("div");
    caixa.classList.add("imagem-solta");
    caixa.style.left = `${imagem.x}px`;
    caixa.style.top = `${imagem.y}px`;
    caixa.style.width = `${imagem.largura}px`;

    const foto = document.createElement("img");
    foto.src = imagem.src;
    foto.alt = imagem.nome;
    foto.draggable = false;
    caixa.appendChild(foto);

    // Alça no canto de baixo: arrastar aumenta ou diminui
    const alca = document.createElement("div");
    alca.classList.add("alca-imagem");
    alca.title = "Arraste para aumentar ou diminuir";
    caixa.appendChild(alca);

    tornarImagemArrastavel(caixa, alca, imagem);

    caixa.addEventListener("contextmenu", function(event) {
        event.preventDefault();
        event.stopPropagation();
        abrirMenuImagem(imagem.id, event.clientX, event.clientY);
    });

    return caixa;
}

// Mover (segurando a imagem) e redimensionar (segurando a alça).
// Mesma ideia dos tokens: o movimento do mouse é dividido pela escala.
function tornarImagemArrastavel(caixa, alca, imagem) {
    let modo = null; // "mover", "redimensionar" ou null
    let ultimoX = 0;
    let ultimoY = 0;

    function comecar(event, qualModo) {
        // Não deixa o mapa ser arrastado junto
        event.stopPropagation();

        if (event.button !== 0) {
            return;
        }

        event.preventDefault();
        modo = qualModo;
        ultimoX = event.clientX;
        ultimoY = event.clientY;
        caixa.classList.add("mexendo");
    }

    caixa.addEventListener("pointerdown", function(event) {
        comecar(event, "mover");
    });

    alca.addEventListener("pointerdown", function(event) {
        comecar(event, "redimensionar");
    });

    document.addEventListener("pointermove", function(event) {
        if (!modo) {
            return;
        }

        const movimentoX = (event.clientX - ultimoX) / escala;
        const movimentoY = (event.clientY - ultimoY) / escala;

        ultimoX = event.clientX;
        ultimoY = event.clientY;

        if (modo === "mover") {
            imagem.x += movimentoX;
            imagem.y += movimentoY;
            caixa.style.left = `${imagem.x}px`;
            caixa.style.top = `${imagem.y}px`;
        } else {
            // Só a largura muda; a altura acompanha (height: auto no CSS)
            imagem.largura = Math.max(LARGURA_MINIMA, imagem.largura + movimentoX);
            caixa.style.width = `${imagem.largura}px`;
        }
    });

    document.addEventListener("pointerup", function() {
        if (!modo) {
            return;
        }

        modo = null;
        caixa.classList.remove("mexendo");

        // Salva só no fim, e não a cada pixel: mais leve para a outra tela
        salvarImagens();
    });
}


// ----- Menu do botão direito -----

function abrirMenuImagem(id, x, y) {
    // Se o menu dos tokens estiver aberto, fecha
    fecharMenuContexto();

    idImagemDoMenu = id;
    menuImagem.style.display = "block";
    posicionarNaTela(menuImagem, x, y);
}

function fecharMenuImagem() {
    menuImagem.style.display = "none";
    idImagemDoMenu = null;
}

opcaoTirarImagem.addEventListener("click", function() {
    const imagem = acharImagem(idImagemDoMenu);

    if (imagem) {
        imagem.noMapa = false;
        salvarImagens();
        desenharImagensNoMapa();
        desenharGaleria();
    }

    fecharMenuImagem();
});

document.addEventListener("pointerdown", function(event) {
    if (!menuImagem.contains(event.target)) {
        fecharMenuImagem();
    }
}, true);

document.addEventListener("keydown", function(event) {
    if (event.key === "Escape") {
        fecharMenuImagem();
    }
});


desenharGaleria();
desenharImagensNoMapa();
