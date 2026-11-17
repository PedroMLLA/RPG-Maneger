// Janela do inventário (aberta pelo menu do botão direito).

const opcaoInventario = document.getElementById("opcao-inventario");

opcaoInventario.addEventListener("click", function() {
    // Guardamos o id ANTES de fechar, porque fechar o menu apaga idDoMenu
    const id = idDoMenu;

    fecharMenuContexto();
    abrirInventario(id);
});

// ----- Inventário -----
const janelaInventario = document.getElementById("janela-inventario");
const alternarInventarioVisivel = document.getElementById("alternar-inventario-visivel");

alternarInventarioVisivel.addEventListener("click", function() {
    alternarVisibilidade(idInventario, "inventarioVisivel", alternarInventarioVisivel);
});
const tituloInventario = document.getElementById("titulo-inventario");
const listaInventario = document.getElementById("lista-inventario");
const inventarioVazio = document.getElementById("inventario-vazio");
const nomeItem = document.getElementById("nome-item");
const quantidadeItem = document.getElementById("quantidade-item");
const botaoAdicionarItem = document.getElementById("botao-adicionar-item");
const botaoSalvarInventario = document.getElementById("botao-salvar-inventario");
const botaoCancelarInventario = document.getElementById("botao-cancelar-inventario");

// De quem é o inventário aberto
let idInventario = null;

// Uma CÓPIA dos itens, onde fazemos as edições. Ela só vira o
// inventário de verdade quando o mestre clica em "Salvar".
let inventarioRascunho = [];

function abrirInventario(id) {
    idInventario = id;

    // .map() cria uma lista nova, e { ...item } copia cada item.
    // Assim, mexer no rascunho não altera o original sem querer.
    const inventarioAtual = personagens[id].inventario || [];

    inventarioRascunho = inventarioAtual.map(function(item) {
        return { ...item };
    });

    tituloInventario.textContent = `🎒 Inventário de ${personagens[id].nome}`;

    atualizarBotaoVisivel(alternarInventarioVisivel, personagens[id].inventarioVisivel);

    desenharInventario();

    janelaInventario.style.display = "flex";
    nomeItem.focus();
}

function fecharInventario() {
    janelaInventario.style.display = "none";
    idInventario = null;
    nomeItem.value = "";
    quantidadeItem.value = 1;
}

// Redesenha a lista a partir do rascunho
function desenharInventario() {
    listaInventario.innerHTML = "";

    inventarioRascunho.forEach(function(item, indice) {

        const linha = document.createElement("li");
        linha.classList.add("item-inventario");

        const nome = document.createElement("span");
        nome.classList.add("nome-item-inventario");
        nome.textContent = item.nome;

        const quantidade = document.createElement("input");
        quantidade.type = "number";
        quantidade.min = 1;
        quantidade.value = item.quantidade;
        quantidade.title = "Quantidade";

        quantidade.addEventListener("change", function() {
            // Nunca menos que 1: para tirar o item, use o ✕
            item.quantidade = Math.max(1, Number(quantidade.value) || 1);
            quantidade.value = item.quantidade;
        });

        const remover = document.createElement("button");
        remover.classList.add("remover-item");
        remover.textContent = "✕";
        remover.title = "Remover item";

        remover.addEventListener("click", function() {
            // splice(posição, 1) tira 1 elemento daquela posição da lista
            inventarioRascunho.splice(indice, 1);
            desenharInventario();
        });

        linha.append(nome, quantidade, remover);
        listaInventario.appendChild(linha);
    });

    inventarioVazio.style.display =
        inventarioRascunho.length > 0 ? "none" : "block";
}

function adicionarItem() {
    const nome = nomeItem.value.trim();

    if (nome === "") {
        return;
    }

    inventarioRascunho.push({
        nome: nome,
        quantidade: Math.max(1, Number(quantidadeItem.value) || 1)
    });

    nomeItem.value = "";
    quantidadeItem.value = 1;
    nomeItem.focus();

    desenharInventario();
}

botaoAdicionarItem.addEventListener("click", adicionarItem);

// Apertar Enter no nome do item também adiciona
nomeItem.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        adicionarItem();
    }
});

botaoSalvarInventario.addEventListener("click", function() {
    personagens[idInventario].inventario = inventarioRascunho;

    // Salvar dispara o "storage" e a visão dos jogadores se atualiza
    salvarPersonagemNoStorage(idInventario);

    fecharInventario();
});

// Cancelar só fecha: o rascunho é descartado
botaoCancelarInventario.addEventListener("click", fecharInventario);
