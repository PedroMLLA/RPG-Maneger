// Visão dos Jogadores: só LÊ o que o mapa do mestre salva no
// localStorage e desenha na tela. Esta página nunca salva nada.

const imagemMapa = document.getElementById("imagem-mapa");
const conteudoMapa = document.getElementById("conteudo-mapa");
const camadaTokens = document.getElementById("personagens-mapa");
const vezJogadores = document.getElementById("vez-jogadores");
const grupoJogadores = document.getElementById("grupo-jogadores");
const inventariosJogadores = document.getElementById("inventarios-jogadores");
const fichasJogadores = document.getElementById("fichas-jogadores");

// Lembra a vida de cada aliado no último desenho, para saber se caiu
const ultimoHp = {};

// Lembra a vida de cada TOKEN no último desenho, para saber se foi curado
// (vale para todos, mesmo quem está com a vida escondida)
const vidaDoTokenAntes = {};


// Lê uma chave do localStorage já convertida de texto para objeto.
// Se a chave não existir, devolve o "padrao".
function lerDoStorage(chave, padrao) {
    return JSON.parse(localStorage.getItem(chave)) || padrao;
}


// Mostra o mesmo mapa que o mestre está usando.
function carregarMapa() {
    imagemMapa.src =
        localStorage.getItem("mapaPersonalizado") || "mapas/kotto.jfif";
}


// Encaixa o mapa inteiro na tela (TV, projetor...), centralizado.
// Os tokens estão DENTRO do conteudo-mapa, então escalam junto.
function ajustarNaTela() {
    const largura = imagemMapa.naturalWidth;
    const altura = imagemMapa.naturalHeight;

    // A imagem ainda não carregou
    if (!largura || !altura) {
        return;
    }

    const escala = Math.min(
        window.innerWidth / largura,
        window.innerHeight / altura
    );

    const sobraX = (window.innerWidth - largura * escala) / 2;
    const sobraY = (window.innerHeight - altura * escala) / 2;

    conteudoMapa.style.transform =
        `translate(${sobraX}px, ${sobraY}px) scale(${escala})`;
}


// Apaga os tokens e desenha de novo, a partir do estado salvo.
function desenharTokens() {
    const personagens = lerDoStorage("personagens", {});
    const estado = lerDoStorage("estadoBatalha", { tokens: {} });

    camadaTokens.innerHTML = "";

    for (const id in estado.tokens) {
        const personagem = personagens[id];

        if (!personagem) {
            continue;
        }

        const posicao = estado.tokens[id];
        const tipo = personagem.tipo || "player";

        const boneco = document.createElement("div");

        aplicarVisualToken(
            boneco,
            personagem,
            tipo,
            tamanhoEmPixels(personagem.tamanho),
            personagem.nome.charAt(0).toUpperCase()
        );

        // Ícones de condição e inimigo derrotado (mesma função da tela do mestre)
        atualizarEstadoToken(boneco, personagem);

        // Foi curado desde o último desenho? Faíscas verdes.
        // Aqui não mostramos o "+8": quem tem a vida escondida
        // não pode entregar quanto curou.
        const vidaAntes = vidaDoTokenAntes[id];

        if (vidaAntes !== undefined && personagem.hp > vidaAntes) {
            efeitoCura(boneco, null);
        }

        vidaDoTokenAntes[id] = personagem.hp;

        boneco.style.left = `${posicao.x}px`;
        boneco.style.top = `${posicao.y}px`;

        // Destaca quem está jogando agora
        if (id === estado.idDaVez) {
            boneco.classList.add("token-da-vez");
        }

        camadaTokens.appendChild(boneco);
    }

    if (estado.nomeDaVez) {
        const novoTexto = `Vez de: ${estado.nomeDaVez}`;

        // Só anima quando a vez muda de verdade
        if (vezJogadores.textContent !== novoTexto) {
            vezJogadores.classList.remove("trocou");
            void vezJogadores.offsetWidth; // faz a animação recomeçar
            vezJogadores.classList.add("trocou");
        }

        vezJogadores.textContent = novoTexto;
        vezJogadores.style.display = "block";
    } else {
        vezJogadores.style.display = "none";
    }

    desenharGrupo(personagens, estado);
    // Coluna da direita: primeiro os inventários, depois as habilidades
    inventariosJogadores.innerHTML = "";

    desenharInventarios(personagens, estado);
    desenharHabilidades(personagens, estado);

    inventariosJogadores.style.display =
        inventariosJogadores.children.length > 0 ? "flex" : "none";
    desenharFichas(personagens, estado);
}


