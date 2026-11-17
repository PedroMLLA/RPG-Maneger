// Funções dos tokens usadas por mais de uma página
// (mapa.html, a tela do mestre, e jogador.html, a visão dos jogadores).

// Converte o tamanho escolhido no Mestre em pixels.
function tamanhoEmPixels(tamanho) {
    const tamanhos = {
        "pequeno": 60,
        "medio": 80,
        "grande": 120,
        "muito-grande": 200,
        "enorme": 300
    };

    return tamanhos[tamanho];
}

// Condições que podem ser colocadas nos tokens (aliados e inimigos).
const CONDICOES = [
    { chave: "envenenado",  icone: "🧪", nome: "Envenenado" },
    { chave: "sangrando",   icone: "🩸", nome: "Sangrando" },
    { chave: "queimando",   icone: "🔥", nome: "Queimando" },
    { chave: "atordoado",   icone: "💫", nome: "Atordoado" },
    { chave: "caido",       icone: "⬇️", nome: "Caído" },
    { chave: "amedrontado", icone: "😱", nome: "Amedrontado" },
    { chave: "invisivel",   icone: "👻", nome: "Invisível" },
    { chave: "protegido",   icone: "🛡️", nome: "Protegido" }
];


// Atualiza o que muda durante a batalha num token já desenhado:
//  - inimigo com vida zerada fica "derrotado" (escuro, com um X)
//  - os ícones das condições aparecem embaixo do token
// Usada pela tela do mestre e pela visão dos jogadores.
function atualizarEstadoToken(boneco, personagem) {
    if (!boneco || !personagem) {
        return;
    }

    boneco.classList.toggle(
        "derrotado",
        personagem.tipo === "inimigo" && personagem.hp <= 0
    );

    // Tira a faixa de ícones antiga (se houver) e monta de novo
    const faixaAntiga = boneco.querySelector(".condicoes-token");

    if (faixaAntiga) {
        faixaAntiga.remove();
    }

    const condicoes = personagem.condicoes || [];

    if (condicoes.length === 0) {
        return;
    }

    const faixa = document.createElement("div");
    faixa.classList.add("condicoes-token");

    for (const chave of condicoes) {
        // .find() devolve o primeiro item da lista que passa no teste
        const condicao = CONDICOES.find(function(c) {
            return c.chave === chave;
        });

        if (!condicao) {
            continue;
        }

        const icone = document.createElement("span");
        icone.textContent = condicao.icone;
        icone.title = condicao.nome;
        faixa.appendChild(icone);
    }

    boneco.appendChild(faixa);
}


// Deixa o token com a aparência certa: a imagem do personagem,
// ou um disco com a inicial do nome quando não há imagem.
function aplicarVisualToken(boneco, personagem, tipo, tamanho, letra) {

    boneco.classList.add("boneco");

    if (tipo === "inimigo" && tamanho) {
        boneco.style.width = `${tamanho}px`;
        boneco.style.height = `${tamanho}px`;
    }

    if (personagem && personagem.imagem) {

        boneco.classList.add("imagem-personagem");
        boneco.style.backgroundImage = `url('${personagem.imagem}')`;

    } else {

        boneco.textContent = letra;

        if (tipo === "inimigo") {
            boneco.classList.add("token-inimigo");
        }
    }
}
