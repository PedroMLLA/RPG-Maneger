// Reduz a imagem para no máximo `tamanhoMaximo` pixels (500 se não
// for informado) e converte para WebP, para ocupar pouco espaço no localStorage.
function otimizarImagem(arquivo, callback, tamanhoMaximo = 500) {
    const leitor = new FileReader();

    leitor.onload = function(event) {
        const imagem = new Image();

        imagem.onload = function() {

            let largura = imagem.width;
            let altura = imagem.height;

            if (largura > tamanhoMaximo || altura > tamanhoMaximo) {
                const escala = Math.min(
                    tamanhoMaximo / largura,
                    tamanhoMaximo / altura
                );

                largura *= escala;
                altura *= escala;
            }

            const canvas = document.createElement("canvas");

            canvas.width = largura;
            canvas.height = altura;

            const contexto = canvas.getContext("2d");

            contexto.drawImage(
                imagem,
                0,
                0,
                largura,
                altura
            );

            const imagemOtimizada = canvas.toDataURL(
                "image/webp",
                0.7
            );

            callback(imagemOtimizada);
        };

        imagem.src = event.target.result;
    };

    leitor.readAsDataURL(arquivo);
}


// ----- Imagens no Supabase Storage (V3) -----
// Em vez de guardar a imagem inteira (base64) dentro dos dados da
// campanha, mandamos ela como ARQUIVO para o Storage e guardamos só
// o endereço. Os dados ficam leves, e cada salvamento também.
//
// Caminho no bucket "imagens": <id da campanha>/<nome sorteado>.webp
// (veja supabase/03-imagens-storage.sql).

// Recebe a imagem em base64 e devolve (pela Promise) o endereço dela
// no Storage. Se não der para enviar (sem internet, sem login...),
// devolve o próprio base64: a imagem funciona como antes.
// "idCampanha" escolhe a pasta; sem ele, é a campanha aberta agora.
async function enviarImagemParaStorage(base64, idCampanha = idCampanhaAtual) {
    if (typeof clienteSupabase === "undefined" || idCampanha === "padrao") {
        return base64;
    }

    try {
        // fetch() também lê endereços "data:..."; .blob() vira um arquivo
        const arquivo = await (await fetch(base64)).blob();

        // Quase sempre WebP. Alguns iPhones antigos não geram WebP e
        // o navegador entrega PNG, então a extensão segue o tipo real.
        const extensao = arquivo.type.split("/")[1] || "webp";
        const caminho = `${idCampanha}/${crypto.randomUUID()}.${extensao}`;

        const { error } = await clienteSupabase.storage
            .from("imagens")
            .upload(caminho, arquivo, {
                contentType: arquivo.type,
                cacheControl: "31536000"  // um ano: o arquivo nunca muda
            });

        if (error) {
            throw error;
        }

        return clienteSupabase.storage.from("imagens").getPublicUrl(caminho).data.publicUrl;

    } catch (erro) {
        console.error("Não foi possível enviar a imagem ao Storage:", erro);
        return base64;
    }
}

// Igual ao otimizarImagem, mas o callback recebe o ENDEREÇO no Storage.
// Usado para tudo o que é da campanha (mapa, galeria, tokens).
function otimizarEEnviar(arquivo, callback, tamanhoMaximo) {
    otimizarImagem(arquivo, async function(imagemOtimizada) {
        callback(await enviarImagemParaStorage(imagemOtimizada));
    }, tamanhoMaximo);
}

// Apaga do Storage o arquivo de um endereço (ex.: imagem excluída da galeria).
// Endereço que não é do nosso Storage (base64, imagem da pasta mapas/...)
// é ignorado. Se falhar, o arquivo só fica sobrando lá, sem atrapalhar.
async function apagarImagemDoStorage(endereco) {
    const marca = "/storage/v1/object/public/imagens/";

    if (!temBanco() || typeof endereco !== "string" || !endereco.includes(marca)) {
        return;
    }

    // Tudo depois da marca é o caminho: "<id da campanha>/<nome>.webp"
    const caminho = decodeURIComponent(endereco.split(marca)[1]);

    const { error } = await clienteSupabase.storage.from("imagens").remove([caminho]);

    if (error) {
        console.error("Não foi possível apagar a imagem do Storage:", error);
    }
}

// Ainda é base64 (de antes do Storage)? Endereços normais começam com "http".
function ehBase64(src) {
    return typeof src === "string" && src.startsWith("data:");
}
