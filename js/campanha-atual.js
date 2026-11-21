// Campanha atual: qual foi escolhida na roda e o mapa padrão dela.
// (Onde e como os dados de cada campanha são guardados fica no
// armazenamento.js, que vem antes deste arquivo.)

// O objeto da campanha atual ({ id, nome, imagem }), ou undefined
function campanhaEscolhida() {
    const campanhas = Armazenamento.ler("campanhas", []);

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

// O mestre trocou de campanha (em outra janela)? Recarrega esta,
// para ela passar a mostrar os dados da campanha nova.
Armazenamento.quandoMudar("campanhaAtual", function() {
    location.reload();
});
