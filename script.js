
lucide.createIcons(); // cria os ícones do lucide 

let messages = [];// guarda todos os versiculo do JSON
let currentVerseData = null;// versiculo que ta sendo exibido agora
let isDarkMode = false;// controle do tema (claro/escuro)

// ============== INICIALIZAÇÃO 
window.onload = () => {
    // carrega o arquivo JSON com os versículos
    fetch('versiculos.json')
        .then(response => response.json())
        .then(data => {
            messages = data;// guarda os versículo na variavel global
            verificarCooldown();// ve se ja tem versiculo do dia no localStorage
        })
        .catch(error => console.error('Erro ao carregar versículos:', error));

    renderizarHistorico();// monta a lista do historico (se tiver)
    renderizarSalvos();// monta a lista de salvos (curtidos)
    iniciarTema();// aplica o tema que o usuario escolheu antes
};

// ==================== MENU MOBILE E TROCAR DE ABA 
function toggleMobileMenu() {
    const tabs = document.getElementById('nav-tabs');// pega as abas
    const icon = document.getElementById('mobile-menu-icon');// icone do hamburguer
    tabs.classList.toggle('open');// mostra/esconde o menu
    if (tabs.classList.contains('open')) icon.setAttribute('data-lucide', 'x'); // vira X
    else icon.setAttribute('data-lucide', 'menu');// volta menu
    lucide.createIcons();// recria os ícones depois de trocar
}

function switchTab(tab) {
    // esconde todas as seções e desativa todas as abas
    document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    // mostra a seção clicada e ativa o botão correspondente
    document.getElementById(`view-${tab}`).classList.add('active');
    document.querySelectorAll(`.tab-btn[data-tab="${tab}"]`).forEach(el => el.classList.add('active'));
    
    // se o menu mobile tiver aberto, fecha ele ao trocar de aba
    const navTabs = document.getElementById('nav-tabs');
    if (navTabs.classList.contains('open')) toggleMobileMenu();

    // se for a aba de salvos ou historico, recarrega as listas pra garantir
    if(tab === 'saved') renderizarSalvos();
    if(tab === 'history') renderizarHistorico();
}

// ========================= TEMA CLARO/ESCURO 
function iniciarTema() {
    const temaSalvo = localStorage.getItem('themePref');
    if (temaSalvo === 'dark') {
        isDarkMode = true;
        document.body.classList.add('dark');
    }
    atualizarIconeTema();
    iniciarParticulas();// reinicia as partículas com as cores do tema
}

function toggleTheme() {// alterna o tema e salva a preferência no localStorage
    isDarkMode = !isDarkMode;
    if (isDarkMode) {
        document.body.classList.add('dark');
        localStorage.setItem('themePref', 'dark');
    } else {
        document.body.classList.remove('dark');
        localStorage.setItem('themePref', 'light');
    }
    atualizarIconeTema();
    iniciarParticulas();// muda as partículas conforme o novo tema
}

function atualizarIconeTema() {
    const icon = document.getElementById('theme-icon');
    icon.setAttribute('data-lucide', isDarkMode ? 'sun' : 'moon');
    lucide.createIcons();
}

// ==================== FUNDO DE PARTICULAS  
function iniciarParticulas() {
    // cor das partículas muda conforme o tema: cinza escuro ou cinza claro
    const corParticula = isDarkMode ? "#3f3f46" : "#cbd5e1"; 
    const opacidadeLinha = isDarkMode ? 0.2 : 0.8;
    particlesJS("particles-js", {
        particles: {
            number: { value: 60, density: { enable: true, value_area: 800 } },
            color: { value: corParticula },
            shape: { type: "circle" },
            opacity: { value: 0.5, random: false },
            size: { value: 3, random: true },
            line_linked: { enable: true, distance: 150, color: corParticula, opacity: opacidadeLinha, width: 1 },
            move: { enable: true, speed: 2, direction: "none", random: true, out_mode: "out" }
        },
        interactivity: { detect_on: "canvas", events: { onhover: { enable: false }, onclick: { enable: false }, resize: true } },
        retina_detect: true
    });
}

