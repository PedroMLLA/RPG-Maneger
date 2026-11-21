// Backup da campanha: exporta os dados para um arquivo .json,
// e importa esse arquivo de volta.
// Assim os dados não dependem só do navegador.
//
// O backup é da CAMPANHA ATUAL: exporta os dados dela e, ao importar,
// substitui só os dados dela (as outras campanhas não mudam).
// Quem lê e grava é o Armazenamento (armazenamento.js). Entram:
//  - personagens: fichas, inventários, habilidades, HP... (de todos)
//  - estadoBatalha: quem está no mapa, posições e de quem é a vez
//  - mapaPersonalizado: a imagem do mapa enviado (se houver)
//  - imagensMestre: as imagens da aba "Imagens" (e onde estão no mapa)

// Serve para reconhecer que o arquivo é mesmo um backup nosso
const NOME_DO_APP = "RPG Manager";
const VERSAO_DO_BACKUP = 1;


// Junta tudo num único objeto
function montarBackup() {
    return {
        app: NOME_DO_APP,
        versao: VERSAO_DO_BACKUP,
        criadoEm: new Date().toISOString(),
        dados: Armazenamento.exportarCampanha()
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


// Grava os dados de um backup na campanha atual.
// Se não couber, o Armazenamento desfaz tudo e devolve false.
function aplicarBackup(backup) {
    return Armazenamento.importarCampanha(backup.dados);
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
            "Tudo o que está salvo NESTA campanha será SUBSTITUÍDO pelo backup.\n" +
            "As outras campanhas não mudam."
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
