// --- KORUMA KODLARI BAŞLANGIÇ ---
document.addEventListener('contextmenu', event => event.preventDefault());
document.onkeydown = function (e) {
    if (e.keyCode == 123) return false;
    if (e.ctrlKey && e.shiftKey && e.keyCode == 'I'.charCodeAt(0)) return false;
    if (e.ctrlKey && e.shiftKey && e.keyCode == 'J'.charCodeAt(0)) return false;
    if (e.ctrlKey && e.keyCode == 'U'.charCodeAt(0)) return false;
};
setInterval(function() {
    debugger;
}, 100);
// --- KORUMA KODLARI BİTİŞ ---

let activePlayer = 0;
let players = [];
let hlsInstances = [];
let plyrInstances = []; 
let playerInfos = [];

// SİDEBAR AÇMA/KAPAMA
function toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    const toggleBtn = document.querySelector(".toggle-btn");
    sidebar.classList.toggle("collapsed");
    toggleBtn.innerText = sidebar.classList.contains("collapsed") ? "▶" : "◀";
}

// SİNEMA MODU
function toggleCinemaMode() {
    document.body.classList.toggle("cinema-mode");
    const btn = document.getElementById("cinema-btn");
    btn.innerText = document.body.classList.contains("cinema-mode") ? "Işıkları Aç" : "Sinema Modu";
}

// RESİM İÇİNDE RESİM (PiP)
async function togglePiP(index) {
    if (plyrInstances[index]) {
        plyrInstances[index].pip = !plyrInstances[index].pip;
    }
}

// PLAYER KUTULARINI OLUŞTURMA
function createPlayers(count) {
    const container = document.getElementById("players");
    container.innerHTML = ""; 
    players = [];
    
    hlsInstances.forEach(h => h && h.destroy());
    plyrInstances.forEach(p => p && p.destroy());
    
    hlsInstances = [];
    plyrInstances = [];
    playerInfos = [];

    const isMobile = window.innerWidth <= 768;

    if (isMobile) {
        container.style.gridTemplateColumns = (count === 4) ? "1fr 1fr" : "1fr";
        container.style.height = "auto"; 
    } else {
        const gridStyles = { 1: { col: "1fr" }, 2: { col: "1fr", row: "1fr 1fr" }, 4: { col: "1fr 1fr" } };
        container.style.gridTemplateColumns = gridStyles[count].col;
        container.style.height = "100%";
    }

    for (let i = 0; i < count; i++) {
        const box = document.createElement("div");
        box.className = "player-box";
        box.dataset.index = i;
        if (i === activePlayer) box.classList.add("active");
        
        const info = document.createElement("div");
        info.className = "player-info";
        info.innerText = "YAYIN BEKLENİYOR...";
        box.appendChild(info);
        playerInfos.push(info);

        const pipBtn = document.createElement("button");
        pipBtn.className = "pip-btn";
        pipBtn.innerHTML = "⧉";
        pipBtn.onclick = (e) => { e.stopPropagation(); togglePiP(i); };
        box.appendChild(pipBtn);

        box.onclick = () => selectPlayer(i);
        
        const video = document.createElement("video");
        video.playsInline = true;
        video.setAttribute('webkit-playsinline', ''); 
        video.muted = (i !== activePlayer);
        
        box.appendChild(video);
        container.appendChild(box);
        
        players.push(video);
        hlsInstances.push(null);
        plyrInstances.push(null);
    }
}

// KUTU SEÇİMİ
function selectPlayer(index) {
    activePlayer = index;
    document.querySelectorAll(".player-box").forEach((el, i) => {
        el.classList.toggle("active", i === index);
        if (plyrInstances[i]) {
            plyrInstances[i].muted = (i !== index);
        }
    });
    const activeName = playerInfos[index] ? playerInfos[index].innerText : "Yayın Merkezi";
    document.getElementById("current-channel").innerText = activeName;
}

