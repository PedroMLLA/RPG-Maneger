// Página de escolher campanha: as campanhas ficam numa roda.
// Passar o mouse faz a campanha crescer e mostrar o nome;
// clicar escolhe a campanha e abre o mapa.
//
// V3: as campanhas moram no banco (tabela "campanhas" do Supabase),
// cada uma com o seu código para os jogadores entrarem.
// Uma cópia da lista fica no Armazenamento ("campanhas"), para o mapa
// saber o nome e o código sem esperar o servidor.

const rodaCampanhas = document.getElementById("roda-campanhas");
const nomeEmDestaque = document.getElementById("nome-em-destaque");
const botaoNovaCampanha = document.getElementById("botao-nova-campanha");

const janelaCampanha = document.getElementById("janela-campanha");
const campoNomeCampanha = document.getElementById("nome-campanha");
const campoImagemCampanha = document.getElementById("imagem-campanha");
const previaCampanha = document.getElementById("previa-campanha");
const textoImagemCampanha = document.getElementById("texto-imagem-campanha");
const botaoCancelarCampanha = document.getElementById("botao-cancelar-campanha");
const botaoCriarCampanha = document.getElementById("botao-criar-campanha");
const listaFixos = document.getElementById("lista-fixos");
const botaoAdicionarFixo = document.getElementById("botao-adicionar-fixo");

// "(hover: none)": aparelho sem mouse (celular, tablet). Lá não dá
// para "passar o mouse", então o texto muda.
const SEM_MOUSE = window.matchMedia("(hover: none)").matches;
const TEXTO_PADRAO = SEM_MOUSE ? "Toque em uma campanha" : "Passe o mouse em uma campanha";
const TAMANHO_CAMPANHA = 130; // largura de cada círculo, igual ao CSS

// Na primeira vez, já vêm duas campanhas com os mapas do projeto
const CAMPANHAS_PADRAO = [
    { id: "kotto", nome: "Kotto", imagem: "mapas/kotto.jfif" },
    { id: "demetria", nome: "Demetria", imagem: "mapas/demetria.jfif" }
];

// As colunas que pedimos ao banco
const COLUNAS = "id, nome, imagem, codigo";

let campanhas = [];

// Imagem escolhida na janela de nova campanha (já otimizada)
let imagemNova = null;


// Atualiza a cópia local (o mapa usa para mostrar nome e código)
function guardarCopiaLocal() {
    try {
        Armazenamento.salvar("campanhas", campanhas);
    } catch (erro) {
        console.error(erro);
    }
}

// Avisos embaixo da roda ("Carregando...", erros)
function avisar(texto) {
    nomeEmDestaque.textContent = texto;
}

// Explica o erro: sem internet, ou o motivo que o banco deu
function motivoDoErro(erro) {
    const texto = (erro && erro.message) || String(erro);

    if (texto.includes("Failed to fetch")) {
        return "sem conexão com o servidor. Confira a internet";
    }

    return texto;
}


// ----- Banco de dados -----

// Busca as campanhas do mestre logado, da mais antiga para a mais nova
async function buscarCampanhas() {
    const { data, error } = await clienteSupabase
        .from("campanhas")
        .select(COLUNAS)
        .order("criada_em");

    if (error) {
        throw error;
    }

    return data;
}

// Cria uma campanha no banco e devolve a linha criada (com id e código).
// São DOIS pedidos separados de propósito: "cria" e depois "me mostra".
// Pedir os dois juntos (insert + select) fazia a regra de leitura
// conferir a campanha antes de ela existir, e o banco recusava.
async function inserirCampanha(nome, imagem) {
    // O id é sorteado aqui, para depois buscarmos a campanha por ele
    const id = crypto.randomUUID();

    const criacao = await clienteSupabase
        .from("campanhas")
        .insert({ id: id, nome: nome, imagem: imagem });

    if (criacao.error) {
        throw criacao.error;
    }

    const busca = await clienteSupabase
        .from("campanhas")
        .select(COLUNAS)
        .eq("id", id)
        .single();

    if (busca.error) {
        throw busca.error;
    }

    return busca.data;
}

