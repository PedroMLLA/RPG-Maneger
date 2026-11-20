// Anúncios: mensagens grandes que aparecem por alguns segundos,
// como "Nero está morrendo". Usado pela tela do mestre (que publica)
// e pela visão dos jogadores (que mostra em tela cheia).

// Grava o anúncio no localStorage. A visão dos jogadores recebe pelo
// evento "storage". O "momento" garante que o evento dispare mesmo se
// o mesmo texto for anunciado duas vezes.
function publicarAnuncio(tipo, titulo, texto, duracao) {
    const anuncio = {
        tipo: tipo,           // "morrendo", "rodada", "salvo" ou "morreu"
        titulo: titulo,
        texto: texto,
        duracao: duracao,     // em milissegundos (7000 = 7 segundos)
        momento: Date.now()
    };

    try {
        localStorage.setItem("anuncio", JSON.stringify(anuncio));
    } catch (erro) {
        console.error(erro);
    }

    return anuncio;
}

// Guarda o "relógio" do anúncio atual, para um anúncio novo
// cancelar o tempo do anterior.
let temporizadorAnuncio = null;

// Mostra o anúncio dentro de um elemento da página
// (o elemento precisa ter .anuncio-titulo e .anuncio-texto dentro).
function exibirAnuncio(elemento, anuncio) {
    // data-tipo="morrendo" etc.: o CSS muda as cores conforme o tipo
    elemento.dataset.tipo = anuncio.tipo;

    elemento.querySelector(".anuncio-titulo").textContent = anuncio.titulo;
    elemento.querySelector(".anuncio-texto").textContent = anuncio.texto;

    // Tira e coloca a classe de novo para a animação recomeçar
    elemento.classList.remove("visivel");
    void elemento.offsetWidth;
    elemento.classList.add("visivel");

    // setTimeout: roda a função depois de X milissegundos
    clearTimeout(temporizadorAnuncio);

    temporizadorAnuncio = setTimeout(function() {
        elemento.classList.remove("visivel");
    }, anuncio.duracao);
}

// "1 rodada" / "3 rodadas"
function textoRodadas(quantidade) {
    return quantidade === 1 ? "1 rodada" : `${quantidade} rodadas`;
}
