// Ficha do personagem: a roda de atributos em hexágonos.
// Usado pela tela do mestre (editável) e pela visão dos jogadores (só leitura).

// O desenho tem 600 x 540 "unidades". O SVG estica isso para o tamanho
// da tela, então todas as posições abaixo são nessa escala.
const LARGURA_RODA = 600;
const ALTURA_RODA = 540;
const CENTRO_X = 300;
const CENTRO_Y = 270;
const RAIO_HEX = 72;

// Os 6 atributos, em sentido horário, começando no de cima à esquerda.
// x e y são o centro de cada hexágono.
const ATRIBUTOS = [
    { chave: "str", sigla: "STR", nome: "Força",        x: 197.5, y: 92.5 },
    { chave: "res", sigla: "RES", nome: "Resistência",  x: 402.5, y: 92.5 },
    { chave: "dex", sigla: "DEX", nome: "Destreza",     x: 505,   y: 270 },
    { chave: "pre", sigla: "PRE", nome: "Presença",     x: 402.5, y: 447.5 },
    { chave: "int", sigla: "INT", nome: "Inteligência", x: 197.5, y: 447.5 },
    { chave: "aim", sigla: "AIM", nome: "Mira",         x: 95,    y: 270 }
];


// Mostra o bônus sempre com sinal: 4 vira "+4", -2 continua "-2".
function formatarBonus(numero) {
    if (numero >= 0) {
        return `+${numero}`;
    }

    return `${numero}`;
}


// Calcula os 6 cantos de um hexágono "deitado" (lado reto em cima),
// no formato que o <polygon> do SVG entende: "x1,y1 x2,y2 ...".
function pontosHexagono(cx, cy, raio) {
    const pontos = [];

    for (let i = 0; i < 6; i++) {
        // Um canto a cada 60 graus (Math.PI / 3 = 60° em radianos)
        const angulo = (Math.PI / 3) * i;

        const x = cx + raio * Math.cos(angulo);
        const y = cy + raio * Math.sin(angulo);

        pontos.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }

    return pontos.join(" ");
}


