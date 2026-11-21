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

// Peso / carga
const pesoItem = document.getElementById("peso-item");
const pesoMaximoInput = document.getElementById("peso-maximo");
const textoCarga = document.getElementById("texto-carga");
const barraCarga = document.getElementById("barra-carga");
const cargaInventario = document.getElementById("carga-inventario");

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

    // Peso máximo do personagem (vazio se ainda não foi definido)
    pesoMaximoInput.value = personagens[id].pesoMaximo || "";

    desenharInventario();

    janelaInventario.style.display = "flex";
    nomeItem.focus();
}

function fecharInventario() {
    janelaInventario.style.display = "none";
    idInventario = null;
    nomeItem.value = "";
    quantidadeItem.value = 1;
    pesoItem.value = "";
}

// Recalcula a carga: "12,5 / 30 kg" e a barra.
// Roda sempre que um item, quantidade, peso ou o máximo mudam.
function atualizarCarga() {
    const total = calcularPesoTotal(inventarioRascunho);
    const maximo = Number(pesoMaximoInput.value) || 0;

    if (maximo > 0) {
        textoCarga.textContent = `${formatarPeso(total)} / ${formatarPeso(maximo)} kg`;

        // Math.min: a barra para em 100%, mesmo se passar do limite
        barraCarga.style.width = `${Math.min(100, (total / maximo) * 100)}%`;
    } else {
        // Sem máximo definido: mostra só o total
        textoCarga.textContent = `${formatarPeso(total)} kg`;
        barraCarga.style.width = "0%";
    }

    // Passou do limite: tudo fica vermelho e aparece "Sobrecarregado"
    cargaInventario.classList.toggle("sobrecarregado", maximo > 0 && total > maximo);
}

pesoMaximoInput.addEventListener("input", atualizarCarga);

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
            atualizarCarga();
        });

        // Peso de UMA unidade do item
        const peso = document.createElement("input");
        peso.type = "number";
        peso.min = 0;
        peso.step = 0.1;
        peso.value = item.peso || 0;
        peso.title = "Peso de uma unidade (kg)";

        // "input" (e não "change"): a carga muda enquanto você digita
        peso.addEventListener("input", function() {
            item.peso = Math.max(0, Number(peso.value) || 0);
            atualizarCarga();
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

        linha.append(nome, quantidade, peso, remover);
        listaInventario.appendChild(linha);
    });

    inventarioVazio.style.display =
        inventarioRascunho.length > 0 ? "none" : "block";

    atualizarCarga();
}

function adicionarItem() {
    const nome = nomeItem.value.trim();

    if (nome === "") {
        return;
    }

    inventarioRascunho.push({
        nome: nome,
        quantidade: Math.max(1, Number(quantidadeItem.value) || 1),
        peso: Math.max(0, Number(pesoItem.value) || 0)   // vazio = 0 kg
    });

    nomeItem.value = "";
    quantidadeItem.value = 1;
    pesoItem.value = "";
    nomeItem.focus();

    desenharInventario();
}

botaoAdicionarItem.addEventListener("click", adicionarItem);

// Apertar Enter no nome (ou no peso) do item também adiciona
nomeItem.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        adicionarItem();
    }
});

pesoItem.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        adicionarItem();
    }
});

botaoSalvarInventario.addEventListener("click", function() {
    personagens[idInventario].inventario = inventarioRascunho;

    // O peso máximo também só é gravado no "Salvar" (0 = sem limite)
    personagens[idInventario].pesoMaximo = Math.max(0, Number(pesoMaximoInput.value) || 0);

    // Salvar dispara o "storage" e a visão dos jogadores se atualiza
    salvarPersonagemNoStorage(idInventario);

    fecharInventario();
});

// Cancelar só fecha: o rascunho é descartado
botaoCancelarInventario.addEventListener("click", fecharInventario);
