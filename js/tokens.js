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
//  - aliado morrendo ganha um contador vermelho pulsando (☠ 3)
//  - aliado morto fica cinza, com uma caveira
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

    boneco.classList.toggle("morto", Boolean(personagem.morto));
    boneco.classList.toggle("morrendo", Boolean(personagem.morrendo));

    // Contador de rodadas de quem está morrendo
    const contadorAntigo = boneco.querySelector(".contador-morrendo");

    if (contadorAntigo) {
        contadorAntigo.remove();
    }

    if (personagem.morrendo) {
        const contador = document.createElement("div");
        contador.classList.add("contador-morrendo");
        contador.textContent = `☠ ${personagem.morrendo.rodadas}`;
        contador.title = `Morrendo: ${personagem.morrendo.rodadas} rodada(s) para salvar`;
        boneco.appendChild(contador);
    }

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


// Efeito de cura: um brilho verde e "faíscas" que sobem do token.
// "quantidade" é quanto curou (ex.: 8 mostra "+8"). Se vier vazio,
// aparecem só as faíscas (a visão dos jogadores usa assim).
function efeitoCura(boneco, quantidade) {
    if (!boneco) {
        return;
    }

    const efeito = document.createElement("div");
    efeito.classList.add("efeito-cura");

    const simbolos = ["✦", "✧", "+", "✦", "•"];

    for (let i = 0; i < 14; i++) {
        const particula = document.createElement("span");
        particula.classList.add("particula-cura");
        particula.textContent = simbolos[i % simbolos.length];

        // Cada faísca sai de um lugar, com tamanho, tempo e desvio
        // diferentes. Math.random() sorteia um número entre 0 e 1.
        particula.style.left = `${10 + Math.random() * 80}%`;
        particula.style.setProperty("--tamanho", `${10 + Math.random() * 12}px`);
        particula.style.setProperty("--atraso", `${Math.random() * 0.5}s`);
        particula.style.setProperty("--duracao", `${0.9 + Math.random() * 0.7}s`);
        particula.style.setProperty("--desvio", `${(Math.random() - 0.5) * 40}px`);

        efeito.appendChild(particula);
    }

    if (quantidade) {
        const numero = document.createElement("span");
        numero.classList.add("numero-cura");
        numero.textContent = `+${quantidade}`;
        efeito.appendChild(numero);
    }

    boneco.appendChild(efeito);

    // Some sozinho quando as animações acabam
    setTimeout(function() {
        efeito.remove();
    }, 2200);
}


// Deixa o token com a aparência certa: a imagem do personagem,
// ou um disco com a inicial do nome quando não há imagem.
// Token que JÁ está no mapa mudou de nome ou de imagem (✎ da barra
// lateral): apaga a aparência antiga e monta de novo, sem tirar do lugar.
function trocarAparenciaToken(boneco, personagem) {
    boneco.classList.remove("imagem-personagem", "token-inimigo");
    boneco.style.backgroundImage = "";

    // Limpa a letra (e o contador/ícones, que atualizarEstadoToken recoloca)
    boneco.textContent = "";

    const tipo = personagem.tipo || "player";

    aplicarVisualToken(
        boneco,
        personagem,
        tipo,
        tamanhoEmPixels(personagem.tamanho),
        personagem.nome.charAt(0).toUpperCase()
    );

    atualizarEstadoToken(boneco, personagem);
}

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