// Fichas (roda de atributos + perícias) dos aliados que o mestre liberou.
function desenharFichas(personagens, estado) {
    fichasJogadores.innerHTML = "";

    for (const id in estado.tokens) {
        const personagem = personagens[id];

        // Aliado ou inimigo: só aparece se o mestre liberou a ficha
        if (!personagem || !personagem.fichaVisivel) {
            continue;
        }

        const cartao = document.createElement("div");
        cartao.classList.add("cartao-ficha");

        const titulo = document.createElement("h3");
        titulo.textContent = `📜 ${personagem.nome}`;
        cartao.appendChild(titulo);

        // false = só leitura: mostra os números, sem campos para editar
        cartao.appendChild(
            criarRodaAtributos(personagem.atributos || {}, false)
        );

        const pericias = personagem.pericias || [];

        if (pericias.length > 0) {
            const lista = document.createElement("ul");
            lista.classList.add("pericias-jogadores");

            for (const pericia of pericias) {
                const linha = document.createElement("li");

                const nome = document.createElement("span");
                nome.textContent = pericia.nome;

                const bonus = document.createElement("span");
                bonus.classList.add("bonus-pericia");
                bonus.textContent = formatarBonus(pericia.bonus);

                linha.append(nome, bonus);
                lista.appendChild(linha);
            }

            cartao.appendChild(lista);
        }

        fichasJogadores.appendChild(cartao);
    }

    fichasJogadores.style.display =
        fichasJogadores.children.length > 0 ? "flex" : "none";
}


// Inventário de quem está no mapa (aliado ou inimigo), tem pelo menos
// um item e que o mestre liberou para os jogadores verem.
function desenharInventarios(personagens, estado) {

    for (const id in estado.tokens) {
        const personagem = personagens[id];

        if (!personagem) {
            continue;
        }

        // Só aparece se o mestre ligou o "mostrar" na janela do inventário
        if (!personagem.inventarioVisivel) {
            continue;
        }

        const itens = personagem.inventario || [];

        if (itens.length === 0) {
            continue;
        }

        const cartao = document.createElement("div");
        cartao.classList.add("cartao-inventario");

        const titulo = document.createElement("h3");
        titulo.textContent = `🎒 ${personagem.nome}`;
        cartao.appendChild(titulo);

        const lista = document.createElement("ul");

        for (const item of itens) {
            const linha = document.createElement("li");

            const quantidade = document.createElement("span");
            quantidade.classList.add("quantidade-item");
            quantidade.textContent = `${item.quantidade}×`;

            const nome = document.createElement("span");
            nome.textContent = item.nome;

            linha.append(quantidade, nome);
            lista.appendChild(linha);
        }

        cartao.appendChild(lista);

        // Linha da carga: "⚖ 12,5 / 30 kg" (vermelha se passou do limite)
        const total = calcularPesoTotal(itens);
        const maximo = personagem.pesoMaximo || 0;

        if (total > 0 || maximo > 0) {
            const carga = document.createElement("div");
            carga.classList.add("carga-jogadores");

            carga.textContent = maximo > 0
                ? `⚖ ${formatarPeso(total)} / ${formatarPeso(maximo)} kg`
                : `⚖ ${formatarPeso(total)} kg`;

            if (maximo > 0 && total > maximo) {
                carga.classList.add("sobrecarregado");
                carga.textContent += " · Sobrecarregado";
            }

            cartao.appendChild(carga);
        }

        inventariosJogadores.appendChild(cartao);
    }
}


// Habilidades de quem está no mapa (aliado ou inimigo) que o mestre liberou.
// Ficam na mesma coluna da direita, abaixo dos inventários.
function desenharHabilidades(personagens, estado) {

    for (const id in estado.tokens) {
        const personagem = personagens[id];

        if (!personagem || !personagem.habilidadesVisivel) {
            continue;
        }

        const habilidades = personagem.habilidades || [];

        if (habilidades.length === 0) {
            continue;
        }

        const cartao = document.createElement("div");
        cartao.classList.add("cartao-inventario", "cartao-habilidades");

        const titulo = document.createElement("h3");
        titulo.textContent = `🔥 ${personagem.nome}`;
        cartao.appendChild(titulo);

        for (const habilidade of habilidades) {
            const bloco = document.createElement("div");
            bloco.classList.add("habilidade-jogadores");

            const topo = document.createElement("div");
            topo.classList.add("topo-habilidade");

            const nome = document.createElement("strong");
            nome.textContent = habilidade.nome;
            topo.appendChild(nome);

            // O dano só aparece se tiver sido preenchido
            if (habilidade.dano) {
                const dano = document.createElement("span");
                dano.classList.add("dano-habilidade");
                dano.textContent = habilidade.dano;
                topo.appendChild(dano);
            }

            bloco.appendChild(topo);

            if (habilidade.descricao) {
                const descricao = document.createElement("p");
                descricao.textContent = habilidade.descricao;
                bloco.appendChild(descricao);
            }

            cartao.appendChild(bloco);
        }

        inventariosJogadores.appendChild(cartao);
    }
}


