// Enfeites de Natal: pisca-pisca, neve e gorro no "RPG" do título.
// Tudo é criado aqui e o CSS só vale com a classe "natal" no <html>.
// Para tirar depois do Natal: é só apagar a linha deste script nas páginas.

document.documentElement.classList.add("natal");


// ----- Pisca-pisca -----
// Um fio em "ondas" (SVG) com lâmpadas penduradas nos pontos do fio.
// Fica embaixo do cabeçalho; nas páginas sem cabeçalho, no topo da tela.
const CORES_LAMPADAS = ["vermelha", "verde", "dourada", "azul"];
const LARGURA_ONDA = 140;      // largura de cada "barriga" do fio, em pixels
const ALTURA_ONDA = 16;        // quanto o fio cai no meio de cada barriga
const LAMPADAS_POR_ONDA = 3;

const piscaPisca = document.createElement("div");
piscaPisca.className = "pisca-pisca";
piscaPisca.setAttribute("aria-hidden", "true");   // leitor de tela ignora

function montarPiscaPisca() {
    const largura = window.innerWidth;

    // Janela ainda sem tamanho (ex.: aberta escondida): espera o "resize"
    // de quando ela aparecer, lá embaixo
    if (!largura) {
        return;
    }
    const ondas = Math.max(2, Math.round(largura / LARGURA_ONDA));
    const passo = largura / ondas;

    // Cada onda é uma curva "Q": começa em cima, desce até ALTURA_ONDA no
    // meio e volta. Numa curva assim, o ponto do meio fica na metade da
    // altura do ponto de controle, por isso o controle vai a 2 × ALTURA.
    let caminho = "M 0 2";

    for (let i = 0; i < ondas; i++) {
        const meio = passo * i + passo / 2;
        caminho += ` Q ${meio} ${2 + ALTURA_ONDA * 2} ${passo * (i + 1)} 2`;
    }

    piscaPisca.innerHTML = `
        <svg class="fio" width="${largura}" height="${ALTURA_ONDA + 6}">
            <path d="${caminho}"></path>
        </svg>
    `;

    // Lâmpadas: algumas por onda, espalhadas pela curva
    let numero = 0;

    for (let i = 0; i < ondas; i++) {
        for (let j = 1; j <= LAMPADAS_POR_ONDA; j++) {
            // t vai de 0 a 1 ao longo da onda (0 = começo, 1 = fim)
            const t = j / (LAMPADAS_POR_ONDA + 1);

            // Fórmula da curva Q: altura = 2 + 2 × ALTURA × 2t(1 − t)
            const x = passo * (i + t);
            const y = 2 + ALTURA_ONDA * 2 * 2 * t * (1 - t);

            const lampada = document.createElement("span");
            lampada.className = `lampada ${CORES_LAMPADAS[numero % CORES_LAMPADAS.length]}`;
            lampada.style.left = `${x}px`;
            lampada.style.top = `${y}px`;

            // Metade pisca num tempo e metade no outro, que nem pisca-pisca
            // de verdade. Um atraso pequeno sorteado deixa menos "robótico".
            if (numero % 2 === 1) {
                lampada.classList.add("par");
            }
            lampada.style.animationDelay = `${(Math.random() * 0.3).toFixed(2)}s`;

            piscaPisca.appendChild(lampada);
            numero++;
        }
    }
}

// Logo embaixo do cabeçalho (se a página tiver um)
function posicionarPiscaPisca() {
    const cabecalho = document.querySelector("body > header, main > header");
    // offsetTop + offsetHeight (e não getBoundingClientRect): o cabeçalho
    // entra na tela com uma animação, e no meio dela a posição "na tela"
    // ainda está errada. O offset ignora a animação.
    piscaPisca.style.top = cabecalho
        ? `${cabecalho.offsetTop + cabecalho.offsetHeight - 2}px`
        : "0px";
}


// ----- Neve -----
// Poucos flocos, caindo devagar: enfeita sem atrapalhar o mapa.
const neve = document.createElement("div");
neve.className = "neve";
neve.setAttribute("aria-hidden", "true");

for (let i = 0; i < 18; i++) {
    const floco = document.createElement("span");
    floco.className = "floco";
    floco.textContent = i % 3 === 0 ? "❄" : "•";

    // Cada floco cai num lugar, com tamanho, velocidade e balanço diferentes
    floco.style.left = `${Math.random() * 100}%`;
    floco.style.setProperty("--tamanho", `${8 + Math.random() * 10}px`);
    floco.style.setProperty("--duracao", `${10 + Math.random() * 12}s`);
    floco.style.setProperty("--balanco", `${(Math.random() - 0.5) * 80}px`);

    // Atraso negativo: o floco já começa no meio da queda, então a neve
    // aparece espalhada pela tela desde o começo
    floco.style.animationDelay = `-${(Math.random() * 20).toFixed(1)}s`;

    neve.appendChild(floco);
}


// ----- Liga tudo -----
// Na Visão dos Jogadores, tudo fica dentro do #mapa-jogadores (que é
// "fixed" e por isso uma camada própria). Assim as janelas e fichas dos
// jogadores ficam POR CIMA da neve e das luzes, e não embaixo.
const raizNatal = document.getElementById("mapa-jogadores") || document.body;
raizNatal.append(neve, piscaPisca);
montarPiscaPisca();
posicionarPiscaPisca();

// Mudou o tamanho da janela (ou girou o celular): monta o fio de novo.
// O "relógio" espera parar de mexer, para não remontar 100 vezes.
let relogioNatal = null;

window.addEventListener("resize", function() {
    clearTimeout(relogioNatal);
    relogioNatal = setTimeout(function() {
        montarPiscaPisca();
        posicionarPiscaPisca();
    }, 150);
});
