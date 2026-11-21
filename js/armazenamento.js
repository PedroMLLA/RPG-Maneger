// Camada de dados: o ÚNICO arquivo do projeto que mexe no localStorage.
// Os outros arquivos pedem tudo para o objeto "Armazenamento":
//
//   Armazenamento.ler("personagens", {})       → lê os dados
//   Armazenamento.salvar("personagens", obj)   → grava os dados
//   Armazenamento.quandoMudar("personagens", function(valor) { ... })
//                                              → avisa quando OUTRA janela mudou
//
// Na V3, os dados vão para um servidor. Aí só ESTE arquivo muda por
// dentro: o resto do projeto continua chamando as mesmas funções.
//
// Este arquivo vem antes de todos os outros em todas as páginas.


// Campanha escolhida na roda. Cada campanha guarda os próprios dados:
// "personagens" vira "campanha:kotto:personagens", e assim por diante.
const idCampanhaAtual = localStorage.getItem("campanhaAtual") || "padrao";

function chave(nome, idCampanha = idCampanhaAtual) {
    return `campanha:${idCampanha}:${nome}`;
}


// Tudo o que o projeto guarda.
//   nome:       o nome no localStorage
//   daCampanha: true = cada campanha tem o seu (usa chave())
//   texto:      true = guardado como texto puro, sem JSON (imagens em base64)
const TIPOS_DE_DADO = {
    personagens:     { nome: "personagens",       daCampanha: true },
    batalha:         { nome: "estadoBatalha",     daCampanha: true },
    mapa:            { nome: "mapaPersonalizado", daCampanha: true, texto: true },
    imagens:         { nome: "imagensMestre",     daCampanha: true },

    // Cópia local da lista que vem do banco (V3). Serve para o mapa saber
    // o nome, a capa e o código da campanha sem esperar o servidor.
    campanhas:       { nome: "campanhas" },
    campanhaAtual:   { nome: "campanhaAtual", texto: true },

    // Avisos rápidos entre as janelas
    anuncio:         { nome: "anuncio" },
    inimigoParaMapa: { nome: "inimigoParaMapa" }
};

// Nome real no localStorage de um tipo (ex.: "batalha" → "campanha:kotto:estadoBatalha")
function nomeNoStorage(tipo, idCampanha) {
    const info = TIPOS_DE_DADO[tipo];

    if (!info) {
        throw new Error(`Tipo de dado desconhecido: ${tipo}`);
    }

    return info.daCampanha ? chave(info.nome, idCampanha) : info.nome;
}

// Texto guardado → valor de verdade (objeto, lista...)
function converterDoStorage(tipo, texto, padrao) {
    if (texto === null || texto === undefined) {
        return padrao;
    }

    if (TIPOS_DE_DADO[tipo].texto) {
        return texto;
    }

    return JSON.parse(texto) || padrao;
}


