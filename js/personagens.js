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

    // Os fixos da campanha não têm × (são o grupo principal):
    // no lugar dele vem o ✎, que edita a vida e a sanidade
    if (ehFixo(id)) {
        const editar = document.createElement("button");
        editar.classList.add("editar-personagem");
        editar.textContent = "✎";
        editar.title = `Editar vida e sanidade de ${personagem.nome}`;

        editar.addEventListener("click", function() {
            abrirEditarFixo(id);
        });

        linha.appendChild(editar);

    } else {
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

// ----- Editar vida e sanidade de um fixo (o ✎) -----
// Serve para quando o personagem sobe de nível, por exemplo: muda a
// vida/sanidade máxima. A atual também pode ser acertada aqui.

const janelaEditarFixo = document.getElementById("janela-editar-fixo");
const tituloEditarFixo = document.getElementById("titulo-editar-fixo");
const editarHp = document.getElementById("editar-hp");
const editarHpMaximo = document.getElementById("editar-hp-maximo");
const editarSanidade = document.getElementById("editar-sanidade");
const editarSanidadeMaxima = document.getElementById("editar-sanidade-maxima");

// Quem está sendo editado agora
let idEditandoFixo = null;

function abrirEditarFixo(id) {
    const personagem = personagens[id];

    if (!personagem) {
        return;
    }

    idEditandoFixo = id;
    tituloEditarFixo.textContent = `✎ ${personagem.nome}`;

    editarHp.value = personagem.hp;
    editarHpMaximo.value = personagem.hpMaximo;

    // Sem sanidade: os campos ficam vazios
    const temSanidade = personagem.sanidadeMaxima > 0;
    editarSanidade.value = temSanidade ? personagem.sanidade : "";
    editarSanidadeMaxima.value = temSanidade ? personagem.sanidadeMaxima : "";

    janelaEditarFixo.style.display = "flex";
    editarHpMaximo.focus();
}

function fecharEditarFixo() {
    janelaEditarFixo.style.display = "none";
    idEditandoFixo = null;
}

// Número de um campo; vazio vira o "padrao".
// Math.max(0, ...) não deixa ficar negativo.
function numeroDoCampo(campo, padrao) {
    if (campo.value.trim() === "") {
        return padrao;
    }

    return Math.max(0, Math.round(Number(campo.value)));
}

function salvarEditarFixo() {
    const id = idEditandoFixo;
    const personagem = personagens[id];

    if (!personagem) {
        fecharEditarFixo();
        return;
    }

    const hpMaximo = numeroDoCampo(editarHpMaximo, 0);

    if (!(hpMaximo >= 1)) {
        alert("A vida máxima precisa ser pelo menos 1.");
        editarHpMaximo.focus();
        return;
    }

    const vidaAntes = personagem.hp;

    // Atual vazia = cheia. E nunca passa da máxima.
    personagem.hpMaximo = hpMaximo;
    personagem.hp = Math.min(numeroDoCampo(editarHp, hpMaximo), hpMaximo);

    const sanidadeMaxima = numeroDoCampo(editarSanidadeMaxima, 0);

    if (sanidadeMaxima > 0) {
        personagem.sanidadeMaxima = sanidadeMaxima;
        personagem.sanidade = Math.min(numeroDoCampo(editarSanidade, sanidadeMaxima), sanidadeMaxima);
    } else {
        // 0 ou vazio: fica sem sanidade (o painel esconde a barra)
        delete personagem.sanidade;
        delete personagem.sanidadeMaxima;
    }

    // Salva: as outras telas do mestre e os jogadores ficam sabendo
    salvarPersonagemNoStorage(id);

    // Token no mapa: barra de vida, "derrotado"...
    if (personagensCriados[id]) {
        atualizarEstadoToken(personagensCriados[id], personagem);
    }

    // O painel de vida estava aberto nele? Mostra os números novos
    if (painelPersonagem.style.display === "block" && idSelecionado === id) {
        abrirPainelPersonagem(id);
    }

    fecharEditarFixo();

    // Caiu para 0 ou voltou de 0: mesma regra do Dano e da Cura
    verificarMorrendo(id, vidaAntes);
    verificarSalvamento(id);
}

document.getElementById("botao-cancelar-editar-fixo").addEventListener("click", fecharEditarFixo);
document.getElementById("botao-salvar-editar-fixo").addEventListener("click", salvarEditarFixo);

// Fundo escuro fecha; Enter salva; Esc fecha
janelaEditarFixo.addEventListener("click", function(event) {
    if (event.target === janelaEditarFixo) {
        fecharEditarFixo();
    }
});

janelaEditarFixo.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        salvarEditarFixo();
    } else if (event.key === "Escape") {
        fecharEditarFixo();
    }
});


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
