// Janela das habilidades: nome, dados de dano e descrição.

// ----- Habilidades (nome, dados de dano, descrição) -----
// Mesmo esquema do inventário: rascunho + Salvar + botão de mostrar.
const opcaoHabilidades = document.getElementById("opcao-habilidades");
const janelaHabilidades = document.getElementById("janela-habilidades");
const tituloHabilidades = document.getElementById("titulo-habilidades");
const alternarHabilidadesVisivel = document.getElementById("alternar-habilidades-visivel");
const listaHabilidades = document.getElementById("lista-habilidades");
const habilidadesVazio = document.getElementById("habilidades-vazio");
const nomeHabilidade = document.getElementById("nome-habilidade");
const danoHabilidade = document.getElementById("dano-habilidade");
const descricaoHabilidade = document.getElementById("descricao-habilidade");
const botaoAdicionarHabilidade = document.getElementById("botao-adicionar-habilidade");
const botaoSalvarHabilidades = document.getElementById("botao-salvar-habilidades");
const botaoCancelarHabilidades = document.getElementById("botao-cancelar-habilidades");

let idHabilidades = null;
let habilidadesRascunho = [];

opcaoHabilidades.addEventListener("click", function() {
    const id = idDoMenu;

    fecharMenuContexto();
    abrirHabilidades(id);
});

alternarHabilidadesVisivel.addEventListener("click", function() {
    alternarVisibilidade(idHabilidades, "habilidadesVisivel", alternarHabilidadesVisivel);
});

function abrirHabilidades(id) {
    idHabilidades = id;

    const personagem = personagens[id];

    habilidadesRascunho = (personagem.habilidades || []).map(function(habilidade) {
        return { ...habilidade };
    });

    tituloHabilidades.textContent = `🔥 Habilidades de ${personagem.nome}`;

    atualizarBotaoVisivel(alternarHabilidadesVisivel, personagem.habilidadesVisivel);

    desenharHabilidades();

    janelaHabilidades.style.display = "flex";
    nomeHabilidade.focus();
}

function fecharHabilidades() {
    janelaHabilidades.style.display = "none";
    idHabilidades = null;
    nomeHabilidade.value = "";
    danoHabilidade.value = "";
    descricaoHabilidade.value = "";
}

// Cria um campo ligado a uma propriedade da habilidade:
// o que for digitado vai direto para o rascunho.
function campoDaHabilidade(habilidade, propriedade, tipoDeCampo, textoDeAjuda) {
    const campo = document.createElement(tipoDeCampo); // "input" ou "textarea"

    if (tipoDeCampo === "input") {
        campo.type = "text";
    } else {
        campo.rows = 2;
    }

    campo.value = habilidade[propriedade] || "";
    campo.placeholder = textoDeAjuda;
    campo.classList.add(`campo-${propriedade}`);

    campo.addEventListener("input", function() {
        habilidade[propriedade] = campo.value;
    });

    return campo;
}

function desenharHabilidades() {
    listaHabilidades.innerHTML = "";

    habilidadesRascunho.forEach(function(habilidade, indice) {

        const cartao = document.createElement("div");
        cartao.classList.add("cartao-habilidade-edicao");

        const linhaDeCima = document.createElement("div");
        linhaDeCima.classList.add("linha-habilidade");

        const remover = document.createElement("button");
        remover.classList.add("remover-item");
        remover.textContent = "✕";
        remover.title = "Remover habilidade";

        remover.addEventListener("click", function() {
            habilidadesRascunho.splice(indice, 1);
            desenharHabilidades();
        });

        linhaDeCima.append(
            campoDaHabilidade(habilidade, "nome", "input", "Nome"),
            campoDaHabilidade(habilidade, "dano", "input", "Dano"),
            remover
        );

        cartao.append(
            linhaDeCima,
            campoDaHabilidade(habilidade, "descricao", "textarea", "Descrição")
        );

        listaHabilidades.appendChild(cartao);
    });

    habilidadesVazio.style.display =
        habilidadesRascunho.length > 0 ? "none" : "block";
}

botaoAdicionarHabilidade.addEventListener("click", function() {
    const nome = nomeHabilidade.value.trim();

    if (nome === "") {
        nomeHabilidade.focus();
        return;
    }

    habilidadesRascunho.push({
        nome: nome,
        dano: danoHabilidade.value.trim(),
        descricao: descricaoHabilidade.value.trim()
    });

    nomeHabilidade.value = "";
    danoHabilidade.value = "";
    descricaoHabilidade.value = "";
    nomeHabilidade.focus();

    desenharHabilidades();
});

botaoSalvarHabilidades.addEventListener("click", function() {
    // Tira espaços sobrando e descarta habilidades que ficaram sem nome
    personagens[idHabilidades].habilidades = habilidadesRascunho
        .map(function(habilidade) {
            return {
                nome: (habilidade.nome || "").trim(),
                dano: (habilidade.dano || "").trim(),
                descricao: (habilidade.descricao || "").trim()
            };
        })
        .filter(function(habilidade) {
            return habilidade.nome !== "";
        });

    salvarPersonagemNoStorage(idHabilidades);

    fecharHabilidades();
});

botaoCancelarHabilidades.addEventListener("click", fecharHabilidades);
