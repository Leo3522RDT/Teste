const form = document.getElementById("frmCEP");
const cepInput = document.getElementById("cep");
const btnPesquisar = document.getElementById("btnPesquisar");
const btnLimpar = document.getElementById("btnLimpar");
const status = document.getElementById("status");
const btnMusic = document.getElementById("btnMusic");
const bgMusic = document.getElementById("bgMusic");

const fields = {
    logradouro: document.getElementById("logradouro"),
    bairro: document.getElementById("bairro"),
    cidade: document.getElementById("cidade"),
    estado: document.getElementById("estado"),
};

const API_BASE_URL = "https://viacep.com.br/ws";
const CEP_LENGTH = 8;

/* ===== Música local ===== */
let isPlaying = false;

btnMusic.addEventListener("click", () => {
    if (!bgMusic) return;

    if (isPlaying) {
        bgMusic.pause();
        isPlaying = false;
        btnMusic.classList.remove("playing");
        btnMusic.innerHTML = "▶ TOCAR";
    } else {
        const playPromise = bgMusic.play();
        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    isPlaying = true;
                    btnMusic.classList.add("playing");
                    btnMusic.innerHTML = "⏸ PAUSAR";
                })
                .catch((err) => {
                    console.warn("Não foi possível tocar o áudio:", err);
                    btnMusic.innerHTML = "SEM ÁUDIO";
                    setTimeout(() => {
                        btnMusic.innerHTML = "▶ TOCAR";
                    }, 2000);
                });
        }
    }
});

bgMusic.addEventListener("ended", () => {
    // loop nativo, mas por segurança
    isPlaying = false;
    btnMusic.classList.remove("playing");
    btnMusic.innerHTML = "▶ TOCAR";
});

bgMusic.addEventListener("error", () => {
    console.warn("Arquivo de áudio não encontrado. Coloque lets-kill-each-other-kpszh.mp3 na mesma pasta.");
});

/* ===== CEP Logic ===== */
function normalizeCEP(value) {
    return value.replace(/\D/g, "").slice(0, CEP_LENGTH);
}

function formatCEP(value) {
    const digits = normalizeCEP(value);
    return digits.length > 5
        ? `${digits.slice(0, 5)}-${digits.slice(5)}`
        : digits;
}

function getCEP() {
    return normalizeCEP(cepInput.value);
}

function setStatus(message = "", type = "") {
    status.textContent = message;
    if (message) {
        status.className = `status visible${type ? ` ${type}` : ""}`;
    } else {
        status.className = "status";
    }
}

function setLoading(loading) {
    btnPesquisar.disabled = loading;
    btnLimpar.disabled = loading;
    btnPesquisar.classList.toggle("loading", loading);
    btnPesquisar.innerHTML = loading
        ? `<span class="loading-ring"></span> Consultando...`
        : `Investigar 🔎`;
}

function clearResults() {
    Object.values(fields).forEach((field) => {
        field.value = "";
    });
}

function clearScreen() {
    cepInput.value = "";
    clearResults();
    setStatus("");
    cepInput.focus();
}

function fillAddress(data) {
    fields.logradouro.value = data.logradouro || "Não informado";
    fields.bairro.value = data.bairro || "Não informado";
    fields.cidade.value = data.localidade || "Não informado";
    fields.estado.value = data.uf || "Não informado";
}

async function consultarCEP(event) {
    event.preventDefault();

    const cep = getCEP();

    if (cep.length !== CEP_LENGTH) {
        clearResults();
        setStatus("CEP inválido. Digite 8 números ou enfrente o Monokuma.", "error");
        cepInput.focus();
        return;
    }

    setLoading(true);
    setStatus("Investigando o CEP... A verdade será revelada.");
    clearResults();

    try {
        const response = await fetch(`${API_BASE_URL}/${cep}/json/`);

        if (!response.ok) {
            throw new Error("Falha na comunicação com o serviço de CEP.");
        }

        const data = await response.json();

        if (data.erro) {
            throw new Error("CEP não encontrado. Esta evidência não existe.");
        }

        fillAddress(data);
        setStatus("Investigação concluída. Endereço localizado.", "success");

        setTimeout(() => {
            if (status.classList.contains("success")) {
                setStatus("");
            }
        }, 2800);
    } catch (error) {
        clearResults();
        setStatus(
            error instanceof Error
                ? error.message
                : "Não foi possível consultar o CEP. Tente novamente.",
            "error"
        );
    } finally {
        setLoading(false);
    }
}

cepInput.addEventListener("input", () => {
    cepInput.value = formatCEP(cepInput.value);
    setStatus("");
});

form.addEventListener("submit", consultarCEP);
btnLimpar.addEventListener("click", clearScreen);

cepInput.focus();