// ===============LÓGICA DO VERSICULO DIARIO 
function verificarCooldown() {
    const lastClick = localStorage.getItem("lastClickTime");
    const savedVerse = localStorage.getItem("savedDailyVerse");
    const cooldownTime = 24 * 60 * 60 * 1000; // Tempo de 24 horas
    const now = new Date().getTime();

    // se já pegou um versículo hoje e ainda não passou o cooldown, exibe ele direto
    if (lastClick && savedVerse && (now - lastClick < cooldownTime)) {
        currentVerseData = JSON.parse(savedVerse);
        mostrarVersiculoNaTela(currentVerseData);
        atualizarBotaoLikePrincipal();
        document.getElementById('cooldown-container').style.display = "block";
    }
}
// gera um versiculo aleatorio
function gerarVersiculo() {
    const btnText = document.getElementById("btn-text");
    const btn = document.getElementById("generate-btn");

    if (messages.length === 0) return alert("Carregando versículos...");

    btn.disabled = true;
    btnText.innerHTML = `<i data-lucide="loader-2" class="spin" style="margin-right: 8px;"></i> Revelando...`;
    lucide.createIcons();

    setTimeout(() => {
        const now = new Date().getTime();
        localStorage.setItem("lastClickTime", now);

        // evita repetir versículos recentes - usa um histórico de ids
        let usedIds = JSON.parse(localStorage.getItem("usedVersesIds")) || [];
        let availableVerses = messages.filter(msg => !usedIds.includes(msg.id));

        // se já usou todos, reseta
        if (availableVerses.length === 0) {
            usedIds = []; 
            availableVerses = [...messages];
        }

        const randomIndex = Math.floor(Math.random() * availableVerses.length);
        currentVerseData = availableVerses[randomIndex];
        currentVerseData.date = new Date().toISOString(); // guarda a data pra mostrar no histórico
        
        usedIds.push(currentVerseData.id);
        localStorage.setItem("usedVersesIds", JSON.stringify(usedIds));
        localStorage.setItem("savedDailyVerse", JSON.stringify(currentVerseData));
        
        adicionarAoHistorico(currentVerseData);
        mostrarVersiculoNaTela(currentVerseData);
        atualizarBotaoLikePrincipal();
        
        document.getElementById('cooldown-container').style.display = "block";
    }, 1000);
}

function mostrarVersiculoNaTela(verseData) {
    // esconde o estado vazio (botão) e mostra o versículo
    document.getElementById('empty-state').style.display = 'none';
    document.getElementById('message-text').innerText = `"${verseData.text}"`;
    document.getElementById('message-ref').innerText = verseData.reference;
    document.getElementById('message-container').classList.add('show');
}

// ========================= LIKES - SALVAR VERSÍCULOS 
function getSalvos() { return JSON.parse(localStorage.getItem('savedVersesList')) || []; }

function toggleLikeCurrent() {
    if(!currentVerseData) return;
    toggleLikeLogica(currentVerseData);
    atualizarBotaoLikePrincipal();
    renderizarSalvos();// atualiza a lista de salvos na aba
}

function toggleLikeLogica(verse) {
    let salvos = getSalvos();
    const index = salvos.findIndex(v => v.id === verse.id);
    if (index >= 0) salvos.splice(index, 1);// se já ta salvo, remove
    else salvos.unshift(verse);// senão, adiciona no começo
    localStorage.setItem('savedVersesList', JSON.stringify(salvos));
}

function atualizarBotaoLikePrincipal() {
    if(!currentVerseData) return;
    const salvos = getSalvos();
    const btn = document.getElementById('main-like-btn');
    if(salvos.some(v => v.id === currentVerseData.id)) btn.classList.add('liked');
    else btn.classList.remove('liked');
}

// ============== RENDERIZAÇÃO DAS LISTAS 
function renderizarHistorico() {
    let hist = JSON.parse(localStorage.getItem('verseHistory')) || [];
    const list = document.getElementById('historico-list');
    
    if (hist.length === 0) {
        list.innerHTML = '<div class="empty-list">Seu histórico aparecerá aqui.</div>';
        return;
    }
    list.innerHTML = hist.map(v => criarCardHtml(v)).join('');
    lucide.createIcons();
}

function renderizarSalvos() {
    let salvos = getSalvos();
    const list = document.getElementById('saved-list');
    
    if (salvos.length === 0) {
        list.innerHTML = '<div class="empty-list">Você ainda não salvou nenhum versículo.</div>';
        return;
    }
    list.innerHTML = salvos.map(v => criarCardHtml(v)).join('');
    lucide.createIcons();
}

// =============== FUNÇÃO QUE CRIA O HTML DE CADA CARD 
function criarCardHtml(v) {
    let d = new Date(v.date);
    let strData = d.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' });
    let heartClass = getSalvos().some(s => s.id === v.id) ? 'liked' : '';
    let verseJson = encodeURIComponent(JSON.stringify(v));  // guarda o objeto pra usar no onclick

    return `
        <div class="history-card">
            <div class="card-top">
                <span class="hist-date">${strData}</span>
                <div class="action-buttons">
                    <button class="icon-btn ${heartClass}" onclick="handleListLike('${verseJson}')"><i data-lucide="heart"></i></button>
                </div>
            </div>
            <p class="hist-text">"${v.text}"</p>
            <div class="hist-footer">
                <span class="hist-ref">${v.reference}</span>
                <button class="icon-btn" onclick="shareVerse(JSON.parse(decodeURIComponent('${verseJson}')))"><i data-lucide="share-2"></i></button>
            </div>
        </div>
    `;
}

