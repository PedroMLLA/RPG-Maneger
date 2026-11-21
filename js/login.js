// Login do mestre: entrar ou criar conta com e-mail e senha (Supabase Auth).
// Depois de entrar, vai para a roda de campanhas.

const formularioLogin = document.getElementById("formulario-login");
const tituloLogin = document.getElementById("titulo-login");
const campoEmail = document.getElementById("email-login");
const campoSenha = document.getElementById("senha-login");
const mensagemLogin = document.getElementById("mensagem-login");
const botaoEntrar = document.getElementById("botao-entrar");
const textoTrocarModo = document.getElementById("texto-trocar-modo");
const botaoTrocarModo = document.getElementById("botao-trocar-modo");

const PAGINA_DEPOIS_DO_LOGIN = "campanhas.html";

// "entrar" ou "criar"
let modo = "entrar";


// Já está logado? Nem mostra o formulário.
clienteSupabase.auth.getSession().then(function(resposta) {
    if (resposta.data.session) {
        window.location.href = PAGINA_DEPOIS_DO_LOGIN;
    }
});


function mostrarMensagem(texto, tipo) {
    mensagemLogin.textContent = texto;
    mensagemLogin.dataset.tipo = tipo; // "erro" ou "aviso" (cores no CSS)
    mensagemLogin.hidden = false;
}

// As mensagens do Supabase vêm em inglês: traduz as mais comuns
function traduzirErro(erro) {
    const texto = erro.message || "";

    if (texto.includes("Invalid login credentials")) {
        return "E-mail ou senha errados.";
    }
    if (texto.includes("Email not confirmed")) {
        return "Confirme o seu e-mail antes de entrar (veja a caixa de entrada).";
    }
    if (texto.includes("User already registered")) {
        return "Já existe uma conta com esse e-mail. Tente entrar.";
    }
    if (texto.includes("Password should be")) {
        return "A senha precisa ter pelo menos 6 caracteres.";
    }
    if (texto.includes("Failed to fetch")) {
        return "Sem conexão com o servidor. Confira a internet.";
    }

    return `Não deu certo: ${texto}`;
}


botaoTrocarModo.addEventListener("click", function() {
    modo = modo === "entrar" ? "criar" : "entrar";

    const criando = modo === "criar";

    tituloLogin.textContent = criando ? "Criar conta" : "Entrar";
    botaoEntrar.textContent = criando ? "Criar conta" : "Entrar";
    textoTrocarModo.textContent = criando ? "Já tem conta?" : "Primeira vez aqui?";
    botaoTrocarModo.textContent = criando ? "Entrar" : "Criar conta";
    campoSenha.autocomplete = criando ? "new-password" : "current-password";

    mensagemLogin.hidden = true;
});


// "async" deixa usar "await": o código espera a resposta do servidor
// antes de seguir para a próxima linha, sem travar a página.
formularioLogin.addEventListener("submit", async function(event) {
    // Sem isso, o formulário recarregaria a página
    event.preventDefault();

    const email = campoEmail.value.trim();
    const senha = campoSenha.value;

    botaoEntrar.disabled = true;
    mensagemLogin.hidden = true;

    try {
        if (modo === "entrar") {
            const { error } = await clienteSupabase.auth.signInWithPassword({
                email: email,
                password: senha
            });

            if (error) {
                mostrarMensagem(traduzirErro(error), "erro");
                return;
            }

            window.location.href = PAGINA_DEPOIS_DO_LOGIN;

        } else {
            const { data, error } = await clienteSupabase.auth.signUp({
                email: email,
                password: senha
            });

            if (error) {
                mostrarMensagem(traduzirErro(error), "erro");
                return;
            }

            // Se o Supabase pedir confirmação por e-mail, ainda não há sessão
            if (!data.session) {
                mostrarMensagem("Conta criada! Abra o e-mail que o Supabase mandou e clique no link para confirmar. Depois é só entrar.", "aviso");
                return;
            }

            window.location.href = PAGINA_DEPOIS_DO_LOGIN;
        }

    } catch (erro) {
        mostrarMensagem(traduzirErro(erro), "erro");

    } finally {
        // "finally" roda sempre, deu certo ou não
        botaoEntrar.disabled = false;
    }
});