// YAYINI OYNATMA (Görüntü Sorunu Çözülmüş Versiyon)
function playStream(url, name = "Bilinmeyen Kanal") {
    if (players.length === 0) setLayout(1);

    const video = players[activePlayer];
    if (playerInfos[activePlayer]) playerInfos[activePlayer].innerText = name;
    
    // Önceki yayınları tamamen temizle
    if (hlsInstances[activePlayer]) {
        hlsInstances[activePlayer].destroy();
        hlsInstances[activePlayer] = null;
    }
    if (plyrInstances[activePlayer]) {
        plyrInstances[activePlayer].destroy();
        plyrInstances[activePlayer] = null;
    }

    // Siyah ekranı önlemek için video elementini sıfırla
    video.pause();
    video.removeAttribute('src');
    video.load();

    const plyrOptions = {
        controls: ['play-large', 'play', 'mute', 'volume', 'current-time', 'fullscreen', 'pip'],
        keyboard: { focused: true, global: false }
    };

    if (Hls.isSupported()) {
        const hls = new Hls({
            enableWorker: true,
            maxBufferLength: 10,
            liveSyncDurationCount: 3
        });
        
        hls.loadSource(url);
        hls.attachMedia(video);
        
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
            const player = new Plyr(video, plyrOptions);
            plyrInstances[activePlayer] = player;
            
            if (activePlayer === players.indexOf(video)) {
                video.play().catch(() => {
                    video.muted = true;
                    video.play();
                });
            }
        });

        hlsInstances[activePlayer] = hls;
    } else {
        video.src = url;
        const player = new Plyr(video, plyrOptions);
        plyrInstances[activePlayer] = player;
        video.play();
    }
}

// EKRAN DÜZENİ
function setLayout(count) { 
    activePlayer = 0; 
    createPlayers(count); 
}

