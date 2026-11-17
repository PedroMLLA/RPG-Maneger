// Janela da ficha na tela do mestre: roda de atributos + perícias.
// (O desenho da roda em si fica em ficha.js.)

// ----- Ficha (atributos + perícias) -----
// Mesma ideia do inventário: editamos rascunhos e só gravamos no "Salvar".
const opcaoFicha = document.getElementById("opcao-ficha");
const janelaFicha = document.getElementById("janela-ficha");
const tituloFicha = document.getElementById("titulo-ficha");
const alternarFichaVisivel = document.getElementById("alternar-ficha-visivel");
const areaRoda = document.getElementById("area-roda");
const listaPericias = document.getElementById("lista-pericias");
const periciasVazio = document.getElementById("pericias-vazio");
const nomePericia = document.getElementById("nome-pericia");
const bonusPericia = document.getElementById("bonus-pericia");
const botaoAdicionarPericia = document.getElementById("botao-adicionar-pericia");
const botaoSalvarFicha = document.getElementById("botao-salvar-ficha");
const botaoCancelarFicha = document.getElementById("botao-cancelar-ficha");

let idFicha = null;
let atributosRascunho = {};
let periciasRascunho = [];

opcaoFicha.addEventListener("click", function() {
    const id = idDoMenu;

    fecharMenuContexto();
    abrirFicha(id);
});

alternarFichaVisivel.addEventListener("click", function() {
    alternarVisibilidade(idFicha, "fichaVisivel", alternarFichaVisivel);
});

function abrirFicha(id) {
    idFicha = id;

    const personagem = personagens[id];

    // Cópias, para o "Cancelar" funcionar
    atributosRascunho = { ...(personagem.atributos || {}) };

    periciasRascunho = (personagem.pericias || []).map(function(pericia) {
        return { ...pericia };
    });

    tituloFicha.textContent = `📜 Ficha de ${personagem.nome}`;

    atualizarBotaoVisivel(alternarFichaVisivel, personagem.fichaVisivel);

    // A roda edita direto o atributosRascunho (true = editável)
    areaRoda.innerHTML = "";
    areaRoda.appendChild(criarRodaAtributos(atributosRascunho, true));

    desenharPericias();

    janelaFicha.style.display = "flex";
}

function fecharFicha() {
    janelaFicha.style.display = "none";
    idFicha = null;
    nomePericia.value = "";
    bonusPericia.value = 0;
}

function desenharPericias() {
    listaPericias.innerHTML = "";

    periciasRascunho.forEach(function(pericia, indice) {

        const linha = document.createElement("li");
        linha.classList.add("item-inventario");

        const nome = document.createElement("span");
        nome.classList.add("nome-item-inventario");
        nome.textContent = pericia.nome;

        const bonus = document.createElement("input");
        bonus.type = "number";
        bonus.value = pericia.bonus;
        bonus.title = "Bônus";

        bonus.addEventListener("change", function() {
            pericia.bonus = Number(bonus.value) || 0;
            bonus.value = pericia.bonus;
        });

        const remover = document.createElement("button");
        remover.classList.add("remover-item");
        remover.textContent = "✕";
        remover.title = "Remover perícia";

        remover.addEventListener("click", function() {
            periciasRascunho.splice(indice, 1);
            desenharPericias();
        });

        linha.append(nome, bonus, remover);
        listaPericias.appendChild(linha);
    });

    periciasVazio.style.display =
        periciasRascunho.length > 0 ? "none" : "block";
}

function adicionarPericia() {
    const nome = nomePericia.value.trim();

    if (nome === "") {
        return;
    }

    periciasRascunho.push({
        nome: nome,
        bonus: Number(bonusPericia.value) || 0
    });

    nomePericia.value = "";
    bonusPericia.value = 0;
    nomePericia.focus();

    desenharPericias();
}

botaoAdicionarPericia.addEventListener("click", adicionarPericia);

nomePericia.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        adicionarPericia();
    }
});

botaoSalvarFicha.addEventListener("click", function() {
    personagens[idFicha].atributos = atributosRascunho;
    personagens[idFicha].pericias = periciasRascunho;

    salvarPersonagemNoStorage(idFicha);

    fecharFicha();
});

botaoCancelarFicha.addEventListener("click", fecharFicha);
