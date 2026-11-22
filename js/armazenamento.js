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
// O jogador que entra pelo código abre "jogador.html?campanha=ID":
// nesse caso, a campanha vem do endereço.
const idCampanhaAtual =
    new URLSearchParams(location.search).get("campanha") ||
    localStorage.getItem("campanhaAtual") ||
    "padrao";

function chave(nome, idCampanha = idCampanhaAtual) {
    return `campanha:${idCampanha}:${nome}`;
}


// Tudo o que o projeto guarda.
//   nome:       o nome no localStorage
//   daCampanha: true = cada campanha tem o seu (usa chave())
//   texto:      true = guardado como texto puro, sem JSON (imagens em base64)
//   semBackup:  true = não entra no arquivo de backup
const TIPOS_DE_DADO = {
    personagens:     { nome: "personagens",       daCampanha: true },
    batalha:         { nome: "estadoBatalha",     daCampanha: true },
    mapa:            { nome: "mapaPersonalizado", daCampanha: true, texto: true },
    imagens:         { nome: "imagensMestre",     daCampanha: true },

    // Anúncio na tela dos jogadores ("Nero está morrendo"). É da campanha
    // para chegar, pelo banco, aos jogadores de outros aparelhos.
    anuncio:         { nome: "anuncio",           daCampanha: true, semBackup: true },

    // Cópia local da lista que vem do banco (V3). Serve para o mapa saber
    // o nome, a capa e o código da campanha sem esperar o servidor.
    campanhas:       { nome: "campanhas" },
    campanhaAtual:   { nome: "campanhaAtual", texto: true },

    // Último código digitado pelo jogador (para não precisar digitar de novo)
    ultimoCodigo:    { nome: "ultimoCodigo", texto: true },

    // Aviso rápido entre a janela do Painel do Mestre e o mapa
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


// ----- Banco de dados (V3) -----
// Os dados da campanha também ficam na tabela "dados_campanha" do
// Supabase, uma linha por tipo. O localStorage vira uma CÓPIA LOCAL:
// ler continua rápido (sem esperar a internet), e cada gravação
// também é enviada ao banco, sem travar a tela.

// Só as páginas do mestre carregam o Supabase. Na Visão dos Jogadores
// (neste mesmo PC) "clienteSupabase" não existe, e nada é enviado.
function temBanco() {
    return typeof clienteSupabase !== "undefined" && idCampanhaAtual !== "padrao";
}

// Horários (em milissegundos) dos envios feitos por ESTA página.
// O tempo real avisa todo mundo de cada mudança, inclusive quem mudou;
// pelo horário, a página reconhece o próprio "eco" e ignora.
const enviadosPorMim = new Set();

// Grava (ou apaga, se não houver valor) a linha de um tipo no banco
async function gravarNoBanco(tipo, idCampanha) {
    const texto = localStorage.getItem(nomeNoStorage(tipo, idCampanha));
    const valor = converterDoStorage(tipo, texto, null);
    const agora = new Date();

    if (valor !== null) {
        enviadosPorMim.add(agora.getTime());
    }

    const resposta = valor === null
        ? await clienteSupabase
            .from("dados_campanha")
            .delete()
            .eq("campanha_id", idCampanha)
            .eq("tipo", tipo)
        : await clienteSupabase
            .from("dados_campanha")
            .upsert({
                campanha_id: idCampanha,
                tipo: tipo,
                valor: valor,
                atualizado_em: agora.toISOString()
            });

    if (resposta.error) {
        throw resposta.error;
    }
}

// Fila de envio: se o mestre der 5 cliques de dano seguidos, não saem
// 5 pedidos atropelados. Enquanto um envio está a caminho, os próximos
// só marcam "manda de novo", e no fim sai a versão MAIS NOVA.
const filaDeEnvio = {};

async function enviarParaOBanco(tipo) {
    if (!temBanco()) {
        return;
    }

    const fila = filaDeEnvio[tipo] || (filaDeEnvio[tipo] = { enviando: false, deNovo: false });

    if (fila.enviando) {
        fila.deNovo = true;
        return;
    }

    fila.enviando = true;

    try {
        do {
            fila.deNovo = false;
            await gravarNoBanco(tipo, idCampanhaAtual);
        } while (fila.deNovo);

    } catch (erro) {
        // Fica na cópia local; a próxima gravação tenta de novo
        console.error(`Não foi possível enviar "${tipo}" ao banco:`, erro);

    } finally {
        fila.enviando = false;
    }
}


// ----- Tempo real (V3) -----
// O Supabase avisa pela internet, na hora, quando uma linha de
// "dados_campanha" desta campanha muda, venha de onde vier (outro
// computador, celular...). Funciona como o evento "storage", só que
// entre aparelhos diferentes.

// Quem pediu para ser avisado de cada tipo (pelo quandoMudar)
const ouvintes = {};

function avisarOuvintes(tipo, valor) {
    for (const funcao of ouvintes[tipo] || []) {
        funcao(valor);
    }
}

// Chegou uma mudança do banco
async function receberDoBanco(linha) {
    const tipo = linha.tipo;
    const info = TIPOS_DE_DADO[tipo];

    if (!info || !info.daCampanha) {
        return;
    }

    // É o eco de uma gravação desta própria página: ignora
    const horario = Date.parse(linha.atualizado_em);

    if (enviadosPorMim.has(horario)) {
        enviadosPorMim.delete(horario);
        return;
    }

    let valor = linha.valor;

    // Mudanças muito grandes (ex.: mapa em alta resolução) podem chegar
    // sem o valor. Aí buscamos a linha inteira no banco.
    if (valor === undefined) {
        const { data, error } = await clienteSupabase
            .from("dados_campanha")
            .select("valor")
            .eq("campanha_id", idCampanhaAtual)
            .eq("tipo", tipo)
            .single();

        if (error) {
            console.error(`Não foi possível buscar "${tipo}" do banco:`, error);
            return;
        }

        valor = data.valor;
    }

    // Atualiza a cópia local. Isso também avisa as OUTRAS janelas deste
    // navegador (ex.: a Visão dos Jogadores) pelo evento "storage".
    try {
        const texto = info.texto ? valor : JSON.stringify(valor);
        localStorage.setItem(nomeNoStorage(tipo), texto);
    } catch (erro) {
        console.error(erro);
    }

    // E avisa esta página
    avisarOuvintes(tipo, valor);
}


// ----- Ao vivo (Broadcast) -----
// Para coisas que mudam MUITAS vezes por segundo, como um token sendo
// arrastado. Em vez de gravar no banco e esperar ele avisar, a mensagem
// vai direto para quem está olhando, e nada é guardado. O valor final
// continua sendo salvo no banco do jeito de sempre (Armazenamento.salvar).
//
// Dois caminhos ao mesmo tempo:
//   - Supabase Broadcast: outros aparelhos (o celular do jogador)
//   - BroadcastChannel do navegador: outras janelas DESTE computador
//     (a Visão dos Jogadores aberta na TV pelo botão do mapa)

let canalTempoReal = null;
let canalConectado = false;

const canalLocal = "BroadcastChannel" in window
    ? new BroadcastChannel(`ao-vivo-${idCampanhaAtual}`)
    : null;

const ouvintesAoVivo = {};

function receberAoVivo(mensagem) {
    for (const funcao of ouvintesAoVivo[mensagem.evento] || []) {
        funcao(mensagem.dados);
    }
}

if (canalLocal) {
    canalLocal.addEventListener("message", function(event) {
        receberAoVivo(event.data);
    });
}


const Armazenamento = {

    // Manda uma mensagem ao vivo (ex.: "token", { id, x, y }).
    // Quem mandou não recebe de volta.
    avisarAoVivo(evento, dados) {
        const mensagem = { evento, dados };

        if (canalLocal) {
            canalLocal.postMessage(mensagem);
        }

        // Só depois de conectado: antes disso, as mensagens ficariam
        // presas numa fila e chegariam todas atrasadas de uma vez
        if (canalTempoReal && canalConectado) {
            canalTempoReal.send({
                type: "broadcast",
                event: "ao-vivo",
                payload: mensagem
            });
        }
    },

    // Chama "funcao(dados)" quando chegar uma mensagem ao vivo desse evento
    quandoChegarAoVivo(evento, funcao) {
        (ouvintesAoVivo[evento] || (ouvintesAoVivo[evento] = [])).push(funcao);
    },

    // Liga a escuta do banco para a campanha atual. As páginas que
    // acompanham a batalha (mapa, Painel do Mestre) chamam uma vez.
    ligarTempoReal() {
        if (!temBanco()) {
            return;
        }

        canalTempoReal = clienteSupabase
            .channel(`campanha-${idCampanhaAtual}`)
            .on("broadcast", { event: "ao-vivo" }, function(mensagem) {
                receberAoVivo(mensagem.payload);
            })
            .on(
                "postgres_changes",
                {
                    event: "*",                 // INSERT ou UPDATE
                    schema: "public",
                    table: "dados_campanha",
                    filter: `campanha_id=eq.${idCampanhaAtual}`
                },
                function(mudanca) {
                    if (mudanca.new && mudanca.new.tipo) {
                        receberDoBanco(mudanca.new);
                    }
                }
            )
            .subscribe(function(estado) {
                canalConectado = estado === "SUBSCRIBED";

                if (estado === "CHANNEL_ERROR" || estado === "TIMED_OUT") {
                    console.error("Tempo real: não foi possível conectar.", estado);
                }
            });
    },

    // Lê um dado. Se ele não existir, devolve o "padrao".
    ler(tipo, padrao = null) {
        const texto = localStorage.getItem(nomeNoStorage(tipo));
        return converterDoStorage(tipo, texto, padrao);
    },

    // Grava um dado. Se não couber no navegador, dá erro (quem chama
    // decide o que fazer com o try/catch). Dados da campanha também
    // vão para o banco.
    salvar(tipo, valor) {
        const texto = TIPOS_DE_DADO[tipo].texto ? valor : JSON.stringify(valor);
        localStorage.setItem(nomeNoStorage(tipo), texto);

        if (TIPOS_DE_DADO[tipo].daCampanha) {
            enviarParaOBanco(tipo);
        }
    },

    // Sem idCampanha: apaga da campanha atual (e do banco).
    // Com idCampanha: só a cópia local (usado ao excluir a campanha;
    // no banco, os dados somem junto com ela).
    apagar(tipo, idCampanha) {
        localStorage.removeItem(nomeNoStorage(tipo, idCampanha));

        if (idCampanha === undefined && TIPOS_DE_DADO[tipo].daCampanha) {
            enviarParaOBanco(tipo);
        }
    },

    // Ao abrir uma campanha: traz os dados do banco para a cópia local.
    // O que só existe aqui (dados de antes da V3) sobe para o banco,
    // menos quando "somenteLer" é true (o jogador não pode gravar).
    async baixarCampanha(idCampanha, somenteLer = false) {
        const { data, error } = await clienteSupabase
            .from("dados_campanha")
            .select("tipo, valor")
            .eq("campanha_id", idCampanha);

        if (error) {
            throw error;
        }

        for (const tipo in TIPOS_DE_DADO) {
            const info = TIPOS_DE_DADO[tipo];

            if (!info.daCampanha) {
                continue;
            }

            const linha = data.find(function(l) { return l.tipo === tipo; });
            const nomeLocal = nomeNoStorage(tipo, idCampanha);

            if (linha) {
                // O banco manda: atualiza a cópia local
                const texto = info.texto ? linha.valor : JSON.stringify(linha.valor);
                localStorage.setItem(nomeLocal, texto);

            } else if (!somenteLer && localStorage.getItem(nomeLocal) !== null) {
                // Só existe aqui: sobe para o banco
                await gravarNoBanco(tipo, idCampanha);
            }
        }
    },

    // Chama "funcao(valorNovo)" quando OUTRA janela ou OUTRO aparelho
    // muda esse dado. Outras janelas deste navegador: evento "storage"
    // (que só dispara nas outras janelas). Outros aparelhos: tempo real.
    quandoMudar(tipo, funcao) {
        (ouvintes[tipo] || (ouvintes[tipo] = [])).push(funcao);

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
            if (TIPOS_DE_DADO[tipo].daCampanha && !TIPOS_DE_DADO[tipo].semBackup) {
                dados[TIPOS_DE_DADO[tipo].nome] = this.ler(tipo);
            }
        }

        return dados;
    },

    // Grava os dados de um backup na campanha atual.
    // Se não couber, desfaz tudo e devolve false.
    importarCampanha(dados) {
        const tipos = Object.keys(TIPOS_DE_DADO).filter(function(tipo) {
            return TIPOS_DE_DADO[tipo].daCampanha && !TIPOS_DE_DADO[tipo].semBackup;
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
        return TIPOS_DE_DADO[tipo].daCampanha && !TIPOS_DE_DADO[tipo].semBackup;
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
