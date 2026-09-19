const botaoMenu = document.getElementById("botao-menu");

const barraLateral = document.getElementById("barra-lateral");

const botaoModoMestre = document.getElementById("botao-modo-mestre");

const botaoRegua = document.getElementById("botao-regua");

const botaoIniciativa =
    document.getElementById("botao-iniciativa");

const painelIniciativa =
    document.getElementById("painel-iniciativa");

    const vezAtual =
    document.getElementById("vez-atual");

const botaoProximoTurno =
    document.getElementById("botao-proximo-turno");

const botaoEscolherMapa =
    document.getElementById("botao-escolher-mapa");

const arquivoMapa =
    document.getElementById("arquivo-mapa");

    botaoEscolherMapa.addEventListener("click", function() {
    arquivoMapa.click();
});

botaoIniciativa.addEventListener("click", function() {

    if (painelIniciativa.style.display === "block") {

        painelIniciativa.style.display = "none";

    } else {

        painelIniciativa.style.display = "block";

    }

});

arquivoMapa.addEventListener("change", function() {

    const arquivo = arquivoMapa.files[0];

    if (!arquivo) {
        return;
    }

    const leitor = new FileReader();

    leitor.onload = function() {
        imagemMapa.src = leitor.result;

        escala = 1;
        posicaoX = 0;
        posicaoY = 0;

        atualizarMapa();

        localStorage.setItem(
            "mapaPersonalizado",
            leitor.result
        );
    };

    leitor.readAsDataURL(arquivo);
});

let modoRegua = false;

const gradeMapa = document.getElementById("grade-mapa");
const regua = document.getElementById("regua");
const distanciaRegua = document.getElementById("distancia-regua");

let medindo = false;
let inicioReguaX = 0;
let inicioReguaY = 0;

botaoRegua.addEventListener("click", function() {
    modoRegua = !modoRegua;

    if (modoRegua) {
        botaoRegua.textContent = "📏 Régua: ATIVA";
        mapa.style.cursor = "crosshair";
        gradeMapa.style.display = "block";
    } else {
        botaoRegua.textContent = "📏 Régua";
        mapa.style.cursor = "default";
        gradeMapa.style.display = "none";

        regua.style.display = "none";
        distanciaRegua.style.display = "none";
    }
});

botaoModoMestre.addEventListener("click", function() {
    window.open("mestre.html", "painelMestre", "width=400,height=600");
});

botaoMenu.addEventListener("click", function() {

    barraLateral.classList.toggle("fechada");

});


const parametros = new URLSearchParams(window.location.search);

const mapaEscolhido = parametros.get("mapa");

console.log(mapaEscolhido);


const imagemMapa = document.getElementById("imagem-mapa");

const conteudoMapa = document.getElementById("conteudo-mapa");

if (mapaEscolhido === "kotto") {

    imagemMapa.src = "mapas/kotto.jfif";

}

if (mapaEscolhido === "demetria") {

    imagemMapa.src = "mapas/demetria.jfif";

}

const mapaPersonalizado =
    localStorage.getItem("mapaPersonalizado");

if (mapaPersonalizado) {
    imagemMapa.src = mapaPersonalizado;
}


let escala = 1;

let posicaoX = 0;

let posicaoY = 0;

let arrastando = false;

let mouseX = 0;

let mouseY = 0;


const mapa = document.getElementById("mapa");

function atualizarMapa() {
    conteudoMapa.style.transform =
        `translate(${posicaoX}px, ${posicaoY}px) scale(${escala})`;
}

mapa.addEventListener("wheel", function(event) {
    event.preventDefault();

    if (event.deltaY < 0) {
        escala += 0.1;
    } else {
        escala -= 0.1;
    }

    if (escala < 0.5) {
        escala = 0.5;
    }

    if (escala > 3) {
        escala = 3;
    }

    atualizarMapa();
});

mapa.addEventListener("mousedown", function(event) {
    if (modoRegua) {
    medindo = true;

    const areaMapa = mapa.getBoundingClientRect();

    inicioReguaX = event.clientX - areaMapa.left;
    inicioReguaY = event.clientY - areaMapa.top;

    regua.style.display = "block";
    distanciaRegua.style.display = "block";

    distanciaRegua.textContent = "0 m";

    return;
}

    arrastando = true;
    mouseX = event.clientX;
    mouseY = event.clientY;
});


