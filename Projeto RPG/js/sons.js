// Efeitos sonoros. Usado pela tela do mestre e pelo Painel do Mestre.
// O som toca só na janela onde o mestre aplicou o dano, para não tocar
// duas vezes quando o mapa e a visão dos jogadores estão no mesmo PC.
//
// Os arquivos .wav foram "normalizados": o volume deles foi aumentado
// até perto do máximo sem distorcer (o dano ganhou +15 dB e a morte +10 dB).
// Por isso aqui o volume já pode ficar em 1 (100%).

// "new Audio(caminho)" carrega o arquivo de som, pronto para tocar
const somDano = new Audio("sons/dano.wav");
const somMorte = new Audio("sons/morte.wav");

const VOLUME_DOS_SONS = 1;    // de 0 (mudo) a 1 (máximo)

function tocarSom(somOriginal) {
    // cloneNode() cria uma cópia do som: assim dois sons seguidos
    // tocam por cima um do outro, em vez de o segundo cortar o primeiro.
    const som = somOriginal.cloneNode();
    som.volume = VOLUME_DOS_SONS;

    // play() devolve uma "promessa". O .catch() ignora o erro que alguns
    // navegadores dão se a página ainda não recebeu nenhum clique.
    som.play().catch(function() {});
}

function tocarSomDano() {
    tocarSom(somDano);
}

// Quando alguém chega a 0 de vida
function tocarSomMorte() {
    tocarSom(somMorte);
}
