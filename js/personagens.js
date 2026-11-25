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
        otimizarEEnviar(arquivo, function(imagemOtimizada) {
            salvarPersonagem(imagemOtimizada);
        });
    } else {
        salvarPersonagem(null);
    }

});

// Cria o botão de um personagem na barra lateral
// (jogadores em "Personagens", inimigos em "Inimigos").
// Cada um vira uma "linha": o botão com o nome (põe no mapa) e um ×
// do lado (exclui). Um botão não pode ficar DENTRO de outro, por isso
// os dois ficam lado a lado numa div.
function criarBotaoPersonagem(id) {
    const personagem = personagens[id];

    const linha = document.createElement("div");
    linha.classList.add("linha-personagem");

    // Guarda o id na linha, para conseguir achá-la e removê-la depois
    linha.dataset.id = id;

    const novoBotao = document.createElement("button");
    novoBotao.classList.add("botao-nome");
    novoBotao.textContent = personagem.nome;

    linha.appendChild(novoBotao);

    // Os fixos da campanha não têm × (são o grupo principal)
    if (!ehFixo(id)) {
        const excluir = document.createElement("button");
        excluir.classList.add("excluir-personagem");
        excluir.textContent = "×";
        excluir.title = `Excluir ${personagem.nome}`;

        excluir.addEventListener("click", function() {
            excluirPersonagem(id);
        });

        linha.appendChild(excluir);
    }

    novoBotao.addEventListener("click", function() {
        criarPersonagem(
            id,
            personagens[id].nome.charAt(0).toUpperCase(),
            300,
            200,
            personagens[id].tipo || "player",
            tamanhoEmPixels(personagens[id].tamanho)
        );
    });

    if (personagem.tipo === "inimigo") {
        document.getElementById("lista-inimigos").appendChild(linha);
    } else {
        document.getElementById("lista-personagens").appendChild(linha);
    }
}

// Tira o personagem da aba, do mapa (se estiver lá) e dos dados salvos.
function excluirPersonagem(id) {
    const personagem = personagens[id];

    if (!personagem) {
        return;
    }

    if (!confirm(`Excluir "${personagem.nome}"? Ele some da aba e do mapa, e a ficha dele é apagada.`)) {
        return;
    }

    // Do mapa: atualizarIniciativa() salva a batalha sem ele
    if (personagensCriados[id]) {
        personagensCriados[id].remove();
        delete personagensCriados[id];
        atualizarIniciativa();
    }

    // O painel de vida estava aberto nele? Fecha
    if (personagemSelecionado === personagem) {
        painelPersonagem.style.display = "none";
    }

    // Da aba
    const linha = document.querySelector(`.linha-personagem[data-id="${CSS.escape(id)}"]`);

    if (linha) {
        linha.remove();
    }

    // Dos dados salvos (as outras telas e os jogadores ficam sabendo)
    delete personagens[id];

    const salvos = Armazenamento.ler("personagens", {});
    delete salvos[id];

    try {
        Armazenamento.salvar("personagens", salvos);
    } catch (erro) {
        console.error(erro);
    }

    // A imagem dele no Storage também
    apagarImagemDoStorage(personagem.imagem);
}