// Primeira vez na V3: as campanhas que estavam só no navegador vão para
// o banco. Os dados delas (personagens, batalha...) acompanham o id novo.
// Se nunca houve nenhuma (nem aqui, nem no banco), cria Kotto e Demetria.
async function levarCampanhasAntigas() {
    let locais = Armazenamento.ler("campanhas", null);

    if (locais === null) {
        // Outro computador, com as campanhas já no banco: nada a levar
        if (campanhas.length > 0) {
            return;
        }
        locais = CAMPANHAS_PADRAO;
    }

    for (const antiga of locais) {
        // As que já estão no banco têm código; as antigas, não
        if (antiga.codigo) {
            continue;
        }

        const nova = await inserirCampanha(antiga.nome, antiga.imagem || null);
        Armazenamento.moverCampanha(antiga.id, nova.id);
        campanhas.push(nova);

        // Troca na cópia local NA HORA: se a internet cair no meio,
        // a próxima tentativa não manda esta de novo
        locais = locais.map(function(campanha) {
            return campanha === antiga ? nova : campanha;
        });
        Armazenamento.salvar("campanhas", locais);
    }
}

async function carregarCampanhas() {
    avisar("Carregando campanhas...");

    try {
        campanhas = await buscarCampanhas();
        await levarCampanhasAntigas();

        guardarCopiaLocal();
        avisar(TEXTO_PADRAO);
        desenharRoda();

    } catch (erro) {
        console.error(erro);
        avisar(`Não foi possível carregar as campanhas: ${motivoDoErro(erro)}.`);
    }
}


// ----- A roda -----

function desenharRoda() {
    // Tira as campanhas antigas (o anel e o botão do meio ficam)
    rodaCampanhas.querySelectorAll(".campanha-roda").forEach(function(item) {
        item.remove();
    });

    const quantidade = campanhas.length;

    // Quanto mais campanhas, maior a roda, para elas não se encostarem.
    // A volta da roda (2 × π × raio) precisa caber todos os círculos.
    const raio = Math.max(185, (quantidade * TAMANHO_CAMPANHA * 1.25) / (2 * Math.PI));
    const tamanho = raio * 2 + TAMANHO_CAMPANHA;

    rodaCampanhas.style.setProperty("--tamanho-roda", `${tamanho}px`);

    // Que fração da roda cada círculo ocupa. O CSS usa isso para os
    // círculos encolherem junto com a roda (no celular ela fica menor).
    rodaCampanhas.style.setProperty("--parte", TAMANHO_CAMPANHA / tamanho);

    campanhas.forEach(function(campanha, indice) {

        // Ângulo de cada campanha: dividimos a volta (2π) em partes iguais.
        // O "- π/2" faz a primeira começar no topo, e não à direita.
        const angulo = (indice / quantidade) * 2 * Math.PI - Math.PI / 2;

        // Seno e cosseno dão a posição num círculo de raio 1;
        // multiplicando pelo raio, a roda fica do tamanho certo.
        // Usamos % para a roda encolher junto em telas pequenas.
        const centroX = 50 + (Math.cos(angulo) * raio / tamanho) * 100;
        const centroY = 50 + (Math.sin(angulo) * raio / tamanho) * 100;
        const metade = (TAMANHO_CAMPANHA / 2 / tamanho) * 100;

        const item = criarItemCampanha(campanha);
        item.style.left = `${centroX - metade}%`;
        item.style.top = `${centroY - metade}%`;

        // Entram uma depois da outra
        item.style.setProperty("--atraso", `${indice * 0.07}s`);

        rodaCampanhas.appendChild(item);
    });
}