// Monta o desenho completo da roda como texto SVG.
function desenhoRodaSVG() {

    // 1) Raios de luz saindo do centro (triângulos finos e transparentes)
    const angulosDosRaios = [5, 28, 47, 70, 96, 118, 141, 163, 187, 205, 232, 251, 274, 297, 318, 340];
    let raios = "";

    angulosDosRaios.forEach(function(graus, i) {
        const comprimento = i % 2 === 0 ? 290 : 210;
        const abertura = i % 3 === 0 ? 6 : 3;

        const a1 = (graus - abertura) * Math.PI / 180;
        const a2 = (graus + abertura) * Math.PI / 180;

        const x1 = CENTRO_X + comprimento * Math.cos(a1);
        const y1 = CENTRO_Y + comprimento * Math.sin(a1);
        const x2 = CENTRO_X + comprimento * Math.cos(a2);
        const y2 = CENTRO_Y + comprimento * Math.sin(a2);

        raios += `<polygon class="raio-luz" points="${CENTRO_X},${CENTRO_Y} ${x1.toFixed(1)},${y1.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}"/>`;
    });

    // 2) Linhas duplas tracejadas ligando cada hexágono ao próximo
    let conexoes = "";

    for (let i = 0; i < ATRIBUTOS.length; i++) {
        const a = ATRIBUTOS[i];
        const b = ATRIBUTOS[(i + 1) % ATRIBUTOS.length]; // o último liga no primeiro

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distancia = Math.hypot(dx, dy);

        // Direção da linha (ux, uy) e a direção perpendicular (px, py)
        const ux = dx / distancia;
        const uy = dy / distancia;
        const px = -uy;
        const py = ux;

        // A linha começa e termina na borda dos hexágonos, não no centro
        const recuo = RAIO_HEX * 0.95;

        for (const afastamento of [-4, 4]) {
            const x1 = a.x + ux * recuo + px * afastamento;
            const y1 = a.y + uy * recuo + py * afastamento;
            const x2 = b.x - ux * recuo + px * afastamento;
            const y2 = b.y - uy * recuo + py * afastamento;

            conexoes += `<line class="conexao-hex" x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`;
        }
    }

    // 3) Os hexágonos: sombra, moldura prateada, miolo e a etiqueta (STR...)
    let hexagonos = "";

    for (const atributo of ATRIBUTOS) {
        // A borda de baixo do hexágono fica a "raio × 0,866" do centro
        const baseY = atributo.y + RAIO_HEX * 0.866;

        hexagonos += `
            <polygon class="hex-sombra" points="${pontosHexagono(atributo.x, atributo.y, RAIO_HEX + 5)}"/>
            <polygon class="hex-moldura" points="${pontosHexagono(atributo.x, atributo.y, RAIO_HEX)}"/>
            <polygon class="hex-miolo" points="${pontosHexagono(atributo.x, atributo.y, RAIO_HEX - 8)}"/>
            <rect class="hex-etiqueta-fundo" x="${atributo.x - 36}" y="${baseY - 13}" width="72" height="26" rx="3"/>
            <text class="hex-etiqueta" x="${atributo.x}" y="${baseY + 6}">${atributo.sigla}</text>
        `;
    }

    return `
        <svg class="desenho-roda" viewBox="0 0 ${LARGURA_RODA} ${ALTURA_RODA}" aria-hidden="true">
            <defs>
                <radialGradient id="brilho-centro-roda">
                    <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95"/>
                    <stop offset="22%" stop-color="#eef1f6" stop-opacity="0.65"/>
                    <stop offset="55%" stop-color="#c3c9d4" stop-opacity="0.18"/>
                    <stop offset="100%" stop-color="#c3c9d4" stop-opacity="0"/>
                </radialGradient>
                <!-- Os raios vão sumindo conforme se afastam do centro -->
                <radialGradient id="raio-gradiente" gradientUnits="userSpaceOnUse" cx="${CENTRO_X}" cy="${CENTRO_Y}" r="280">
                    <stop offset="0%" stop-color="#ffffff" stop-opacity="0.6"/>
                    <stop offset="60%" stop-color="#e6eaf1" stop-opacity="0.18"/>
                    <stop offset="100%" stop-color="#e6eaf1" stop-opacity="0"/>
                </radialGradient>
                <linearGradient id="metal-hex" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#f4f4f4"/>
                    <stop offset="45%" stop-color="#9c9c9c"/>
                    <stop offset="70%" stop-color="#e2e2e2"/>
                    <stop offset="100%" stop-color="#6e6e6e"/>
                </linearGradient>
            </defs>

            <circle cx="${CENTRO_X}" cy="${CENTRO_Y}" r="300" fill="url(#brilho-centro-roda)"/>
            <g class="raios-girando">${raios}</g>
            ${conexoes}
            ${hexagonos}
        </svg>
    `;
}


// Cria a roda pronta para colocar na página.
//  - atributos: objeto tipo { str: 3, dex: 2, ... }
//  - editavel: true na tela do mestre (campos de número),
//              false na visão dos jogadores (só o número)
// Quando é editável, mudar um campo altera direto o objeto "atributos".
function criarRodaAtributos(atributos, editavel) {

    const roda = document.createElement("div");
    roda.classList.add("roda-atributos");
    roda.innerHTML = desenhoRodaSVG();

    for (const atributo of ATRIBUTOS) {
        const valor = atributos[atributo.chave] || 0;

        let campo;

        if (editavel) {
            campo = document.createElement("input");
            campo.type = "number";
            campo.value = valor;

            campo.addEventListener("input", function() {
                atributos[atributo.chave] = Number(campo.value) || 0;
            });
        } else {
            campo = document.createElement("span");
            campo.textContent = valor;
        }

        campo.classList.add("valor-atributo");
        campo.title = atributo.nome;

        // Posição em porcentagem: assim acompanha o tamanho do desenho
        campo.style.left = `${(atributo.x / LARGURA_RODA) * 100}%`;
        campo.style.top = `${(atributo.y / ALTURA_RODA) * 100}%`;

        roda.appendChild(campo);
    }

    return roda;
}