// KANAL LİSTESİ
const channels = [
    { name: "Real Madrid - Atletico Madrid", logo: "https://image.hurimg.com/i/hurriyet/90/0x0/69bfb0415b06fcb7fa3239d6.jpg", url: "https://noisy-cake-8ebc.travestigamzes.workers.dev/https://corestream.ronaldovurdu.help//hls/s-sport.m3u8" },
    { name: "Bein Sports 1", logo: "https://trgooltv61.top/img/beinsports1.png", url: "https://noisy-cake-8ebc.travestigamzes.workers.dev/https://corestream.ronaldovurdu.help//hls/bein-sports-1.m3u8" },
    { name: "Bein Sports 2", logo: "https://trgooltv61.top/img/beinsports2.png", url: "https://noisy-cake-8ebc.travestigamzes.workers.dev/https://corestream.ronaldovurdu.help//hls/bein-sports-2.m3u8" },
    { name: "Bein Sports 3", logo: "https://trgooltv61.top/img/beinsports3.png", url: "https://noisy-cake-8ebc.travestigamzes.workers.dev/https://corestream.ronaldovurdu.help//hls/bein-sports-3.m3u8" },
    { name: "Bein Sports 4", logo: "https://trgooltv61.top/img/beinsports4.png", url: "https://noisy-cake-8ebc.travestigamzes.workers.dev/https://corestream.ronaldovurdu.help//hls/bein-sports-4.m3u8" },
    { name: "Bein Sports 5", logo: "https://trgooltv61.top/img/beinsports5.png", url: "https://noisy-cake-8ebc.travestigamzes.workers.dev/https://corestream.ronaldovurdu.help//hls/bein-sports-5.m3u8" },
    { name: "Bein Sports Max 1", logo: "https://trgooltv61.top/img/beinsportsmax1.png", url: "https://noisy-cake-8ebc.travestigamzes.workers.dev/https://corestream.ronaldovurdu.help//hls/bein-sports-max-1.m3u8" },
    { name: "Bein Sports Max 2", logo: "https://trgooltv61.top/img/beinsportsmax2.png", url: "https://noisy-cake-8ebc.travestigamzes.workers.dev/https://corestream.ronaldovurdu.help//hls/bein-sports-max-2.m3u8" },
    { name: "Tivibu Spor 2", logo: "https://itv224186.tmp.tivibu.com.tr:6430/images/poster/20250801839221.png", url: "https://noisy-cake-8ebc.travestigamzes.workers.dev/https://corestream.ronaldovurdu.help//hls/tivibu-spor-2.m3u8" },
    { name: "Tivibu Spor 3", logo: "https://itv224186.tmp.tivibu.com.tr:6430/images/poster/20250801839221.png", url: "https://noisy-cake-8ebc.travestigamzes.workers.dev/https://corestream.ronaldovurdu.help//hls/tivibu-spor-3.m3u8" },
    { name: "S Sport", logo: "https://www.trgoals125.top/lib/img/channels/s-sport.png", url: "https://noisy-cake-8ebc.travestigamzes.workers.dev/https://corestream.ronaldovurdu.help//hls/s-sport.m3u8" },
    { name: "S Sport 2", logo: "https://www.trgoals125.top/lib/img/channels/s-sport-2.png", url: "https://noisy-cake-8ebc.travestigamzes.workers.dev/https://corestream.ronaldovurdu.help//hls/s-sport-2.m3u8" },
    { name: "Tabii Spor", logo: "", url: "https://kl9mr2vxw7nq5py1sh4tj3gb6.medya.trt.com.tr/master_1080p.m3u8" },
    { name: "Tabii Spor 1", logo: "", url: "https://pz4qt7nw1mr9sh2vl5xk8jg3y.medya.trt.com.tr/master.m3u8" },
    { name: "Tabii Spor 2 ", logo: "", url: "https://mr8bv4kl1nq7sh9tw2xp5zj6g.medya.trt.com.tr/master_1440p.m3u8" },
    { name: "Tabii Spor 3", logo: "", url: "https://mR4vL7nQ2sH9tW5xP1zK3gJ8b.medya.trt.com.tr/master.m3u8" },
    { name: "TRT Spor", logo: "https://www.trgoals124.top/lib/img/channels/trt-spor.png", url: "https://tv-trtspor1.medya.trt.com.tr/master.m3u8" },
    { name: "TRT Spor Yıldız", logo: "https://spormeydani.org/wp-content/uploads/2021/05/TRT_Spor_Star_Landscape_on_Light_6000x3000.png", url: "https://tv-trtspor2.medya.trt.com.tr/master.m3u8" },
    { name: "Trt 1", logo: "https://images.seeklogo.com/logo-png/26/2/trt-1-logo-png_seeklogo-260967.png", url: "https://tv-trt1.medya.trt.com.tr/master.m3u8" },
    { name: "Atv", logo: "https://iatv.tmgrup.com.tr/site/v2/i/atv-logo.png", url: "https://trkvz.daioncdn.net/atv/atv.m3u8?ce=3&app=d1ce2d40-5256-4550-b02e-e73c185a314e&st=Z6CX80tIdZAkt5Z0jDtziQ&e=1774009917&ppid=a78162fd54f80e6de01ef6123db2f50a" },
    { name: "A Spor (1080p)", logo: "https://www.trgoals124.top/lib/img/channels/a-spor.png", url: "https://noisy-cake-8ebc.travestigamzes.workers.dev/https://corestream.ronaldovurdu.help//hls/a-spor.m3u8" }
];

function renderChannels(filter = "") {
    const list = document.getElementById("channels"); 
    list.innerHTML = "";
    channels.filter(c => c.name.toLowerCase().includes(filter.toLowerCase())).forEach(c => {
        const div = document.createElement("div"); 
        div.className = "channel"; 
        div.innerHTML = `<div class="channel-logo">${c.logo ? `<img src="${c.logo}">` : `⚽`}</div><div class="channel-name">${c.name}</div>`;
        div.onclick = () => {
            playStream(c.url, c.name);
            document.querySelectorAll(".channel").forEach(el => el.classList.remove("selected-chan"));
            div.classList.add("selected-chan");
            if(window.innerWidth <= 768) toggleSidebar();
        };
        list.appendChild(div);
    });
}

document.getElementById("search").addEventListener("input", e => renderChannels(e.target.value));
renderChannels();
