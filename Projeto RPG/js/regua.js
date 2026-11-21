// Régua: mede distâncias no mapa.
// 50 pixels do mapa = 1 quadrado = 1,5 metro.
// Os eventos do mouse ficam em mapa.js, que chama as funções daqui.

const botaoRegua = document.getElementById("botao-regua");
const gradeMapa = document.getElementById("grade-mapa");
const regua = document.getElementById("regua");
const distanciaRegua = document.getElementById("distancia-regua");

let modoRegua = false;
let medindo = false;
let inicioReguaX = 0;
let inicioReguaY = 0;

botaoRegua.addEventListener("click", function() {
    modoRegua = !modoRegua;

    // Em vez de mudar o texto, o botão fica "aceso" (classe .ativo)
    botaoRegua.classList.toggle("ativo", modoRegua);

    if (modoRegua) {
        mapa.style.cursor = "crosshair";
        gradeMapa.style.display = "block";
    } else {
        mapa.style.cursor = "default";
        gradeMapa.style.display = "none";

        regua.style.display = "none";
        distanciaRegua.style.display = "none";
    }
});

function comecarMedicao(event) {
    medindo = true;

    const areaMapa = mapa.getBoundingClientRect();

    inicioReguaX = event.clientX - areaMapa.left;
    inicioReguaY = event.clientY - areaMapa.top;

    regua.style.display = "block";
    distanciaRegua.style.display = "block";

    distanciaRegua.textContent = "0 m";
}

function continuarMedicao(event) {
    const areaMapa = mapa.getBoundingClientRect();

    const atualX = event.clientX - areaMapa.left;
    const atualY = event.clientY - areaMapa.top;

    const deltaX = atualX - inicioReguaX;
    const deltaY = atualY - inicioReguaY;

    const distancia = Math.sqrt(
        deltaX * deltaX + deltaY * deltaY
    );

    // "distancia" está em pixels da tela. A grade de 50px fica DENTRO
    // do mapa ampliado, então convertemos para pixels do mapa antes.
    const distanciaNoMapa = distancia / escala;

    const distanciaQuadrados = distanciaNoMapa / 50;
    const distanciaMetros = distanciaQuadrados * 1.5;

    const angulo = Math.atan2(deltaY, deltaX);

    regua.style.left = `${inicioReguaX}px`;
    regua.style.top = `${inicioReguaY}px`;
    regua.style.width = `${distancia}px`;
    regua.style.transform = `rotate(${angulo}rad)`;

    distanciaRegua.textContent =
        `${distanciaMetros.toFixed(1)} m`;

    distanciaRegua.style.left = `${atualX + 10}px`;
    distanciaRegua.style.top = `${atualY + 10}px`;
}

function terminarMedicao() {
    medindo = false;
    distanciaRegua.style.display = "block";
}
