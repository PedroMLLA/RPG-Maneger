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
