// Porteiro das páginas do mestre (campanhas, mapa, Painel do Mestre).
// Sem login, manda para login.html. A Visão dos Jogadores NÃO usa este
// arquivo: os jogadores vão entrar pelo código da campanha.
//
// Fica no <head>: esconde a página logo de cara, para ninguém ver o
// conteúdo piscar antes de o login ser conferido.

document.documentElement.style.visibility = "hidden";

// Quem está logado (preenchido quando a sessão é conferida)
let usuarioLogado = null;

clienteSupabase.auth.getSession().then(function(resposta) {
    const sessao = resposta.data.session;

    if (!sessao) {
        // replace: o botão "voltar" do navegador não volta para cá
        window.location.replace("login.html");
        return;
    }

    usuarioLogado = sessao.user;
    document.documentElement.style.visibility = "";
});

// Saiu em outra aba? Esta também vai para o login.
clienteSupabase.auth.onAuthStateChange(function(evento) {
    if (evento === "SIGNED_OUT") {
        window.location.replace("login.html");
    }
});

async function sair() {
    await clienteSupabase.auth.signOut();
    window.location.replace("login.html");
}

// Liga o botão "Sair", se a página tiver um
document.addEventListener("DOMContentLoaded", function() {
    const botaoSair = document.getElementById("botao-sair");

    if (botaoSair) {
        botaoSair.addEventListener("click", sair);
    }
});
