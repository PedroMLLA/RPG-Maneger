// Página de escolher campanha: as campanhas ficam numa roda.
// Passar o mouse faz a campanha crescer e mostrar o nome;
// clicar escolhe a campanha e abre o mapa.
//
// localStorage:
//   "campanhas"     → [ { id, nome, imagem }, ... ]
//   "campanhaAtual" → id da campanha escolhida

const rodaCampanhas = document.getElementById("roda-campanhas");
const nomeEmDestaque = document.getElementById("nome-em-destaque");
const botaoNovaCampanha = document.getElementById("botao-nova-campanha");

const janelaCampanha = document.getElementById("janela-campanha");
const campoNomeCampanha = document.getElementById("nome-campanha");
const campoImagemCampanha = document.getElementById("imagem-campanha");
const previaCampanha = document.getElementById("previa-campanha");
const textoImagemCampanha = document.getElementById("texto-imagem-campanha");
const botaoCancelarCampanha = document.getElementById("botao-cancelar-campanha");
const botaoCriarCampanha = document.getElementById("botao-criar-campanha");

const TEXTO_PADRAO = "Passe o mouse em uma campanha";
const TAMANHO_CAMPANHA = 130; // largura de cada círculo, igual ao CSS

// Na primeira vez, já vêm duas campanhas com os mapas do projeto
const CAMPANHAS_PADRAO = [
    { id: "kotto", nome: "Kotto", imagem: "mapas/kotto.jfif" },
    { id: "demetria", nome: "Demetria", imagem: "mapas/demetria.jfif" }
];

let campanhas = JSON.parse(localStorage.getItem("campanhas")) || CAMPANHAS_PADRAO;

// Imagem escolhida na janela de nova campanha (já otimizada)
let imagemNova = null;


function salvarCampanhas() {
    try {
        localStorage.setItem("campanhas", JSON.stringify(campanhas));
        return true;
    } catch (erro) {
        console.error(erro);
        alert("Não coube no armazenamento do navegador. Tente uma imagem menor.");
        return false;
    }
}


// ----- A roda -----

function desenharRoda() {
    // Tira as campanhas antigas (o anel e o botão do meio ficam)
    rodaCampanhas.querySelectorAll(".campanha-roda").forEach(function(item) {
        item.remove();
    });

    const quantidade = campanhas.length;

    // Quanto mais campanhas, maior a roda, para elas não se encostarem.
    // A volta da roda (2 × π × raio) precisa caber todos os círculos.
    const raio = Math.max(185, (quantidade * TAMANHO_CAMPANHA * 1.25) / (2 * Math.PI));
    const tamanho = raio * 2 + TAMANHO_CAMPANHA;

    rodaCampanhas.style.setProperty("--tamanho-roda", `${tamanho}px`);

    campanhas.forEach(function(campanha, indice) {

        // Ângulo de cada campanha: dividimos a volta (2π) em partes iguais.
        // O "- π/2" faz a primeira começar no topo, e não à direita.
        const angulo = (indice / quantidade) * 2 * Math.PI - Math.PI / 2;

        // Seno e cosseno dão a posição num círculo de raio 1;
        // multiplicando pelo raio, a roda fica do tamanho certo.
        // Usamos % para a roda encolher junto em telas pequenas.
        const centroX = 50 + (Math.cos(angulo) * raio / tamanho) * 100;
        const centroY = 50 + (Math.sin(angulo) * raio / tamanho) * 100;
        const metade = (TAMANHO_CAMPANHA / 2 / tamanho) * 100;

        const item = criarItemCampanha(campanha);
        item.style.left = `${centroX - metade}%`;
        item.style.top = `${centroY - metade}%`;

        // Entram uma depois da outra
        item.style.setProperty("--atraso", `${indice * 0.07}s`);

        rodaCampanhas.appendChild(item);
    });
}

