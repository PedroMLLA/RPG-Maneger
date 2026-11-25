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

const fixoNovoPersonagem = document.getElementById("fixo-novo-personagem");
const opcaoFixoNovo = document.getElementById("opcao-fixo-novo");

// Inimigo não pode ser fixo: a opção some
function atualizarOpcaoFixo() {
    opcaoFixoNovo.hidden = tipoNovoPersonagem.value === "inimigo";
}

tipoNovoPersonagem.addEventListener("change", atualizarOpcaoFixo);

confirmarCriacao.addEventListener("click", function() {

    const nome = nomeNovoPersonagem.value.trim();
    const hp = Number(hpNovoPersonagem.value);
    const sanidade = Number(sanidadeNovoPersonagem.value);
    const tipo = tipoNovoPersonagem.value;
    const fixo = tipo !== "inimigo" && fixoNovoPersonagem.checked;
    const arquivo = imagemNovoPersonagem.files[0];

    if (!nome) {
        alert("Dê um nome para o personagem.");
        return;
    }

    const id = nome.toLowerCase().replaceAll(" ", "-");

    // Mesmo id = mesmo personagem: criar de novo apagaria o que já existe
    if (personagens[id]) {
        alert(`Já existe um personagem chamado "${personagens[id].nome}".`);
        return;
    }

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

        if (fixo) {
            personagens[id].fixo = true;
        }

        salvarPersonagemNoStorage(id);

        desenharListaPersonagens();

        nomeNovoPersonagem.value = "";
        hpNovoPersonagem.value = "";
        sanidadeNovoPersonagem.value = "";
        imagemNovoPersonagem.value = "";
        fixoNovoPersonagem.checked = false;

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

// Monta as duas listas da barra lateral do zero: os fixos primeiro,
// depois os outros. Chamada ao abrir o mapa e sempre que alguém é
// criado, editado ou excluído (aqui ou em outra tela do mestre).
function desenharListaPersonagens() {
    document.getElementById("lista-personagens").innerHTML = "";
    document.getElementById("lista-inimigos").innerHTML = "";

    const ids = Object.keys(personagens).sort(function(a, b) {
        return ehFixo(b) - ehFixo(a);   // true vale 1 e false vale 0
    });

    for (const id of ids) {
        if (personagens[id] && personagens[id].nome) {
            criarBotaoPersonagem(id);
        }
    }
}

// Cria o botão de um personagem na barra lateral
// (jogadores em "Personagens", inimigos em "Inimigos").
// Cada um vira uma "linha": o botão com o nome (põe no mapa), o ✎
// (edita) e, para quem não é fixo, o × (exclui). Um botão não pode
// ficar DENTRO de outro, por isso ficam lado a lado numa div.
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

    // ✎: todo mundo pode ser editado
    const editar = document.createElement("button");
    editar.classList.add("editar-personagem");
    editar.textContent = "✎";
    editar.title = `Editar ${personagem.nome}`;

    editar.addEventListener("click", function() {
        abrirEditarPersonagem(id);
    });

    linha.appendChild(editar);

    // ×: os fixos não têm (são o grupo principal)
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

// ----- Editar um personagem (o ✎) -----
// Nome, imagem, vida, sanidade e se ele é fixo. Serve para quando o
// personagem sobe de nível, troca de visual, entra ou sai do grupo...

const janelaEditar = document.getElementById("janela-editar");
const tituloEditar = document.getElementById("titulo-editar");
const editarNome = document.getElementById("editar-nome");
const imagemEditar = document.getElementById("imagem-editar");
const previaEditar = document.getElementById("previa-editar");
const iconeEditar = document.getElementById("icone-editar");
const editarHp = document.getElementById("editar-hp");
const editarHpMaximo = document.getElementById("editar-hp-maximo");
const editarSanidade = document.getElementById("editar-sanidade");
const editarSanidadeMaxima = document.getElementById("editar-sanidade-maxima");
const editarFixo = document.getElementById("editar-fixo");
const opcaoFixoEditar = document.getElementById("opcao-fixo-editar");
const botaoSalvarEditar = document.getElementById("botao-salvar-editar");

// Quem está sendo editado agora
let idEditando = null;

// Imagem nova escolhida (base64). Só vai para o Storage ao Salvar:
// se o mestre cancelar, nada sobra lá.
let imagemNovaEditar = null;

// Mostra uma imagem (ou o ícone, se não houver) no círculo da janela
function mostrarPreviaEditar(imagem) {
    previaEditar.hidden = !imagem;
    iconeEditar.hidden = Boolean(imagem);

    if (imagem) {
        previaEditar.src = imagem;
    }
}

function abrirEditarPersonagem(id) {
    const personagem = personagens[id];

    if (!personagem) {
        return;
    }

    idEditando = id;
    imagemNovaEditar = null;
    imagemEditar.value = "";

    tituloEditar.textContent = `✎ ${personagem.nome}`;
    editarNome.value = personagem.nome;
    mostrarPreviaEditar(personagem.imagem);

    editarHp.value = personagem.hp;
    editarHpMaximo.value = personagem.hpMaximo;

    // Sem sanidade: os campos ficam vazios
    const temSanidade = personagem.sanidadeMaxima > 0;
    editarSanidade.value = temSanidade ? personagem.sanidade : "";
    editarSanidadeMaxima.value = temSanidade ? personagem.sanidadeMaxima : "";

    // Inimigo não pode ser fixo
    opcaoFixoEditar.hidden = personagem.tipo === "inimigo";
    editarFixo.checked = ehFixo(id);

    janelaEditar.style.display = "flex";
    editarNome.focus();
}

function fecharEditar() {
    janelaEditar.style.display = "none";
    idEditando = null;
    imagemNovaEditar = null;
}

imagemEditar.addEventListener("change", function() {
    if (!imagemEditar.files[0]) {
        return;
    }

    otimizarImagem(imagemEditar.files[0], function(imagemOtimizada) {
        imagemNovaEditar = imagemOtimizada;
        mostrarPreviaEditar(imagemOtimizada);
    });
});

// Número de um campo; vazio vira o "padrao".
// Math.max(0, ...) não deixa ficar negativo.
function numeroDoCampo(campo, padrao) {
    if (campo.value.trim() === "") {
        return padrao;
    }

    return Math.max(0, Math.round(Number(campo.value)));
}

// "async" porque a imagem nova precisa terminar de subir antes de salvar
async function salvarEditar() {
    const id = idEditando;
    const personagem = personagens[id];

    if (!personagem) {
        fecharEditar();
        return;
    }

    const nome = editarNome.value.trim();

    if (!nome) {
        alert("Dê um nome para o personagem.");
        editarNome.focus();
        return;
    }

    const hpMaximo = numeroDoCampo(editarHpMaximo, 0);

    if (!(hpMaximo >= 1)) {
        alert("A vida máxima precisa ser pelo menos 1.");
        editarHpMaximo.focus();
        return;
    }

    // Tirar o "fixo" do ÚLTIMO fixo deixaria a campanha sem nenhum.
    // Aí o site acharia que é uma campanha antiga e traria Nero e cia.
    const outrosFixos = Object.keys(personagens).filter(function(outro) {
        return outro !== id && ehFixo(outro);
    });

    if (ehFixo(id) && !editarFixo.checked && outrosFixos.length === 0) {
        alert("A campanha precisa de pelo menos um personagem fixo.");
        return;
    }

    // Imagem nova: sobe primeiro (o botão fica travado enquanto isso)
    let imagemNova = null;

    if (imagemNovaEditar) {
        botaoSalvarEditar.disabled = true;
        botaoSalvarEditar.textContent = "Enviando...";

        imagemNova = await enviarImagemParaStorage(imagemNovaEditar);

        botaoSalvarEditar.disabled = false;
        botaoSalvarEditar.textContent = "Salvar";

        // A janela foi fechada (ou trocou de personagem) durante o envio
        if (idEditando !== id) {
            apagarImagemDoStorage(imagemNova);
            return;
        }
    }

    const vidaAntes = personagem.hp;

    personagem.nome = nome;

    if (imagemNova) {
        // A antiga sai do Storage (as da pasta do projeto são ignoradas)
        apagarImagemDoStorage(personagem.imagem);
        personagem.imagem = imagemNova;
    }

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

    if (personagem.tipo !== "inimigo" && editarFixo.checked) {
        personagem.fixo = true;
    } else {
        delete personagem.fixo;
    }

    // Salva: as outras telas do mestre e os jogadores ficam sabendo
    salvarPersonagemNoStorage(id);

    // Nome, ✎ e × na barra lateral
    desenharListaPersonagens();

    // Token no mapa: imagem/letra, barra de vida, "derrotado"...
    if (personagensCriados[id]) {
        trocarAparenciaToken(personagensCriados[id], personagem);
    }

    // Nome novo na lista de iniciativa
    atualizarIniciativa();

    // O painel de vida estava aberto nele? Mostra os dados novos
    if (painelPersonagem.style.display === "block" && idSelecionado === id) {
        abrirPainelPersonagem(id);
    }

    fecharEditar();

    // Caiu para 0 ou voltou de 0: mesma regra do Dano e da Cura
    verificarMorrendo(id, vidaAntes);
    verificarSalvamento(id);
}

document.getElementById("botao-cancelar-editar").addEventListener("click", fecharEditar);
botaoSalvarEditar.addEventListener("click", salvarEditar);

// Fundo escuro fecha; Enter salva; Esc fecha
janelaEditar.addEventListener("click", function(event) {
    if (event.target === janelaEditar) {
        fecharEditar();
    }
});

janelaEditar.addEventListener("keydown", function(event) {
    if (event.key === "Enter" && !botaoSalvarEditar.disabled) {
        salvarEditar();
    } else if (event.key === "Escape") {
        fecharEditar();
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