document.addEventListener("mousemove", function(event) {

    if (medindo) {
        const areaMapa = mapa.getBoundingClientRect();

        const atualX = event.clientX - areaMapa.left;
        const atualY = event.clientY - areaMapa.top;

        const deltaX = atualX - inicioReguaX;
        const deltaY = atualY - inicioReguaY;

        const distancia = Math.sqrt(
            deltaX * deltaX + deltaY * deltaY
        );

        const distanciaQuadrados = distancia / 50;
        const distanciaMetros = distanciaQuadrados * 1.5;

        const angulo = Math.atan2(deltaY, deltaX);

        regua.style.left = `${inicioReguaX}px`;
        regua.style.top = `${inicioReguaY}px`;
        regua.style.width = `${distancia}px`;
        regua.style.transform = `rotate(${angulo}rad)`;

        distanciaRegua.textContent =
            `${distanciaMetros.toFixed(1)} m`;

        distanciaRegua.style.left =
            `${atualX + 10}px`;

        distanciaRegua.style.top =
            `${atualY + 10}px`;

        return;
    }

    if (!arrastando) {
        return;
    }

    const movimentoX = event.clientX - mouseX;
    const movimentoY = event.clientY - mouseY;

    posicaoX += movimentoX;
    posicaoY += movimentoY;

    mouseX = event.clientX;
    mouseY = event.clientY;

    atualizarMapa();
});


document.addEventListener("mouseup", function() {

    if (medindo) {
        medindo = false;
        distanciaRegua.style.display = "block";
    }

    arrastando = false;
});

const personagensMapa = document.getElementById("personagens-mapa");
const painelPersonagem = document.getElementById("painel-personagem");
const fecharPainel = document.getElementById("fechar-painel");
const removerPersonagem = document.getElementById("remover-personagem");
const nomePersonagem = document.getElementById("nome-personagem");
const hpPersonagem = document.getElementById("hp-personagem");
const hpMaximoPersonagem = document.getElementById("hp-maximo-personagem");
const sanidadePersonagem = document.getElementById("sanidade-personagem");
const sanidadeMaximaPersonagem = document.getElementById("sanidade-maxima-personagem");
const valorHp = document.getElementById("valor-hp");
const botaoDano = document.getElementById("botao-dano");
const botaoCura = document.getElementById("botao-cura");
const valorSanidade = document.getElementById("valor-sanidade");
const botaoDanoSanidade = document.getElementById("botao-dano-sanidade");
const botaoCuraSanidade = document.getElementById("botao-cura-sanidade");

const personagens = {
    nero: {
        nome: "Nero",
        hp: 60,
        hpMaximo: 60,
        sanidade: 29,
        sanidadeMaxima: 29,
        imagem: "imagens-personagens/nero.png"
    },

    shin: {
        nome: "Shin",
        hp: 38,
        hpMaximo: 38,
        sanidade: 36,
        sanidadeMaxima: 36,
        imagem: "imagens-personagens/shin.png"
    },

    jotton: {
        nome: "Jotton",
        hp: 70,
        hpMaximo: 70,
        sanidade: 29,
        sanidadeMaxima: 29,
        imagem: "imagens-personagens/jotton.png"
},

    calisto: {
        nome: "Calisto",
        hp: 100,
        hpMaximo: 100,
        sanidade: 50,
        sanidadeMaxima: 50
}

};

let personagemSelecionado = personagens.nero;

const listaIniciativa =
    document.getElementById("lista-iniciativa");

    let ordemIniciativa = [];
    let turnoAtual = 0;

function atualizarIniciativa() {

    listaIniciativa.innerHTML = "";

    ordemIniciativa = Object.keys(personagensCriados);

    ordemIniciativa.sort(function(a, b) {

        const iniciativaA =
            personagens[a].iniciativa || 0;

        const iniciativaB =
            personagens[b].iniciativa || 0;

        return iniciativaB - iniciativaA;
    });

    if (ordemIniciativa.length === 0) {

        turnoAtual = 0;

        vezAtual.textContent = "Vez de: -";

        return;
    }

    if (turnoAtual >= ordemIniciativa.length) {

        turnoAtual = 0;

    }

    ordemIniciativa.forEach(function(id, indice) {

        const personagem = personagens[id];

        const item = document.createElement("div");

        item.classList.add("item-iniciativa");

        if (indice === turnoAtual) {

            item.classList.add("atual");

        }

        item.innerHTML = `
            <span>${personagem.nome}</span>

            <input
                type="number"
                value="${personagem.iniciativa || ""}"
                placeholder="Iniciativa">
        `;

        const input =
            item.querySelector("input");

        input.addEventListener("change", function() {

            personagem.iniciativa =
                Number(input.value);

            atualizarIniciativa();

        });

        listaIniciativa.appendChild(item);

    });

    const personagemAtual =
        personagens[ordemIniciativa[turnoAtual]];

    vezAtual.textContent =
        `Vez de: ${personagemAtual.nome}`;
}

