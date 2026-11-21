// Campanha atual: cada campanha guarda os PRÓPRIOS dados.
// Em vez de "personagens", a chave no localStorage vira
// "campanha:kotto:personagens", "campanha:demetria:personagens"...
// Este arquivo vem ANTES de todos os outros (mapa, mestre e jogadores).

const idCampanhaAtual = localStorage.getItem("campanhaAtual") || "padrao";

// Dados que são de cada campanha (os outros, como "anuncio", são avisos
// rápidos entre as janelas e continuam iguais)
const DADOS_DA_CAMPANHA = ["personagens", "estadoBatalha", "mapaPersonalizado", "imagensMestre"];

// chave("personagens") → "campanha:kotto:personagens"
function chave(nome, idCampanha = idCampanhaAtual) {
    return `campanha:${idCampanha}:${nome}`;
}

// O objeto da campanha atual ({ id, nome, imagem }), ou undefined
function campanhaEscolhida() {
    const campanhas = JSON.parse(localStorage.getItem("campanhas")) || [];

    return campanhas.find(function(campanha) {
        return campanha.id === idCampanhaAtual;
    });
}

// Mapa que abre quando a campanha ainda não tem um mapa enviado.
// As campanhas que vieram prontas (Kotto, Demetria) usam o próprio mapa.
function mapaPadraoDaCampanha() {
    const campanha = campanhaEscolhida();

    if (campanha && campanha.imagem && campanha.imagem.startsWith("mapas/")) {
        return campanha.imagem;
    }

    return "mapas/kotto.jfif";
}


// ----- Dados de antes das campanhas -----
// Antes tudo ficava em "personagens", "estadoBatalha"...  sem campanha.
// A primeira campanha aberta que ainda não tem dados herda esses dados,
// para nada do que já foi feito se perder.
function migrarDadosAntigos() {
    if (idCampanhaAtual === "padrao") {
        return;
    }

    const temDadosAntigos = DADOS_DA_CAMPANHA.some(function(nome) {
        return localStorage.getItem(nome) !== null;
    });

    const campanhaJaTemDados = localStorage.getItem(chave("personagens")) !== null;

    if (!temDadosAntigos || campanhaJaTemDados) {
        return;
    }

    for (const nome of DADOS_DA_CAMPANHA) {
        const valor = localStorage.getItem(nome);

        if (valor === null) {
            continue;
        }

        // Tira o antigo ANTES de gravar o novo: assim o mesmo dado
        // não ocupa espaço duas vezes (o mapa pode ser grande)
        localStorage.removeItem(nome);

        try {
            localStorage.setItem(chave(nome), valor);
        } catch (erro) {
            // Não coube: devolve para o lugar antigo
            localStorage.setItem(nome, valor);
            console.error(erro);
        }
    }
}

migrarDadosAntigos();


// O mestre trocou de campanha (em outra janela)? Recarrega esta,
// para ela passar a mostrar os dados da campanha nova.
window.addEventListener("storage", function(event) {
    if (event.key === "campanhaAtual") {
        location.reload();
    }
});
