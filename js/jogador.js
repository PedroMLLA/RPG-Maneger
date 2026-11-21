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
