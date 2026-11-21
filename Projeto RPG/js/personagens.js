// Barra lateral: formulário de criar personagem e os botões
// de cada personagem/inimigo.

const botaoCriarPersonagem = document.getElementById("botao-criar-personagem");
const formularioPersonagem = document.getElementById("formulario-personagem");

botaoCriarPersonagem.addEventListener("click", function() {
    formularioPersonagem.style.display = "block";
});

const confirmarCriacao = document.getElementById("confirmar-criacao");

const nomeNovoPersonagem = document.getElementById("nome-novo-personagem");
const hpNovoPersonagem = document.getElementById("hp-novo-personagem");
const sanidadeNovoPersonagem = document.getElementById("sanidade-novo-personagem");
const tipoNovoPersonagem = document.getElementById("tipo-novo-personagem");
const imagemNovoPersonagem = document.getElementById("imagem-novo-personagem");

confirmarCriacao.addEventListener("click", function() {

    const nome = nomeNovoPersonagem.value;
    const hp = Number(hpNovoPersonagem.value);
    const sanidade = Number(sanidadeNovoPersonagem.value);
    const tipo = tipoNovoPersonagem.value;
    const arquivo = imagemNovoPersonagem.files[0];

    const id = nome.toLowerCase().replaceAll(" ", "-");

    function salvarPersonagem(imagem) {

        personagens[id] = {
            nome: nome,
            hp: hp,
            hpMaximo: hp,
            sanidade: sanidade,
            sanidadeMaxima: sanidade,
            tipo: tipo,
            imagem: imagem
        };

        salvarPersonagemNoStorage(id);

        criarBotaoPersonagem(id);

        nomeNovoPersonagem.value = "";
        hpNovoPersonagem.value = "";
        sanidadeNovoPersonagem.value = "";
        imagemNovoPersonagem.value = "";

        formularioPersonagem.style.display = "none";
    }

    if (arquivo) {
        otimizarImagem(arquivo, function(imagemOtimizada) {
            salvarPersonagem(imagemOtimizada);
        });
    } else {
        salvarPersonagem(null);
    }

});

// Cria o botão de um personagem na barra lateral
// (jogadores em "Personagens", inimigos em "Inimigos").
function criarBotaoPersonagem(id) {
    const personagem = personagens[id];

    const novoBotao = document.createElement("button");
    novoBotao.textContent = personagem.nome;

    // Guarda o id no botão, para conseguir achá-lo e removê-lo depois
    novoBotao.dataset.id = id;

    novoBotao.addEventListener("click", function() {
        criarPersonagem(
            id,
            personagens[id].nome.charAt(0).toUpperCase(),
            300,
            200,
            personagens[id].tipo,
            tamanhoEmPixels(personagens[id].tamanho)
        );
    });

    if (personagem.tipo === "inimigo") {
        document.getElementById("lista-inimigos").appendChild(novoBotao);
    } else {
        document.getElementById("lista-personagens").appendChild(novoBotao);
    }
}
