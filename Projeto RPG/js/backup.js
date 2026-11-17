// Backup da campanha: exporta tudo o que está no localStorage para um
// arquivo .json, e importa esse arquivo de volta.
// Assim os dados não dependem só do navegador.

// O que entra no backup.
//  - personagens: fichas, inventários, habilidades, HP... (de todos)
//  - estadoBatalha: quem está no mapa, posições e de quem é a vez
//  - mapaPersonalizado: a imagem do mapa enviado (se houver)
const CHAVES_JSON = ["personagens", "estadoBatalha"];
const CHAVE_MAPA = "mapaPersonalizado";

// Serve para reconhecer que o arquivo é mesmo um backup nosso
const NOME_DO_APP = "RPG Manager";
const VERSAO_DO_BACKUP = 1;


// Junta tudo num único objeto
function montarBackup() {
    const dados = {};

    for (const chave of CHAVES_JSON) {
        const texto = localStorage.getItem(chave);

        // Guardamos já convertido para objeto: o arquivo fica legível
        dados[chave] = texto ? JSON.parse(texto) : null;
    }

    dados[CHAVE_MAPA] = localStorage.getItem(CHAVE_MAPA);

    return {
        app: NOME_DO_APP,
        versao: VERSAO_DO_BACKUP,
        criadoEm: new Date().toISOString(),
        dados: dados
    };
}


// Data e hora no formato 2026-11-17-21h05, para o nome do arquivo
function carimboDeData() {
    const agora = new Date();

    // padStart(2, "0") transforma 7 em "07"
    const doisDigitos = function(numero) {
        return String(numero).padStart(2, "0");
    };

    return `${agora.getFullYear()}-${doisDigitos(agora.getMonth() + 1)}-${doisDigitos(agora.getDate())}` +
        `-${doisDigitos(agora.getHours())}h${doisDigitos(agora.getMinutes())}`;
}


function exportarCampanha() {
    const backup = montarBackup();

    // JSON.stringify(objeto, null, 2) gera o texto com recuo de 2 espaços
    const texto = JSON.stringify(backup, null, 2);

    // Um "Blob" é um arquivo que existe só na memória do navegador.
    // createObjectURL dá um endereço para ele, e um link com "download"
    // faz o navegador baixar esse arquivo.
    const arquivo = new Blob([texto], { type: "application/json" });
    const endereco = URL.createObjectURL(arquivo);

    const link = document.createElement("a");
    link.href = endereco;
    link.download = `rpg-manager-backup-${carimboDeData()}.json`;
    link.click();

    // Libera a memória depois que o download começou
    setTimeout(function() {
        URL.revokeObjectURL(endereco);
    }, 1000);
}


// Grava os dados de um backup no localStorage.
// Se não couber, desfaz tudo e devolve false.
function aplicarBackup(backup) {

    // Guarda como está agora, para poder voltar atrás se der erro
    const antes = {};
    for (const chave of [...CHAVES_JSON, CHAVE_MAPA]) {
        antes[chave] = localStorage.getItem(chave);
    }

    // Escreve um valor, ou apaga a chave se o valor for vazio
    const gravar = function(chave, texto) {
        if (texto === null || texto === undefined) {
            localStorage.removeItem(chave);
        } else {
            localStorage.setItem(chave, texto);
        }
    };

    try {
        for (const chave of CHAVES_JSON) {
            const valor = backup.dados[chave];
            gravar(chave, valor ? JSON.stringify(valor) : null);
        }

        gravar(CHAVE_MAPA, backup.dados[CHAVE_MAPA]);

        return true;

    } catch (erro) {
        console.error(erro);

        // Volta tudo como estava
        for (const chave in antes) {
            gravar(chave, antes[chave]);
        }

        return false;
    }
}


// Confere se o objeto lido tem cara de backup do RPG Manager
function ehBackupValido(backup) {
    return Boolean(
        backup &&
        backup.app === NOME_DO_APP &&
        backup.dados &&
        typeof backup.dados === "object"
    );
}


function importarCampanha(arquivo) {
    const leitor = new FileReader();

    leitor.onload = function() {
        let backup;

        // Se o arquivo não for um JSON válido, JSON.parse dá erro
        try {
            backup = JSON.parse(leitor.result);
        } catch (erro) {
            alert("Esse arquivo não é um backup válido do RPG Manager.");
            return;
        }

        if (!ehBackupValido(backup)) {
            alert("Esse arquivo não é um backup válido do RPG Manager.");
            return;
        }

        const quantidade = Object.keys(backup.dados.personagens || {}).length;
        const data = new Date(backup.criadoEm).toLocaleString("pt-BR");

        const confirmou = confirm(
            `Importar o backup de ${data}?\n\n` +
            `Ele tem ${quantidade} personagem(ns).\n` +
            "Tudo o que está salvo agora será SUBSTITUÍDO pelo backup."
        );

        if (!confirmou) {
            return;
        }

        if (!aplicarBackup(backup)) {
            alert("Não coube no armazenamento do navegador. Nada foi alterado.");
            return;
        }

        // Recarrega para a tela montar tudo a partir dos dados importados
        location.reload();
    };

    // readAsText: aqui queremos o texto do arquivo, não uma imagem
    leitor.readAsText(arquivo);
}


// ----- Botões -----
const botaoExportar = document.getElementById("botao-exportar");
const botaoImportar = document.getElementById("botao-importar");
const arquivoBackup = document.getElementById("arquivo-backup");

botaoExportar.addEventListener("click", exportarCampanha);

// O botão bonito "aperta" o campo de arquivo, que fica escondido
botaoImportar.addEventListener("click", function() {
    arquivoBackup.click();
});

arquivoBackup.addEventListener("change", function() {
    const arquivo = arquivoBackup.files[0];

    if (arquivo) {
        importarCampanha(arquivo);
    }

    // Limpa, para conseguir escolher o mesmo arquivo de novo depois
    arquivoBackup.value = "";
});
