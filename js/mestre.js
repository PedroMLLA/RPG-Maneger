// Painel do Mestre (mestre.html): criar inimigos e controlar a vida deles.
// Conversa com o mapa pelo localStorage (evento "storage").

const listaInimigosMestre =
    document.getElementById("lista-inimigos-mestre");


// Confere no estado da batalha (salvo pelo mapa) se o token está lá
function estaNoMapa(id) {
    const estado = JSON.parse(
        localStorage.getItem(chave("estadoBatalha"))
    ) || { tokens: {} };

    return Boolean(estado.tokens[id]);
}

function atualizarInimigos() {

    listaInimigosMestre.innerHTML = "";

    const personagensSalvos = JSON.parse(
        localStorage.getItem(chave("personagens"))
    ) || {};


    for (const id in personagensSalvos) {

        const personagem = personagensSalvos[id];


        if (personagem.tipo !== "inimigo") {
            continue;
        }


        const divInimigo = document.createElement("div");

        divInimigo.classList.add("inimigo-mestre");


        divInimigo.innerHTML = `
            <h4>${personagem.nome}</h4>

            <p>
                HP:
                <span class="hp-inimigo">
                    ${personagem.hp}
                </span>
                /
                ${personagem.hpMaximo}
            </p>

            <p>
                Tamanho: ${personagem.tamanho}
            </p>

            <input
                type="number"
                class="valor-dano"
                placeholder="Valor"
                min="1"
            >

            <button class="botao-adicionar-mapa">
                Adicionar ao mapa
            </button>

            <button class="botao-dano-inimigo">
                Dano
            </button>

            <button class="botao-cura-inimigo">
                Cura
            </button>

            <button class="botao-excluir-inimigo">
                Excluir
            </button>
        `;
        


        const inputDano =
            divInimigo.querySelector(".valor-dano");

        const botaoDano =
            divInimigo.querySelector(".botao-dano-inimigo");

        const botaoCura =
            divInimigo.querySelector(".botao-cura-inimigo");

        const botaoExcluir =
            divInimigo.querySelector(".botao-excluir-inimigo");

        const botaoAdicionarMapa =
            divInimigo.querySelector(".botao-adicionar-mapa");

        // O botão sabe se o inimigo está no mapa olhando o estado da batalha
        if (estaNoMapa(id)) {
            botaoAdicionarMapa.textContent = "Já está no mapa";
            botaoAdicionarMapa.disabled = true;
        }

        botaoAdicionarMapa.addEventListener("click", function() {

            // Mandamos só o id: o mapa já tem os dados do inimigo
            // (inclusive a imagem), então não precisamos copiá-los de novo.
            // O "momento" muda a cada clique, garantindo que o evento
            // "storage" dispare mesmo se for o mesmo inimigo de antes.
            localStorage.setItem(
                "inimigoParaMapa",
                JSON.stringify({
                    id: id,
                    momento: Date.now()
                })
            );

            botaoAdicionarMapa.textContent = "Já está no mapa";
            botaoAdicionarMapa.disabled = true;

        });


        botaoDano.addEventListener("click", function() {

            const valor = Number(inputDano.value);
            const vidaAntes = personagem.hp;

            personagem.hp -= valor;


            if (personagem.hp < 0) {
                personagem.hp = 0;
            }

            if (valor > 0) {
                // Chegou a 0 agora? Som de morte no lugar do som de dano
                if (vidaAntes > 0 && personagem.hp <= 0) {
                    tocarSomMorte();
                } else {
                    tocarSomDano();
                }
            }


            personagensSalvos[id] = personagem;


            localStorage.setItem(
                chave("personagens"),
                JSON.stringify(personagensSalvos)
            );


            atualizarInimigos();

            inputDano.value = "";

        });


        botaoCura.addEventListener("click", function() {

            const valor = Number(inputDano.value);

            personagem.hp += valor;


            if (personagem.hp > personagem.hpMaximo) {
                personagem.hp = personagem.hpMaximo;
            }


            personagensSalvos[id] = personagem;


            localStorage.setItem(
                chave("personagens"),
                JSON.stringify(personagensSalvos)
            );


            atualizarInimigos();

            inputDano.value = "";

        });

        botaoExcluir.addEventListener("click", function() {

        delete personagensSalvos[id];

        localStorage.setItem(
        chave("personagens"),
        JSON.stringify(personagensSalvos)
    );

        atualizarInimigos();

});


        listaInimigosMestre.appendChild(divInimigo);

    }

}

 const botaoCriarInimigo =
document.getElementById("botao-criar-inimigo");


const formularioInimigo =
document.getElementById("formulario-inimigo");


botaoCriarInimigo.addEventListener("click", function() {

formularioInimigo.style.display = "block";

});

const confirmarInimigo =
document.getElementById("confirmar-inimigo");

const nomeInimigo =
document.getElementById("nome-inimigo");

const hpInimigo =
document.getElementById("hp-inimigo");

const tamanhoInimigo =
document.getElementById("tamanho-inimigo");

const imagemInimigo =
document.getElementById("imagem-inimigo");


confirmarInimigo.addEventListener("click", function() {

const nome = nomeInimigo.value;
const hp = Number(hpInimigo.value);
const tamanho = tamanhoInimigo.value;
const arquivo = imagemInimigo.files[0];

if (nome === "" || hp <= 0) {
return;
}

const id = nome.toLowerCase().replaceAll(" ", "-");

function salvarInimigo(imagem) {

const personagensSalvos = JSON.parse(
    localStorage.getItem(chave("personagens"))
) || {};

personagensSalvos[id] = {
    nome: nome,
    hp: hp,
    hpMaximo: hp,
    sanidade: 0,
    sanidadeMaxima: 0,
    tipo: "inimigo",
    tamanho: tamanho,
    imagem: imagem
};

try {
    localStorage.setItem(
        chave("personagens"),
        JSON.stringify(personagensSalvos)
    );
} catch (erro) {
    alert("Sem espaço para salvar. Tente uma imagem menor.");
    console.error(erro);
    return;
}

nomeInimigo.value = "";
hpInimigo.value = "";
imagemInimigo.value = "";

formularioInimigo.style.display = "none";

atualizarInimigos();
}

if (arquivo) {
otimizarImagem(arquivo, function(imagemOtimizada) {
    salvarInimigo(imagemOtimizada);
});
} else {
salvarInimigo(null);
}

});
atualizarInimigos();


window.addEventListener("storage", function(event) {

    // "estadoBatalha" muda quando um token entra/sai do mapa
    // (inclusive no botão Nova batalha), e aí os botões se atualizam.
    if (event.key === chave("personagens") || event.key === chave("estadoBatalha")) {
        atualizarInimigos();
    }

});
