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

    // Limpa a letra (e o contador/ícones, que atualizarEstadoToken
    // recoloca). Só o campo de visão fica: ele tem a alça do mestre.
    for (const filho of [...boneco.childNodes]) {
        if (!(filho.classList && filho.classList.contains("campo-visao"))) {
            filho.remove();
        }
    }

    const tipo = personagem.tipo || "player";

    aplicarVisualToken(
        boneco,
        personagem,
        tipo,
        tamanhoEmPixels(personagem.tamanho),
        personagem.nome.charAt(0).toUpperCase()
    );

    atualizarEstadoToken(boneco, personagem);

    // Trocou de imagem? O token pode ter mudado de tamanho: o cone se ajusta
    if (boneco.dataset.visao !== undefined) {
        definirCampoVisao(boneco, Number(boneco.dataset.visao));
    }
}

function aplicarVisualToken(boneco, personagem, tipo, tamanho, letra) {

    boneco.classList.add("boneco");

    // Para o CSS pintar o cone do inimigo de vermelho
    boneco.dataset.tipo = tipo;

    if (tipo === "inimigo" && tamanho) {
        boneco.style.width = `${tamanho}px`;
        boneco.style.height = `${tamanho}px`;
    }

    if (personagem && personagem.imagem) {

        boneco.classList.add("imagem-personagem");
        boneco.style.backgroundImage = `url('${personagem.imagem}')`;

    } else {

        // prepend (e não textContent): textContent apagaria o cone
        boneco.prepend(letra);

        if (tipo === "inimigo") {
            boneco.classList.add("token-inimigo");
        }
    }
}


// ----- Campo de visão -----
// Um cone na frente do token mostrando para onde ele olha. A imagem do
// token fica sempre em pé: só o cone gira em volta dela.
// O ângulo é em graus: 0 = direita, 90 = baixo, 180 = esquerda, -90 = cima
// (no navegador o "y" cresce para baixo, por isso 90 é baixo).
const ABERTURA_VISAO = 90;    // largura do cone, em graus
const ALCANCE_VISAO = 200;    // até onde vai, em pixels, depois da borda do token

// Cada cone tem o próprio degradê, e o id dele precisa ser único na página
let contadorCones = 0;

// angulo = número: liga (ou gira) o cone. null/undefined: desliga.
// Devolve a caixa do cone (o mestre põe a alça de girar nela).
function definirCampoVisao(boneco, angulo) {
    let campo = boneco.querySelector(".campo-visao");

    if (angulo === null || angulo === undefined) {
        if (campo) {
            campo.remove();
        }
        delete boneco.dataset.visao;
        return null;
    }

    if (!campo) {
        contadorCones++;

        campo = document.createElement("div");
        campo.classList.add("campo-visao");

        // currentColor = a cor de texto do .campo-visao (veja o CSS)
        campo.innerHTML = `
            <svg>
                <defs>
                    <radialGradient id="cone-${contadorCones}" gradientUnits="userSpaceOnUse" cx="0" cy="0">
                        <stop class="cone-inicio" stop-color="currentColor" stop-opacity="0.6"></stop>
                        <stop offset="1" stop-color="currentColor" stop-opacity="0"></stop>
                    </radialGradient>
                </defs>
                <path fill="url(#cone-${contadorCones})" stroke="currentColor" stroke-opacity="0.9" stroke-width="2"></path>
            </svg>
        `;

        boneco.appendChild(campo);
    }

    // O token pode ainda não estar na tela (offsetWidth 0): usa o tamanho do CSS
    const tamanho = boneco.offsetWidth ||
        parseFloat(boneco.style.width) ||
        (boneco.classList.contains("imagem-personagem") ? 80 : 44);

    desenharCone(campo, tamanho);

    boneco.dataset.visao = angulo;
    campo.style.transform = `rotate(${angulo}deg)`;

    return campo;
}

// Desenha o cone apontando para a direita (0°); quem gira é a caixa.
// É um "pedaço de rosca": começa na borda do token, para não cobrir a imagem.
function desenharCone(campo, tamanho) {
    const dentro = tamanho / 2 + 4;
    const fora = tamanho / 2 + ALCANCE_VISAO;
    const meio = (ABERTURA_VISAO / 2) * Math.PI / 180;   // graus → radianos

    // Ponto a uma distância "raio", na direção "angulo" (seno e cosseno)
    function ponto(raio, angulo) {
        return `${(raio * Math.cos(angulo)).toFixed(1)} ${(raio * Math.sin(angulo)).toFixed(1)}`;
    }

    // M = vai até, L = linha, A = arco, Z = fecha
    const caminho = [
        `M ${ponto(dentro, -meio)}`,
        `L ${ponto(fora, -meio)}`,
        `A ${fora} ${fora} 0 0 1 ${ponto(fora, meio)}`,
        `L ${ponto(dentro, meio)}`,
        `A ${dentro} ${dentro} 0 0 0 ${ponto(dentro, -meio)}`,
        "Z"
    ].join(" ");

    const svg = campo.querySelector("svg");
    svg.setAttribute("viewBox", `${-fora} ${-fora} ${fora * 2} ${fora * 2}`);
    svg.setAttribute("width", fora * 2);
    svg.setAttribute("height", fora * 2);
    svg.style.left = `${-fora}px`;
    svg.style.top = `${-fora}px`;

    campo.querySelector("path").setAttribute("d", caminho);
    campo.querySelector("radialGradient").setAttribute("r", fora);
    campo.querySelector(".cone-inicio").setAttribute("offset", dentro / fora);

    // A alça do mestre fica na ponta do cone
    campo.style.setProperty("--alcance", `${fora}px`);
}