function handleListLike(encodedVerse) { // recebe o versículo clicado na lista (histórico ou salvos), alterna o like e atualiza as listas
    const verse = JSON.parse(decodeURIComponent(encodedVerse));
    toggleLikeLogica(verse);
    renderizarSalvos();// atualiza a aba de salvos
    renderizarHistorico(); // atualiza o histórico também (pra sincronizar o coração)
    if(currentVerseData && currentVerseData.id === verse.id) atualizarBotaoLikePrincipal();
}

// ======== ADICIONA AO HISTÓRICO 
function adicionarAoHistorico(verse) {
    let hist = JSON.parse(localStorage.getItem('verseHistory')) || [];
    if (hist.length === 0 || hist[0].id !== verse.id) {
        hist.unshift(verse); // coloca o novo no começo
        if (hist.length > 30) hist.pop(); // mantém só os 30 últimos
        localStorage.setItem('verseHistory', JSON.stringify(hist));
    }
    renderizarHistorico();
}

// ======================== COMPARTILHAR GERA IMAGEM DO VERSICULO
async function shareVerse(verseObj) {
    const isDark = document.body.classList.contains('dark');
    
    // cria um card gigante fora da tela pra tirar o print
    const card = document.createElement('div');
    card.style = `
        position: fixed; left: -9999px; width: 1080px; height: 1920px;
        display: flex; flex-direction: column; justify-content: space-between;
        align-items: center; padding: 150px 80px; text-align: center;
        font-family: 'Inter', sans-serif;
        background-color: ${isDark ? '#09090b' : '#ffffff'};
        background-image: 
            radial-gradient(circle at 50% 10%, ${isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.05)'}, transparent 50%),
            linear-gradient(${isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'} 1px, transparent 1px),
            linear-gradient(90deg, ${isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'} 1px, transparent 1px);
        background-size: 100% 100%, 50px 50px, 50px 50px;
    `;

    card.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; gap: 30px;">
            <div style="position: relative;">
                <img src="/apple-touch-icon.png" crossorigin="anonymous" style="width: 180px; height: 180px; border-radius: 40px; position: relative; display: block;">
            </div>
            <div style="font-size: 38px; font-weight: 900; letter-spacing: 7px; color: ${isDark ? '#fafafa' : '#1e293b'}; text-transform: uppercase;">
                Versículo Diário
            </div>
        </div>

        <div style="position: relative; width: 100%; padding: 0 40px;">
            <div style="font-family: 'Playfair Display', serif; font-size: 450px; color: #6366f1; opacity: 0.12; position: absolute; top: -230px; left: 0; line-height: 1;">“</div>
            <div style="font-family: 'Playfair Display', serif; font-size: 55px; line-height: 1.4; color: ${isDark ? '#f8fafc' : '#1e293b'}; position: relative; font-weight: 600;">
                ${verseObj.text}
            </div>
            <div style="margin-top: 100px;">
                <span style="font-size: 48px; font-weight: 800; color: #ffffff; background: #6366f1; padding: 20px 50px; border-radius: 18px; box-shadow: 0 15px 30px rgba(99, 102, 241, 0.3);">
                    ${verseObj.reference}
                </span>
            </div>
        </div>

        <div style="display: flex; flex-direction: column; align-items: center; gap: 20px;">
            <div style="width: 100px; height: 4px; background: #6366f1; border-radius: 2px; opacity: 0.4;"></div>
            <div style="font-size: 32px; font-weight: 600; color: ${isDark ? '#52525b' : '#a1a1aa'}; letter-spacing: 3px; text-transform: uppercase;">
                Compartilhe a palavra do nosso Senhor Jesus Cristo!
            </div>
        </div>
    `;

    document.body.appendChild(card);

    // Espera as imagens carregarem antes de tirar o print (evita imagem quebrada)
    const images = card.getElementsByTagName('img');
    await Promise.all(Array.from(images).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => { img.onload = resolve; img.onerror = resolve; });
    }));

    try {
        const canvas = await html2canvas(card, { 
            scale: 2, 
            useCORS: true, 
            allowTaint: true,
            backgroundColor: isDark ? '#09090b' : '#ffffff' 
        });
        
        const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
        const file = new File([blob], 'versiculo.png', { type: 'image/png' });

        // tenta compartilhar nativamente no mobile ou baixa a imagem
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], title: 'Versículo do dia' });
        } else {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'versiculo_premium.png';
            link.click();
        }
    } catch (err) {
        console.error(err);
    } finally {
        document.body.removeChild(card); // limpa o elemento criado
    }
}