function criarItemCampanha(campanha) {
    const item = document.createElement("button");
    item.classList.add("campanha-roda");
    item.setAttribute("aria-label", `Jogar ${campanha.nome}`);

    const foto = document.createElement("div");
    foto.classList.add("foto-campanha");

    if (campanha.imagem) {
        const imagem = document.createElement("img");
        imagem.src = campanha.imagem;
        imagem.alt = "";
        foto.appendChild(imagem);
    } else {
        // Sem imagem: a inicial do nome, como nos tokens
        foto.textContent = campanha.nome.charAt(0).toUpperCase();
    }

    const nome = document.createElement("span");
    nome.classList.add("nome-campanha", "adesivo");
    nome.textContent = campanha.nome;

    const excluir = document.createElement("span");
    // É um <span>, não um <button>: botão dentro de botão não vale no HTML
    excluir.classList.add("excluir-campanha");
    excluir.textContent = "×";
    excluir.title = "Excluir campanha";

    item.append(foto, nome, excluir);

    item.addEventListener("mouseenter", function() {
        nomeEmDestaque.textContent = campanha.nome;
    });

    item.addEventListener("mouseleave", function() {
        // Enquanto abre uma campanha, mantém o "Abrindo..." na tela
        if (!abrindo) {
            nomeEmDestaque.textContent = TEXTO_PADRAO;
        }
    });

    item.addEventListener("click", function(event) {

        // Clicou no ×: exclui em vez de entrar
        if (event.target === excluir) {
            excluirCampanha(campanha);
            return;
        }

        escolherCampanha(campanha);
    });

    return item;
}

// Evita abrir duas campanhas com cliques seguidos
let abrindo = false;

async function escolherCampanha(campanha) {
    if (abrindo) {
        return;
    }

    abrindo = true;
    avisar(`Abrindo ${campanha.nome}...`);

    try {
        // Traz personagens, batalha, mapa e imagens do banco (e, na
        // primeira vez, sobe o que estava só neste navegador)
        await Armazenamento.baixarCampanha(campanha.id);

    } catch (erro) {
        console.error(erro);

        const abrirMesmoAssim = confirm(
            `Não foi possível baixar os dados da campanha: ${motivoDoErro(erro)}.\n\n` +
            "Abrir com o que está salvo neste computador?"
        );

        if (!abrirMesmoAssim) {
            abrindo = false;
            avisar(TEXTO_PADRAO);
            return;
        }
    }

    Armazenamento.salvar("campanhaAtual", campanha.id);
    window.location.href = "mapa.html";
}

async function excluirCampanha(campanha) {
    if (!confirm(`Excluir a campanha "${campanha.nome}"?\n\nO mapa, os personagens e a batalha dela serão apagados.`)) {
        return;
    }

    // Apaga no banco (os dados e os jogadores dela vão junto)
    const { error } = await clienteSupabase
        .from("campanhas")
        .delete()
        .eq("id", campanha.id);

    if (error) {
        console.error(error);
        alert(`Não foi possível excluir: ${motivoDoErro(error)}.`);
        return;
    }

    campanhas = campanhas.filter(function(outra) {
        return outra.id !== campanha.id;
    });

    // Apaga os dados guardados no navegador (armazenamento.js)
    Armazenamento.apagarCampanha(campanha.id);

    // Se era a campanha escolhida, ninguém fica escolhido
    if (Armazenamento.ler("campanhaAtual") === campanha.id) {
        Armazenamento.apagar("campanhaAtual");
    }

    guardarCopiaLocal();
    avisar(TEXTO_PADRAO);
    desenharRoda();
}


// ----- Janela de nova campanha -----

// ----- Personagens fixos da nova campanha -----
// Cada personagem é um "cartão" com foto, nome, vida e sanidade.
// A imagem escolhida fica guardada no próprio cartão (cartao.imagem)
// e só vai para o Storage quando a campanha é criada, porque a pasta
// no Storage é o id da campanha, que ainda não existe.

