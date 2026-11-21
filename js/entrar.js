// Entrada do jogador: digita o código da campanha e vê a mesa.
// Sem e-mail nem senha: por trás, o Supabase cria uma "conta anônima"
// para este aparelho, e é ela que as regras do banco reconhecem.

const formularioCodigo = document.getElementById("formulario-codigo");
const campoCodigo = document.getElementById("campo-codigo");
const mensagemCodigo = document.getElementById("mensagem-codigo");
const botaoEntrarMesa = document.getElementById("botao-entrar-mesa");

// Já entrou antes neste aparelho? O código vem preenchido.
campoCodigo.value = Armazenamento.ler("ultimoCodigo", "");

// Letras sempre maiúsculas e sem espaços, enquanto digita
campoCodigo.addEventListener("input", function() {
    campoCodigo.value = campoCodigo.value.toUpperCase().replace(/\s/g, "");
});

function mostrarErro(texto) {
    mensagemCodigo.textContent = texto;
    mensagemCodigo.dataset.tipo = "erro";
    mensagemCodigo.hidden = false;
}

function traduzirErro(erro) {
    const texto = (erro && erro.message) || String(erro);

    if (texto.includes("Código não encontrado")) {
        return "Esse código não existe. Confira com o mestre.";
    }
    if (texto.includes("Anonymous sign-ins are disabled")) {
        return "A entrada de jogadores está desligada no servidor. Avise o mestre.";
    }
    if (texto.includes("Failed to fetch")) {
        return "Sem conexão com o servidor. Confira a internet.";
    }

    return `Não deu certo: ${texto}`;
}


formularioCodigo.addEventListener("submit", async function(event) {
    event.preventDefault();

    const codigo = campoCodigo.value.trim().toUpperCase();

    botaoEntrarMesa.disabled = true;
    mensagemCodigo.hidden = true;

    try {
        // 1) Garante que este aparelho está conectado. Se o mestre abrir
        //    esta página no próprio navegador, usa a conta dele mesmo
        //    (assim o login de mestre não é trocado por um anônimo).
        const { data } = await clienteSupabase.auth.getSession();

        if (!data.session) {
            const anonimo = await clienteSupabase.auth.signInAnonymously();

            if (anonimo.error) {
                throw anonimo.error;
            }
        }

        // 2) O banco confere o código e libera a campanha para este aparelho
        const { data: idCampanha, error } = await clienteSupabase.rpc("entrar_com_codigo", {
            p_codigo: codigo
        });

        if (error) {
            throw error;
        }

        Armazenamento.salvar("ultimoCodigo", codigo);

        // 3) Abre a mesa dessa campanha
        window.location.href = `jogador.html?campanha=${encodeURIComponent(idCampanha)}`;

    } catch (erro) {
        console.error(erro);
        mostrarErro(traduzirErro(erro));
        botaoEntrarMesa.disabled = false;
    }
});