// Cria uma barra (vida ou sanidade) com o valor atual e o máximo.
function criarBarra(rotulo, atual, maximo, classe) {
    // Porcentagem preenchida. Se não houver máximo, a barra fica vazia.
    const porcentagem = maximo > 0 ? (atual / maximo) * 100 : 0;

    const barra = document.createElement("div");
    barra.classList.add("barra-status", classe);

    barra.innerHTML = `
        <div class="barra-topo">
            <span class="barra-rotulo"></span>
            <span class="barra-numeros"></span>
        </div>
        <div class="barra-fundo">
            <div class="barra-preenchida"></div>
        </div>
    `;

    // textContent (e não innerHTML) para valores que vêm dos dados
    barra.querySelector(".barra-rotulo").textContent = rotulo;
    barra.querySelector(".barra-numeros").textContent = `${atual} / ${maximo}`;
    barra.querySelector(".barra-preenchida").style.width = `${porcentagem}%`;

    return barra;
}


// Painel com vida e sanidade de quem está no mapa e que o mestre
// liberou (aliados e inimigos). Por padrão, ninguém aparece.
function desenharGrupo(personagens, estado) {
    grupoJogadores.innerHTML = "";

    for (const id in estado.tokens) {
        const personagem = personagens[id];

        // Só aparece quem o mestre liberou (botão direito no token)
        if (!personagem || !personagem.vidaVisivel) {
            continue;
        }

        const cartao = document.createElement("div");
        cartao.classList.add("cartao-aliado");

        // Inimigo ganha a etiqueta "INIMIGO" no cartão (veja o CSS)
        if (personagem.tipo === "inimigo") {
            cartao.classList.add("cartao-inimigo");
        }

        // Quem está com a vida zerada aparece apagado
        if (personagem.hp <= 0) {
            cartao.classList.add("caido");
        }

        // Se a vida caiu desde o último desenho, o cartão treme em vermelho
        if (ultimoHp[id] !== undefined && personagem.hp < ultimoHp[id]) {
            cartao.classList.add("levou-dano");
        }

        ultimoHp[id] = personagem.hp;

        if (id === estado.idDaVez) {
            cartao.classList.add("da-vez");
        }

        const nome = document.createElement("h3");
        nome.textContent = personagem.nome;
        cartao.appendChild(nome);

        cartao.appendChild(
            criarBarra("Vida", personagem.hp, personagem.hpMaximo, "barra-vida")
        );

        // A barra de sanidade só aparece para quem tem sanidade
        if (personagem.sanidadeMaxima > 0) {
            cartao.appendChild(
                criarBarra("Sanidade", personagem.sanidade, personagem.sanidadeMaxima, "barra-sanidade")
            );
        }

        grupoJogadores.appendChild(cartao);
    }

    // Sem aliados no mapa, o painel some
    grupoJogadores.style.display =
        grupoJogadores.children.length > 0 ? "flex" : "none";
}


// Imagens que o mestre arrastou da aba "Imagens" para o mapa.
// Só as que acabaram de chegar fazem a animação de aparecer.
const camadaImagens = document.getElementById("imagens-mapa");
let idsImagensNaTela = [];

function desenharImagens() {
    const imagens = lerDoStorage("imagensMestre", []);
    const idsAgora = [];

    camadaImagens.innerHTML = "";

    for (const imagem of imagens) {
        if (!imagem.noMapa) {
            continue;
        }

        const caixa = document.createElement("div");
        caixa.classList.add("imagem-solta");
        caixa.style.left = `${imagem.x}px`;
        caixa.style.top = `${imagem.y}px`;
        caixa.style.width = `${imagem.largura}px`;

        // Já estava na tela? Sem animação (senão ela "pularia" a cada movimento)
        if (idsImagensNaTela.includes(imagem.id)) {
            caixa.style.animation = "none";
        }

        const foto = document.createElement("img");
        foto.src = imagem.src;
        foto.alt = imagem.nome;
        caixa.appendChild(foto);

        camadaImagens.appendChild(caixa);
        idsAgora.push(imagem.id);
    }

    idsImagensNaTela = idsAgora;
}


// Quando a imagem termina de carregar, já sabemos o tamanho dela
imagemMapa.addEventListener("load", ajustarNaTela);

// Se a janela mudar de tamanho (ex.: tela cheia com F11), reencaixa
window.addEventListener("resize", ajustarNaTela);

// O evento "storage" avisa quando OUTRA janela (o mapa do mestre)
// muda o localStorage. É assim que esta tela acompanha a batalha.
window.addEventListener("storage", function(event) {

    if (event.key === "estadoBatalha" || event.key === "personagens") {
        desenharTokens();
    }

    if (event.key === "mapaPersonalizado") {
        carregarMapa();
    }

    if (event.key === "imagensMestre") {
        desenharImagens();
    }

    // Anúncio novo do mestre (ex.: "Nero está morrendo"): tela cheia
    if (event.key === "anuncio" && event.newValue) {
        exibirAnuncio(
            document.getElementById("anuncio-jogadores"),
            JSON.parse(event.newValue)
        );
    }
});


carregarMapa();
desenharTokens();
desenharImagens();