function adicionarCartaoFixo() {
    const cartao = document.createElement("div");
    cartao.classList.add("cartao-fixo");
    cartao.imagem = null;

    // Foto: um <label> em volta do <input type="file"> abre a escolha
    const foto = document.createElement("label");
    foto.classList.add("foto-fixo");
    foto.title = "Escolher imagem";

    const previa = document.createElement("img");
    previa.alt = "";
    previa.hidden = true;

    const icone = document.createElement("span");
    icone.textContent = "🖼️";

    const arquivo = document.createElement("input");
    arquivo.type = "file";
    arquivo.accept = "image/*";
    arquivo.hidden = true;

    arquivo.addEventListener("change", function() {
        if (!arquivo.files[0]) {
            return;
        }

        otimizarImagem(arquivo.files[0], function(imagemOtimizada) {
            cartao.imagem = imagemOtimizada;
            previa.src = imagemOtimizada;
            previa.hidden = false;
            icone.hidden = true;
        });
    });

    foto.append(previa, icone, arquivo);

    // Campos
    const nome = document.createElement("input");
    nome.type = "text";
    nome.placeholder = "Nome";
    nome.maxLength = 30;
    nome.classList.add("nome-fixo");

    const vida = document.createElement("input");
    vida.type = "number";
    vida.min = 1;
    vida.placeholder = "Vida";
    vida.classList.add("vida-fixo");

    const sanidade = document.createElement("input");
    sanidade.type = "number";
    sanidade.min = 1;
    sanidade.placeholder = "Sanidade";
    sanidade.classList.add("sanidade-fixo");

    const numeros = document.createElement("div");
    numeros.classList.add("numeros-fixo");
    numeros.append(vida, sanidade);

    const campos = document.createElement("div");
    campos.classList.add("campos-fixo");
    campos.append(nome, numeros);

    // × para tirar este cartão
    const remover = document.createElement("button");
    remover.type = "button";
    remover.classList.add("remover-fixo");
    remover.textContent = "×";
    remover.title = "Tirar este personagem";

    remover.addEventListener("click", function() {
        cartao.remove();
        atualizarBotoesRemover();
    });

    cartao.append(foto, campos, remover);
    listaFixos.appendChild(cartao);
    atualizarBotoesRemover();

    return cartao;
}

// Com um cartão só, o × some: precisa sobrar pelo menos um
function atualizarBotoesRemover() {
    const cartoes = listaFixos.querySelectorAll(".cartao-fixo");

    cartoes.forEach(function(cartao) {
        cartao.querySelector(".remover-fixo").hidden = cartoes.length === 1;
    });
}

botaoAdicionarFixo.addEventListener("click", function() {
    adicionarCartaoFixo().querySelector(".nome-fixo").focus();
});

// Lê os cartões e devolve { personagens, erro }.
// Cartão todo em branco é ignorado; cartão pela metade é erro.
function lerFixos() {
    const personagensFixos = {};

    for (const cartao of listaFixos.querySelectorAll(".cartao-fixo")) {
        const nome = cartao.querySelector(".nome-fixo").value.trim();
        const vida = Number(cartao.querySelector(".vida-fixo").value);
        const sanidade = Number(cartao.querySelector(".sanidade-fixo").value);

        if (!nome && !vida && !sanidade && !cartao.imagem) {
            continue;
        }

        if (!nome) {
            return { erro: "Falta o nome de um personagem fixo." };
        }

        if (!(vida > 0)) {
            return { erro: `Dê a vida de ${nome} (maior que zero).` };
        }

        // Mesmo jeito de criar o id que a barra lateral usa
        const id = nome.toLowerCase().replaceAll(" ", "-");

        if (personagensFixos[id]) {
            return { erro: `Tem dois personagens chamados "${nome}".` };
        }

        const personagem = {
            nome: nome,
            hp: vida,
            hpMaximo: vida,
            tipo: "player",
            fixo: true,
            imagem: cartao.imagem
        };

        // Sanidade é opcional: sem ela, o painel não mostra a barra
        if (sanidade > 0) {
            personagem.sanidade = sanidade;
            personagem.sanidadeMaxima = sanidade;
        }

        personagensFixos[id] = personagem;
    }

    if (Object.keys(personagensFixos).length === 0) {
        return { erro: "Adicione pelo menos um personagem fixo (nome e vida)." };
    }

    return { personagens: personagensFixos };
}