botaoProximoTurno.addEventListener("click", function() {

    if (ordemIniciativa.length === 0) {

        return;

    }

    turnoAtual++;

    if (turnoAtual >= ordemIniciativa.length) {

        turnoAtual = 0;

    }

    atualizarIniciativa();

});

botaoCura.addEventListener("click", function() {
    const valor = Number(valorHp.value);

    personagemSelecionado.hp += valor;

    if (personagemSelecionado.hp > personagemSelecionado.hpMaximo) {
        personagemSelecionado.hp = personagemSelecionado.hpMaximo;
    }

    hpPersonagem.textContent = personagemSelecionado.hp;
    valorHp.value = "";
});

botaoDanoSanidade.addEventListener("click", function() {
    const valor = Number(valorSanidade.value);

    personagemSelecionado.sanidade -= valor;

    if (personagemSelecionado.sanidade < 0) {
        personagemSelecionado.sanidade = 0;
    }

    sanidadePersonagem.textContent = personagemSelecionado.sanidade;

    valorSanidade.value = "";
});

botaoCuraSanidade.addEventListener("click", function() {
    const valor = Number(valorSanidade.value);

    personagemSelecionado.sanidade += valor;

    if (personagemSelecionado.sanidade > personagemSelecionado.sanidadeMaxima) {
        personagemSelecionado.sanidade = personagemSelecionado.sanidadeMaxima;
    }

    sanidadePersonagem.textContent = personagemSelecionado.sanidade;

    valorSanidade.value = "";
});

const botaoNero = document.getElementById("botao-nero");
const botaoShin = document.getElementById("botao-shin");
const botaoJotton = document.getElementById("botao-jotton");
const botaoCalisto = document.getElementById("botao-calisto");

const personagensCriados = {};

function criarPersonagem(id, letra, posicaoX, posicaoY, tipo, tamanho) {

    if (personagensCriados[id]) {
        return;
    }

    const boneco = document.createElement("div");
    console.log("CRIANDO:", id);

    boneco.classList.add("boneco");

    if (tipo === "inimigo" && tamanho) {
    boneco.style.width = `${tamanho}px`;
    boneco.style.height = `${tamanho}px`;
    
}

const personagem = personagens[id];

if (personagem && personagem.imagem) {

    boneco.classList.add("imagem-personagem");
    boneco.style.backgroundImage = `url('${personagem.imagem}')`;

} else {

    boneco.textContent = letra;

    if (tipo === "inimigo") {
        boneco.style.backgroundColor = "red";
        boneco.style.color = "black";
    }

}

    boneco.style.left = `${posicaoX}px`;
    boneco.style.top = `${posicaoY}px`;

    personagensMapa.appendChild(boneco);
    personagensCriados[id] = boneco;
    atualizarIniciativa();

    tornarArrastavel(boneco);

    boneco.addEventListener("click", function(event) {
    event.stopPropagation();

    if (tipo === "inimigo") {
        return;
    }

    personagemSelecionado = personagens[id];

    nomePersonagem.textContent = personagemSelecionado.nome;
    hpPersonagem.textContent = personagemSelecionado.hp;
    hpMaximoPersonagem.textContent = personagemSelecionado.hpMaximo;
    sanidadePersonagem.textContent = personagemSelecionado.sanidade;
    sanidadeMaximaPersonagem.textContent = personagemSelecionado.sanidadeMaxima;

    painelPersonagem.style.display = "block";
});
}

botaoNero.addEventListener("click", function() {
    criarPersonagem("nero", "N", 300, 200, "player");
});

botaoShin.addEventListener("click", function() {
    criarPersonagem("shin", "S", 400, 200, "player");
});

botaoJotton.addEventListener("click", function() {
    criarPersonagem("jotton", "J", 500, 200, "player");
});