function criarItemCampanha(campanha) {
    const item = document.createElement("button");
    item.classList.add("campanha-roda");
    item.setAttribute("aria-label", `Jogar ${campanha.nome}`);

    const foto = document.createElement("div");
    foto.classList.add("foto-campanha");

    if (campanha.imagem) {
        const imagem = document.createElement("img");
        imagem.src = campanha.imagem;
        imagem.alt = "";
        foto.appendChild(imagem);
    } else {
        // Sem imagem: a inicial do nome, como nos tokens
        foto.textContent = campanha.nome.charAt(0).toUpperCase();
    }

    const nome = document.createElement("span");
    nome.classList.add("nome-campanha", "adesivo");
    nome.textContent = campanha.nome;

    const excluir = document.createElement("span");
    // É um <span>, não um <button>: botão dentro de botão não vale no HTML
    excluir.classList.add("excluir-campanha");
    excluir.textContent = "×";
    excluir.title = "Excluir campanha";

    item.append(foto, nome, excluir);

    item.addEventListener("mouseenter", function() {
        nomeEmDestaque.textContent = campanha.nome;
    });

    item.addEventListener("mouseleave", function() {
        nomeEmDestaque.textContent = TEXTO_PADRAO;
    });

    item.addEventListener("click", function(event) {

        // Clicou no ×: exclui em vez de entrar
        if (event.target === excluir) {
            excluirCampanha(campanha);
            return;
        }

        escolherCampanha(campanha);
    });

    return item;
}

function escolherCampanha(campanha) {
    localStorage.setItem("campanhaAtual", campanha.id);
    window.location.href = "mapa.html";
}

function excluirCampanha(campanha) {
    if (!confirm(`Excluir a campanha "${campanha.nome}"?\n\nO mapa, os personagens e a batalha dela serão apagados.`)) {
        return;
    }

    campanhas = campanhas.filter(function(outra) {
        return outra.id !== campanha.id;
    });

    // Apaga os dados guardados dessa campanha (campanha-atual.js)
    for (const nome of DADOS_DA_CAMPANHA) {
        localStorage.removeItem(chave(nome, campanha.id));
    }

    // Se era a campanha escolhida, ninguém fica escolhido
    if (localStorage.getItem("campanhaAtual") === campanha.id) {
        localStorage.removeItem("campanhaAtual");
    }

    salvarCampanhas();
    nomeEmDestaque.textContent = TEXTO_PADRAO;
    desenharRoda();
}


// ----- Janela de nova campanha -----

function abrirJanelaCampanha() {
    campoNomeCampanha.value = "";
    campoImagemCampanha.value = "";
    imagemNova = null;
    previaCampanha.hidden = true;
    textoImagemCampanha.hidden = false;

    janelaCampanha.style.display = "flex";
    campoNomeCampanha.focus();
}

function fecharJanelaCampanha() {
    janelaCampanha.style.display = "none";
}

botaoNovaCampanha.addEventListener("click", abrirJanelaCampanha);
botaoCancelarCampanha.addEventListener("click", fecharJanelaCampanha);

// Clicar no fundo escuro também fecha
janelaCampanha.addEventListener("click", function(event) {
    if (event.target === janelaCampanha) {
        fecharJanelaCampanha();
    }
});

document.addEventListener("keydown", function(event) {
    if (event.key === "Escape") {
        fecharJanelaCampanha();
    }
});

campoImagemCampanha.addEventListener("change", function() {
    const arquivo = campoImagemCampanha.files[0];

    if (!arquivo) {
        return;
    }

    // A imagem aparece num círculo pequeno, então 500px já sobra
    otimizarImagem(arquivo, function(imagemOtimizada) {
        imagemNova = imagemOtimizada;
        previaCampanha.src = imagemOtimizada;
        previaCampanha.hidden = false;
        textoImagemCampanha.hidden = true;
    });
});

function criarCampanha() {
    const nome = campoNomeCampanha.value.trim();

    if (!nome) {
        alert("Dê um nome para a campanha.");
        campoNomeCampanha.focus();
        return;
    }

    campanhas.push({
        id: `campanha-${Date.now()}`,
        nome: nome,
        imagem: imagemNova
    });

    // Não coube: tira de novo, para a lista bater com o que está salvo
    if (!salvarCampanhas()) {
        campanhas.pop();
        return;
    }

    fecharJanelaCampanha();
    desenharRoda();
}

botaoCriarCampanha.addEventListener("click", criarCampanha);

// Enter no campo do nome também cria
campoNomeCampanha.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        criarCampanha();
    }
});


salvarCampanhas();
desenharRoda();
