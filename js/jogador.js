// Visão dos Jogadores: só LÊ o que o mapa do mestre salva
// (pelo Armazenamento) e desenha na tela. Esta página nunca salva nada.

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


// ----- Meu personagem -----
// O jogador que entrou pelo código escolhe quem ele é. Do personagem
// dele, vê SEMPRE a vida, os itens, as habilidades e a ficha, mesmo sem
// o mestre liberar. A escolha fica só neste aparelho.
// (Na TV do mestre, aberta pelo mapa, não existe "meu personagem".)
const modoJogador = new URLSearchParams(location.search).has("campanha");

// "" = escolheu "Só assistir"; null = ainda não escolheu nada
function lerEscolha() {
    const escolhas = Armazenamento.ler("meusPersonagens", {});
    return idCampanhaAtual in escolhas ? escolhas[idCampanhaAtual] : null;
}

let meuPersonagem = modoJogador ? lerEscolha() : null;

// A ficha do meu personagem cobre o mapa, então só abre no botão "📜 Ficha"
let minhaFichaAberta = false;

function ehMeu(id) {
    return Boolean(meuPersonagem) && id === meuPersonagem;
}

// Quem aparece nos painéis: meu personagem primeiro (mesmo fora do
// mapa), depois quem está no mapa.
function idsParaMostrar(personagens, estado) {
    const noMapa = Object.keys(estado.tokens || {});

    if (meuPersonagem && personagens[meuPersonagem]) {
        return [meuPersonagem, ...noMapa.filter(function(id) {
            return id !== meuPersonagem;
        })];
    }

    return noMapa;
}


// Mostra o mesmo mapa que o mestre está usando.
function carregarMapa() {
    imagemMapa.src =
        Armazenamento.ler("mapa") || mapaPadraoDaCampanha();
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

    const escalaQueCabe = Math.min(
        window.innerWidth / largura,
        window.innerHeight / altura
    );

    // O zoom que o jogador deu com os dedos multiplica o "cabe na tela"
    const escala = escalaQueCabe * zoom.fator;

    // Não deixa arrastar o mapa para fora da tela: no máximo até a borda
    const limiteX = Math.max(0, (largura * escala - window.innerWidth) / 2);
    const limiteY = Math.max(0, (altura * escala - window.innerHeight) / 2);
    zoom.x = Math.min(limiteX, Math.max(-limiteX, zoom.x));
    zoom.y = Math.min(limiteY, Math.max(-limiteY, zoom.y));

    const sobraX = (window.innerWidth - largura * escala) / 2 + zoom.x;
    const sobraY = (window.innerHeight - altura * escala) / 2 + zoom.y;

    conteudoMapa.style.transform =
        `translate(${sobraX}px, ${sobraY}px) scale(${escala})`;
}


// ----- Zoom e arraste do mapa (celular: dedos; PC: rodinha do mouse) -----
// fator 1 = mapa inteiro na tela. x/y = quanto o mapa foi arrastado.
const zoom = { fator: 1, x: 0, y: 0 };
const ZOOM_MAXIMO = 5;

// Dedos (ou mouse) encostados agora: id -> posição
const dedos = new Map();
let ultimoToque = 0;

// Muda o zoom mantendo parado o ponto (cx, cy) da tela, tipo o
// lugar entre os dois dedos. Assim o mapa cresce "em volta" dele.
function mudarZoom(novoFator, cx, cy) {
    novoFator = Math.min(ZOOM_MAXIMO, Math.max(1, novoFator));

    // Distância do ponto até o centro da tela, já com o arraste
    const centroX = window.innerWidth / 2 + zoom.x;
    const centroY = window.innerHeight / 2 + zoom.y;
    const proporcao = novoFator / zoom.fator;

    zoom.x += (cx - centroX) * (1 - proporcao);
    zoom.y += (cy - centroY) * (1 - proporcao);
    zoom.fator = novoFator;

    // Voltou para o tamanho normal: centraliza de novo
    if (zoom.fator === 1) {
        zoom.x = 0;
        zoom.y = 0;
    }

    ajustarNaTela();
}