function abrirJanelaCampanha() {
    campoNomeCampanha.value = "";
    campoImagemCampanha.value = "";
    imagemNova = null;
    previaCampanha.hidden = true;
    textoImagemCampanha.hidden = false;

    // Começa com um cartão vazio
    listaFixos.innerHTML = "";
    adicionarCartaoFixo();

    janelaCampanha.style.display = "flex";
    campoNomeCampanha.focus();
}

function fecharJanelaCampanha() {
    janelaCampanha.style.display = "none";
}

botaoNovaCampanha.addEventListener("click", abrirJanelaCampanha);
botaoCancelarCampanha.addEventListener("click", fecharJanelaCampanha);

// Clicar no fundo escuro também fecha
janelaCampanha.addEventListener("click", function(event) {
    if (event.target === janelaCampanha) {
        fecharJanelaCampanha();
    }
});

document.addEventListener("keydown", function(event) {
    if (event.key === "Escape") {
        fecharJanelaCampanha();
    }
});

campoImagemCampanha.addEventListener("change", function() {
    const arquivo = campoImagemCampanha.files[0];

    if (!arquivo) {
        return;
    }

    // A imagem aparece num círculo pequeno, então 500px já sobra
    otimizarImagem(arquivo, function(imagemOtimizada) {
        imagemNova = imagemOtimizada;
        previaCampanha.src = imagemOtimizada;
        previaCampanha.hidden = false;
        textoImagemCampanha.hidden = true;
    });
});

async function criarCampanha() {
    const nome = campoNomeCampanha.value.trim();

    if (!nome) {
        alert("Dê um nome para a campanha.");
        campoNomeCampanha.focus();
        return;
    }

    const fixos = lerFixos();

    if (fixos.erro) {
        alert(fixos.erro);
        return;
    }

    // Evita criar duas vezes com cliques seguidos enquanto o banco responde
    botaoCriarCampanha.disabled = true;

    try {
        // O banco devolve a campanha já com o id e o código
        const nova = await inserirCampanha(nome, imagemNova);

        try {
            await salvarFixos(nova.id, fixos.personagens);
        } catch (erro) {
            // Sem os fixos a campanha fica pela metade: desfaz e avisa
            await clienteSupabase.from("campanhas").delete().eq("id", nova.id);
            Armazenamento.apagarCampanha(nova.id);
            throw erro;
        }

        campanhas.push(nova);

        guardarCopiaLocal();
        fecharJanelaCampanha();
        desenharRoda();

    } catch (erro) {
        console.error(erro);
        alert(`Não foi possível criar a campanha: ${motivoDoErro(erro)}.`);

    } finally {
        botaoCriarCampanha.disabled = false;
    }
}

// Envia as fotos dos fixos para a pasta da campanha nova e grava os
// personagens nela. "await" em cada passo: só termina quando o banco
// confirmou tudo.
async function salvarFixos(idCampanha, personagensFixos) {
    for (const id in personagensFixos) {
        const personagem = personagensFixos[id];

        if (personagem.imagem) {
            personagem.imagem = await enviarImagemParaStorage(personagem.imagem, idCampanha);
        }
    }

    await Armazenamento.salvarEmCampanha("personagens", idCampanha, personagensFixos);
}

botaoCriarCampanha.addEventListener("click", criarCampanha);

// Enter no campo do nome também cria
campoNomeCampanha.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        criarCampanha();
    }
});


carregarCampanhas();