const Armazenamento = {

    // Lê um dado. Se ele não existir, devolve o "padrao".
    ler(tipo, padrao = null) {
        const texto = localStorage.getItem(nomeNoStorage(tipo));
        return converterDoStorage(tipo, texto, padrao);
    },

    // Grava um dado. Se não couber no navegador, dá erro (quem chama
    // decide o que fazer com o try/catch).
    salvar(tipo, valor) {
        const texto = TIPOS_DE_DADO[tipo].texto ? valor : JSON.stringify(valor);
        localStorage.setItem(nomeNoStorage(tipo), texto);
    },

    apagar(tipo, idCampanha) {
        localStorage.removeItem(nomeNoStorage(tipo, idCampanha));
    },

    // Chama "funcao(valorNovo)" quando OUTRA janela muda esse dado.
    // (O evento "storage" do navegador só dispara nas outras janelas.)
    quandoMudar(tipo, funcao) {
        window.addEventListener("storage", function(event) {
            if (event.key === nomeNoStorage(tipo)) {
                funcao(converterDoStorage(tipo, event.newValue, null));
            }
        });
    },

    // Apaga tudo o que uma campanha guardou (ao excluir a campanha)
    apagarCampanha(idCampanha) {
        for (const tipo in TIPOS_DE_DADO) {
            if (TIPOS_DE_DADO[tipo].daCampanha) {
                this.apagar(tipo, idCampanha);
            }
        }
    },

    // Muda o id de uma campanha nos dados guardados (ex.: "kotto" vira
    // o id que o banco deu). Personagens, batalha etc. vão junto.
    moverCampanha(idAntigo, idNovo) {
        for (const tipo in TIPOS_DE_DADO) {
            if (!TIPOS_DE_DADO[tipo].daCampanha) {
                continue;
            }

            const nomeAntigo = nomeNoStorage(tipo, idAntigo);
            const valor = localStorage.getItem(nomeAntigo);

            if (valor === null) {
                continue;
            }

            // Tira antes de gravar: o mapa pode ser grande
            localStorage.removeItem(nomeAntigo);
            localStorage.setItem(nomeNoStorage(tipo, idNovo), valor);
        }

        if (localStorage.getItem("campanhaAtual") === idAntigo) {
            localStorage.setItem("campanhaAtual", idNovo);
        }
    },

    // ----- Backup da campanha atual -----

    // Os dados da campanha num objeto só. Os nomes são os antigos
    // ("estadoBatalha"...) para os backups já baixados continuarem valendo.
    exportarCampanha() {
        const dados = {};

        for (const tipo in TIPOS_DE_DADO) {
            if (TIPOS_DE_DADO[tipo].daCampanha) {
                dados[TIPOS_DE_DADO[tipo].nome] = this.ler(tipo);
            }
        }

        return dados;
    },

    // Grava os dados de um backup na campanha atual.
    // Se não couber, desfaz tudo e devolve false.
    importarCampanha(dados) {
        const tipos = Object.keys(TIPOS_DE_DADO).filter(function(tipo) {
            return TIPOS_DE_DADO[tipo].daCampanha;
        });

        // Guarda como está agora, para poder voltar atrás se der erro
        const antes = {};
        for (const tipo of tipos) {
            antes[tipo] = this.ler(tipo);
        }

        // Grava um valor, ou apaga se ele for vazio
        const gravar = (tipo, valor) => {
            if (valor === null || valor === undefined) {
                this.apagar(tipo);
            } else {
                this.salvar(tipo, valor);
            }
        };

        try {
            for (const tipo of tipos) {
                gravar(tipo, dados[TIPOS_DE_DADO[tipo].nome]);
            }
            return true;

        } catch (erro) {
            console.error(erro);

            for (const tipo of tipos) {
                gravar(tipo, antes[tipo]);
            }
            return false;
        }
    }
};


// ----- Dados de antes das campanhas -----
// Antes tudo ficava em "personagens", "estadoBatalha"... sem campanha.
// A primeira campanha aberta que ainda não tem dados herda esses dados,
// para nada do que já foi feito se perder.
function migrarDadosAntigos() {
    if (idCampanhaAtual === "padrao") {
        return;
    }

    const tiposDaCampanha = Object.keys(TIPOS_DE_DADO).filter(function(tipo) {
        return TIPOS_DE_DADO[tipo].daCampanha;
    });

    const temDadosAntigos = tiposDaCampanha.some(function(tipo) {
        return localStorage.getItem(TIPOS_DE_DADO[tipo].nome) !== null;
    });

    const campanhaJaTemDados = localStorage.getItem(nomeNoStorage("personagens")) !== null;

    if (!temDadosAntigos || campanhaJaTemDados) {
        return;
    }

    for (const tipo of tiposDaCampanha) {
        const nomeAntigo = TIPOS_DE_DADO[tipo].nome;
        const valor = localStorage.getItem(nomeAntigo);

        if (valor === null) {
            continue;
        }

        // Tira o antigo ANTES de gravar o novo: assim o mesmo dado
        // não ocupa espaço duas vezes (o mapa pode ser grande)
        localStorage.removeItem(nomeAntigo);

        try {
            localStorage.setItem(nomeNoStorage(tipo), valor);
        } catch (erro) {
            // Não coube: devolve para o lugar antigo
            localStorage.setItem(nomeAntigo, valor);
            console.error(erro);
        }
    }
}

migrarDadosAntigos();