botaoCalisto.addEventListener("click", function() {
    criarPersonagem("calisto", "C", 600, 200, "player");
});

fecharPainel.addEventListener("click", function() {
    painelPersonagem.style.display = "none";
});

removerPersonagem.addEventListener("click", function() {
    const id = Object.keys(personagens).find(function(chave) {
        return personagens[chave] === personagemSelecionado;
    });

    if (id && personagensCriados[id]) {
        personagensCriados[id].remove();
        delete personagensCriados[id];
        atualizarIniciativa();
    }

    painelPersonagem.style.display = "none";
});

function tornarArrastavel(boneco) {
    let arrastandoBoneco = false;
    let mouseXBoneco = 0;
    let mouseYBoneco = 0;

    boneco.addEventListener("mousedown", function(event) {
        // Impede o mapa de começar a ser arrastado junto
        event.stopPropagation();

        arrastandoBoneco = true;

        mouseXBoneco = event.clientX;
        mouseYBoneco = event.clientY;
    });

    document.addEventListener("mousemove", function(event) {
        if (!arrastandoBoneco) {
            return;
        }

        const movimentoX = event.clientX - mouseXBoneco;
        const movimentoY = event.clientY - mouseYBoneco;

        const posicaoAtualX = parseFloat(boneco.style.left);
        const posicaoAtualY = parseFloat(boneco.style.top);

        boneco.style.left = `${posicaoAtualX + movimentoX}px`;
        boneco.style.top = `${posicaoAtualY + movimentoY}px`;

        mouseXBoneco = event.clientX;
        mouseYBoneco = event.clientY;
    });

    document.addEventListener("mouseup", function() {
        arrastandoBoneco = false;
    });
}

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

        localStorage.setItem(
            "personagens",
            JSON.stringify(personagens)
        );

        window.dispatchEvent(
            new Event("personagensAtualizados")
        );

        console.log(nome);
        console.log(hp);
        console.log(sanidade);
        console.log(tipo);
        console.log(imagem);

        const novoBotao = document.createElement("button");
        novoBotao.textContent = nome;

        novoBotao.addEventListener("click", function() {

            criarPersonagem(
                id,
                nome.charAt(0).toUpperCase(),
                300,
                200,
                tipo
            );

        });

        if (tipo === "player") {

            const listaPersonagens =
                document.getElementById("lista-personagens");

            listaPersonagens.appendChild(novoBotao);

        } else {

            const listaInimigos =
                document.getElementById("lista-inimigos");

            listaInimigos.appendChild(novoBotao);

        }

        nomeNovoPersonagem.value = "";
        hpNovoPersonagem.value = "";
        sanidadeNovoPersonagem.value = "";
        imagemNovoPersonagem.value = "";

        formularioPersonagem.style.display = "none";
    }

    if (arquivo) {

        const leitor = new FileReader();

        leitor.onload = function() {
            salvarPersonagem(leitor.result);
        };

        leitor.readAsDataURL(arquivo);

    } else {

        salvarPersonagem(null);

    }

});

window.addEventListener("storage", function(event) {

    if (event.key !== "personagens") {
        return;
    }

    const personagensAtualizados =
        JSON.parse(event.newValue) || {};

    for (const id in personagensAtualizados) {

        if (personagens[id]) {

            personagens[id] = {
                ...personagens[id],
                ...personagensAtualizados[id]
            };
        }

        if (personagensCriados[id]) {

            const personagem =
                personagensAtualizados[id];

            if (personagem && personagem.hp <= 0) {

                personagensCriados[id].remove();
                delete personagensCriados[id];

            }
        }
    }
});


window.addEventListener("storage", function(event) {

    if (event.key !== "inimigoParaMapa") {
        return;
    }

    const inimigo =
        JSON.parse(event.newValue);

    console.log("INIMIGO RECEBIDO:", inimigo);

    personagens[inimigo.id] = inimigo;

    let tamanho = 60;

if (inimigo.tamanho === "medio") {
    tamanho = 80;
}

if (inimigo.tamanho === "grande") {
    tamanho = 120;
}

if (inimigo.tamanho === "muito-grande") {
    tamanho = 200;
}

if (inimigo.tamanho === "enorme") {
    tamanho = 300;
}

    criarPersonagem(
        inimigo.id,
        inimigo.nome.charAt(0).toUpperCase(),
        600,
        300,
        "inimigo",
        tamanho
    );
});