function distanciaEntreDedos() {
    const [a, b] = [...dedos.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
}

const telaMapa = document.getElementById("mapa-jogadores");

telaMapa.addEventListener("pointerdown", function(evento) {
    // Toque num painel (vida, itens, ficha, botões) não mexe no mapa
    if (evento.target.closest("aside, nav, #fichas-jogadores")) {
        return;
    }

    // Dois toques rápidos: volta o mapa inteiro para a tela
    const agora = Date.now();
    if (dedos.size === 0 && agora - ultimoToque < 300) {
        mudarZoom(1, 0, 0);
    }
    ultimoToque = agora;

    dedos.set(evento.pointerId, { x: evento.clientX, y: evento.clientY });
});

telaMapa.addEventListener("pointermove", function(evento) {
    const antes = dedos.get(evento.pointerId);

    if (!antes) {
        return;
    }

    if (dedos.size === 1) {
        // Um dedo: arrasta (só faz sentido com zoom)
        if (zoom.fator > 1) {
            zoom.x += evento.clientX - antes.x;
            zoom.y += evento.clientY - antes.y;
            ajustarNaTela();
        }
        dedos.set(evento.pointerId, { x: evento.clientX, y: evento.clientY });
        return;
    }

    // Dois dedos: a mudança na distância entre eles vira zoom
    const distanciaAntes = distanciaEntreDedos();
    dedos.set(evento.pointerId, { x: evento.clientX, y: evento.clientY });
    const distanciaAgora = distanciaEntreDedos();

    const [a, b] = [...dedos.values()];
    mudarZoom(
        zoom.fator * (distanciaAgora / distanciaAntes),
        (a.x + b.x) / 2,
        (a.y + b.y) / 2
    );
});

function soltarDedo(evento) {
    dedos.delete(evento.pointerId);
}

telaMapa.addEventListener("pointerup", soltarDedo);
telaMapa.addEventListener("pointercancel", soltarDedo);

// PC: rodinha do mouse dá zoom onde o mouse está
telaMapa.addEventListener("wheel", function(evento) {
    if (evento.target.closest("aside, nav, #fichas-jogadores")) {
        return;
    }

    evento.preventDefault();
    mudarZoom(zoom.fator * (evento.deltaY < 0 ? 1.15 : 1 / 1.15), evento.clientX, evento.clientY);
}, { passive: false });


// Apaga os tokens e desenha de novo, a partir do estado salvo.
function desenharTokens() {
    const personagens = Armazenamento.ler("personagens", {});
    const estado = Armazenamento.ler("batalha", { tokens: {} });

    conferirMeuPersonagem(personagens);

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

        // Para achar este token quando chegar um movimento ao vivo
        boneco.dataset.id = id;

        boneco.style.left = `${posicao.x}px`;
        boneco.style.top = `${posicao.y}px`;

        // Destaca quem está jogando agora
        if (id === estado.idDaVez) {
            boneco.classList.add("token-da-vez");
        }

        // Meu personagem ganha a etiqueta "Você" (veja o CSS)
        if (ehMeu(id)) {
            boneco.classList.add("meu-token");
        }

        camadaTokens.appendChild(boneco);

        // Cone de visão, se o mestre ligou (depois de entrar na tela,
        // para o cone saber o tamanho do token)
        definirCampoVisao(boneco, posicao.visao);
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
    atualizarBotoesPaineis();
}


// ----- Celular: botões "Grupo" e "Itens" que abrem uma gaveta -----
// Cada botão só aparece se o painel dele tem alguma coisa.
const botaoGrupo = document.querySelector('[data-painel="grupo"]');
const botaoItens = document.querySelector('[data-painel="itens"]');

function atualizarBotoesPaineis() {
    botaoGrupo.hidden = grupoJogadores.children.length === 0;
    botaoItens.hidden = inventariosJogadores.children.length === 0;

    // Painel que ficou vazio fecha sozinho
    if (botaoGrupo.hidden) document.body.classList.remove("abrir-grupo");
    if (botaoItens.hidden) document.body.classList.remove("abrir-itens");
}

// Abre o painel do botão tocado; tocar de novo fecha.
// Só um aberto por vez, para não cobrir o mapa inteiro.
for (const botao of [botaoGrupo, botaoItens]) {
    botao.addEventListener("click", function() {
        const classe = `abrir-${botao.dataset.painel}`;
        const jaAberto = document.body.classList.contains(classe);

        document.body.classList.remove("abrir-grupo", "abrir-itens");

        if (!jaAberto) {
            document.body.classList.add(classe);
        }
    });
}


// ----- "Quem é você?" e os botões do meu personagem -----
const janelaMeuPersonagem = document.getElementById("janela-meu-personagem");
const listaEscolher = document.getElementById("lista-escolher");
const botaoMeuPersonagem = document.getElementById("botao-meu-personagem");
const botaoMinhaFicha = document.getElementById("botao-minha-ficha");

// O mestre excluiu o personagem que eu tinha escolhido: esquece a escolha.
// (Lista vazia = os dados ainda não chegaram; aí não dá para saber.)
function conferirMeuPersonagem(personagens) {
    const sumiu = meuPersonagem && !personagens[meuPersonagem];

    if (sumiu && Object.keys(personagens).length > 0) {
        guardarEscolha(null);
    }

    atualizarBotoesMeuPersonagem(personagens);
}

// Nome no botão "👤" e o botão "📜 Ficha" só para quem escolheu alguém
function atualizarBotoesMeuPersonagem(personagens) {
    botaoMeuPersonagem.hidden = !modoJogador;

    const meu = meuPersonagem && personagens[meuPersonagem];

    botaoMeuPersonagem.textContent = meu ? `👤 ${meu.nome}` : "👤 Quem sou eu";
    botaoMinhaFicha.hidden = !meu;
    botaoMinhaFicha.classList.toggle("ativo", Boolean(meu) && minhaFichaAberta);
}

// id = personagem escolhido; "" = só assistir; null = esquecer a escolha
function guardarEscolha(id) {
    const escolhas = Armazenamento.ler("meusPersonagens", {});

    if (id === null) {
        delete escolhas[idCampanhaAtual];
    } else {
        escolhas[idCampanhaAtual] = id;
    }

    Armazenamento.salvar("meusPersonagens", escolhas);

    meuPersonagem = id || null;
    minhaFichaAberta = false;
}

function abrirEscolherPersonagem() {
    const personagens = Armazenamento.ler("personagens", {});

    // Só aliados: os fixos da campanha primeiro, depois os outros
    const ids = Object.keys(personagens)
        .filter(function(id) {
            return personagens[id] && personagens[id].tipo !== "inimigo";
        })
        .sort(function(a, b) {
            return Boolean(personagens[b].fixo) - Boolean(personagens[a].fixo);
        });

    listaEscolher.innerHTML = "";

    if (ids.length === 0) {
        const aviso = document.createElement("p");
        aviso.classList.add("dica-escolher");
        aviso.textContent = "O mestre ainda não criou nenhum personagem.";
        listaEscolher.appendChild(aviso);
    }

    for (const id of ids) {
        const personagem = personagens[id];

        const opcao = document.createElement("button");
        opcao.type = "button";
        opcao.classList.add("opcao-escolher");
        opcao.classList.toggle("escolhida", ehMeu(id));

        // Foto (ou a inicial, se não tiver)
        const foto = document.createElement("span");
        foto.classList.add("foto-escolher");

        if (personagem.imagem) {
            foto.style.backgroundImage = `url('${personagem.imagem}')`;
        } else {
            foto.textContent = personagem.nome.charAt(0).toUpperCase();
        }

        const nome = document.createElement("span");
        nome.textContent = personagem.nome;

        opcao.append(foto, nome);

        opcao.addEventListener("click", function() {
            escolher(id);
        });

        listaEscolher.appendChild(opcao);
    }

    janelaMeuPersonagem.style.display = "flex";
}

function escolher(id) {
    guardarEscolha(id);
    janelaMeuPersonagem.style.display = "none";
    desenharTokens();
}

botaoMeuPersonagem.addEventListener("click", abrirEscolherPersonagem);

document.getElementById("botao-so-assistir").addEventListener("click", function() {
    escolher("");
});

// Tocar no fundo escuro fecha sem mudar nada
janelaMeuPersonagem.addEventListener("click", function(evento) {
    if (evento.target === janelaMeuPersonagem) {
        janelaMeuPersonagem.style.display = "none";
    }
});

// "📜 Ficha": abre e fecha a ficha do meu personagem no centro
function alternarMinhaFicha(abrir) {
    minhaFichaAberta = abrir;

    // No celular, fecha as gavetas para a ficha aparecer inteira
    if (abrir) {
        document.body.classList.remove("abrir-grupo", "abrir-itens");
    }

    desenharTokens();
}

botaoMinhaFicha.addEventListener("click", function() {
    alternarMinhaFicha(!minhaFichaAberta);
});

// Tocar fora das fichas (no fundo escuro) fecha a minha
fichasJogadores.addEventListener("click", function(evento) {
    if (evento.target === fichasJogadores && minhaFichaAberta) {
        alternarMinhaFicha(false);
    }
});


// Fichas (roda de atributos + perícias) dos aliados que o mestre liberou.
function desenharFichas(personagens, estado) {
    fichasJogadores.innerHTML = "";

    for (const id of idsParaMostrar(personagens, estado)) {
        const personagem = personagens[id];

        // Aliado ou inimigo: só aparece se o mestre liberou a ficha.
        // A minha aparece quando eu abro pelo botão "📜 Ficha".
        const minha = ehMeu(id) && minhaFichaAberta;

        if (!personagem || !(personagem.fichaVisivel || minha)) {
            continue;
        }

        const cartao = document.createElement("div");
        cartao.classList.add("cartao-ficha");
        cartao.classList.toggle("cartao-meu", ehMeu(id));

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

    for (const id of idsParaMostrar(personagens, estado)) {
        const personagem = personagens[id];

        if (!personagem) {
            continue;
        }

        // Só aparece se o mestre ligou o "mostrar" na janela do
        // inventário (ou se é o meu personagem)
        if (!personagem.inventarioVisivel && !ehMeu(id)) {
            continue;
        }

        const itens = personagem.inventario || [];

        if (itens.length === 0) {
            continue;
        }

        const cartao = document.createElement("div");
        cartao.classList.add("cartao-inventario");
        cartao.classList.toggle("cartao-meu", ehMeu(id));

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

    for (const id of idsParaMostrar(personagens, estado)) {
        const personagem = personagens[id];

        if (!personagem || !(personagem.habilidadesVisivel || ehMeu(id))) {
            continue;
        }

        const habilidades = personagem.habilidades || [];

        if (habilidades.length === 0) {
            continue;
        }

        const cartao = document.createElement("div");
        cartao.classList.add("cartao-inventario", "cartao-habilidades");
        cartao.classList.toggle("cartao-meu", ehMeu(id));

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

    for (const id of idsParaMostrar(personagens, estado)) {
        const personagem = personagens[id];

        // Só aparece quem o mestre liberou (botão direito no token)
        // e o meu personagem
        if (!personagem || !(personagem.vidaVisivel || ehMeu(id))) {
            continue;
        }

        const cartao = document.createElement("div");
        cartao.classList.add("cartao-aliado");
        cartao.classList.toggle("cartao-meu", ehMeu(id));

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
    const imagens = Armazenamento.ler("imagens", []);
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

// É assim que esta tela acompanha a batalha: o Armazenamento avisa
// quando o mapa do mestre muda alguma coisa, e redesenhamos.
Armazenamento.quandoMudar("batalha", desenharTokens);
Armazenamento.quandoMudar("personagens", desenharTokens);
Armazenamento.quandoMudar("mapa", carregarMapa);
Armazenamento.quandoMudar("imagens", desenharImagens);

// O mestre está arrastando um token: move só ele, sem redesenhar tudo.
// (CSS.escape protege o seletor caso o id tenha algum caractere estranho.)
Armazenamento.quandoChegarAoVivo("token", function(dados) {
    const boneco = camadaTokens.querySelector(`[data-id="${CSS.escape(dados.id)}"]`);

    if (boneco) {
        boneco.style.left = `${dados.x}px`;
        boneco.style.top = `${dados.y}px`;
    }
});

// O mestre está girando um cone de visão: gira só ele
Armazenamento.quandoChegarAoVivo("visao", function(dados) {
    const boneco = camadaTokens.querySelector(`[data-id="${CSS.escape(dados.id)}"]`);

    if (boneco) {
        definirCampoVisao(boneco, dados.angulo);
    }
});

// Anúncio novo do mestre (ex.: "Nero está morrendo"): tela cheia.
// Anúncio velho (ex.: baixado de novo ao abrir a campanha) não aparece.
Armazenamento.quandoMudar("anuncio", function(anuncio) {
    if (!anuncio) {
        return;
    }

    const aindaValendo = Date.now() - anuncio.momento < anuncio.duracao;

    if (aindaValendo) {
        exibirAnuncio(document.getElementById("anuncio-jogadores"), anuncio);
    }
});


// ----- Jogador que entrou pelo código (V3) -----
// Endereço "jogador.html?campanha=ID": este aparelho pode ser o celular
// de um jogador, sem nada salvo. Os dados vêm do banco, e o tempo real
// mantém a tela em dia.
async function iniciarModoJogador() {
    const { data } = await clienteSupabase.auth.getSession();

    // Sem conexão com o banco (nunca entrou pelo código neste aparelho)
    if (!data.session) {
        window.location.replace("entrar.html");
        return;
    }

    try {
        // Nome, capa e código da campanha. As regras do banco só deixam
        // ler se este aparelho entrou com o código.
        const { data: campanha, error } = await clienteSupabase
            .from("campanhas")
            .select("id, nome, imagem, codigo")
            .eq("id", idCampanhaAtual)
            .single();

        if (error) {
            throw error;
        }

        document.title = `${campanha.nome} - RPG Manager`;

        // Guarda na cópia local, para o mapa padrão da campanha funcionar
        // (sem apagar as outras campanhas, caso seja o PC do mestre)
        const campanhas = Armazenamento.ler("campanhas", [])
            .filter(function(outra) { return outra.id !== campanha.id; });

        campanhas.push(campanha);
        Armazenamento.salvar("campanhas", campanhas);

        // true = só ler: o jogador nunca grava nada no banco
        await Armazenamento.baixarCampanha(idCampanhaAtual, true);

        carregarMapa();
        desenharTokens();
        desenharImagens();

        Armazenamento.ligarTempoReal();

        // Primeira vez nesta campanha: pergunta quem ele é
        if (lerEscolha() === null) {
            abrirEscolherPersonagem();
        }

    } catch (erro) {
        console.error(erro);
        vezJogadores.textContent = "Não foi possível abrir a mesa. Volte e digite o código de novo.";
        vezJogadores.style.display = "block";
    }
}


carregarMapa();
desenharTokens();
desenharImagens();

if (new URLSearchParams(location.search).has("campanha")) {
    iniciarModoJogador();
}
