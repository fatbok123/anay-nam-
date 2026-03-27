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
let playerInfos = [];

// --- SEKMELİ SİDEBAR KONTROL ---
function switchTab(tabName) {
    // Sekme içeriklerini gizle/göster
    document.getElementById('tab-channels').classList.toggle('active', tabName === 'channels');
    document.getElementById('tab-matches').classList.toggle('active', tabName === 'matches');
    
    // Buton aktiflik sınıflarını güncelle
    document.getElementById('btn-channels').classList.toggle('active', tabName === 'channels');
    document.getElementById('id-matches').classList.toggle('active', tabName === 'matches');
}

function toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    const toggleBtn = document.querySelector(".toggle-btn");
    sidebar.classList.toggle("collapsed");
    // Mobilde sidebar açıksa body'yi kilitlemek için (isteğe bağlı)
    if(window.innerWidth <= 768) {
        sidebar.classList.toggle("active");
    }
    toggleBtn.innerText = sidebar.classList.contains("collapsed") ? "▶" : "◀";
}

// SİNEMA MODU
function toggleCinemaMode() {
    document.body.classList.toggle("cinema-mode");
    const btn = document.getElementById("cinema-btn");
    btn.innerText = document.body.classList.contains("cinema-mode") ? "Normal Moda Dön" : "Sinema Modu";
}

// PiP DESTEĞİ
async function togglePiP(index) {
    const player = players[index];
    if (!player) return;
    const video = player.media;
    try {
        if (video !== document.pictureInPictureElement) await video.requestPictureInPicture();
        else await document.exitPictureInPicture();
    } catch (error) { console.error("PiP Hatası:", error); }
}

// PLAYER OLUŞTURMA
function createPlayers(count) {
    const container = document.getElementById("players");
    container.innerHTML = ""; 
    
    players.forEach(p => p && p.destroy());
    hlsInstances.forEach(h => h && h.destroy());
    
    players = []; hlsInstances = []; playerInfos = [];

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
        box.className = `player-box ${i === activePlayer ? 'active' : ''}`;
        box.id = `box-${i}`;
        box.dataset.index = i;
        
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
        
        const videoEl = document.createElement("video");
        videoEl.id = `plyr-player-${i}`;
        videoEl.setAttribute('playsinline', '');
        if (i !== activePlayer) videoEl.muted = true;

        box.appendChild(videoEl);
        container.appendChild(box);

        const p = new Plyr(videoEl, {
            controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'fullscreen'],
            keyboard: { focused: true, global: false }
        });

        players.push(p);
        hlsInstances.push(null);
    }
}

// OYNATICI SEÇİMİ
function selectPlayer(index) {
    activePlayer = index;
    document.querySelectorAll(".player-box").forEach((el, i) => {
        el.classList.toggle("active", i === index);
        if (players[i]) players[i].muted = (i !== index);
    });
    const activeName = playerInfos[index] ? playerInfos[index].innerText : "İzlemek istediğiniz içeriği seçin";
    document.getElementById("current-channel").innerText = activeName;
}

// CANLI YAYIN BAŞLATMA
function playStream(url, name = "Bilinmeyen Kanal") {
    // Eğer karşılama ekranı varsa onu temizle ve player'ı kur
    if (document.querySelector('.welcome-screen')) {
        setLayout(1);
    }

    const player = players[activePlayer];
    const box = document.getElementById(`box-${activePlayer}`);
    const video = player.media;
    
    if (playerInfos[activePlayer]) playerInfos[activePlayer].innerText = name.toUpperCase();
    document.getElementById("current-channel").innerText = name.toUpperCase();
    
    if (hlsInstances[activePlayer]) hlsInstances[activePlayer].destroy();
    const oldIframe = box.querySelector('iframe');
    if (oldIframe) oldIframe.remove();
    video.style.display = "block"; 
    box.querySelector('.plyr').style.display = "block";

    if (!url.includes(".m3u8") || url.includes("aapmains.net")) {
        video.style.display = "none"; 
        box.querySelector('.plyr').style.display = "none";
        const iframe = document.createElement("iframe");
        iframe.src = url;
        iframe.style.width = "100%"; iframe.style.height = "100%"; iframe.style.border = "none";
        iframe.allow = "autoplay; fullscreen";
        box.appendChild(iframe);
        return; 
    }

    if (Hls.isSupported()) {
        const hls = new Hls({ maxBufferLength: 30, enableWorker: true, startLevel: -1 });
        hls.loadSource(url);
        hls.attachMedia(video);
        hlsInstances[activePlayer] = hls;
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
            player.play().catch(() => { player.muted = true; player.play(); });
        });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url;
        player.play();
    }
}

function setLayout(count) { 
    activePlayer = 0; 
    createPlayers(count); 
}

// KANAL VERİLERİ (BOZULMADI)
const channels = [
    { name: "Bein Sports 1", logo: "https://trgooltv61.top/img/beinsports1.png", url: "https://hlsssssss.ercansov.workers.dev/https://corestream.ronaldovurdu.help//hls/bein-sports-1.m3u8" },
    { name: "Bein Sports 1 (YEDEK)", logo: "https://trgooltv61.top/img/beinsports1.png", url: "https://curly-fire-b7a1.bestlivever.workers.dev/watch/chunk/yayinz.m3u8" },
    { name: "Bein Sports 2", logo: "https://trgooltv61.top/img/beinsports2.png", url: "https://noisy-cake-8ebc.travestigamzes.workers.dev/https://corestream.ronaldovurdu.help//hls/bein-sports-2.m3u8" },
    { name: "Bein Sports 2 (YEDEK)", logo: "https://trgooltv61.top/img/beinsports2.png", url: "https://hlsssssss.ercansov.workers.dev/https://corestream.ronaldovurdu.help//hls/bein-sports-2.m3u8" },
    { name: "Bein Sports 3", logo: "https://trgooltv61.top/img/beinsports3.png", url: "https://hlsssssss.ercansov.workers.dev/https://corestream.ronaldovurdu.help//hls/bein-sports-3.m3u8" },
    { name: "Bein Sports 4", logo: "https://trgooltv61.top/img/beinsports4.png", url: "https://noisy-cake-8ebc.travestigamzes.workers.dev/https://corestream.ronaldovurdu.help//hls/bein-sports-4.m3u8" },
    { name: "Bein Sports 5", logo: "https://trgooltv61.top/img/beinsports5.png", url: "https://hlsssssss.ercansov.workers.dev/https://corestream.ronaldovurdu.help//hls/bein-sports-5.m3u8" },
    { name: "Bein Sports Max 1", logo: "https://trgooltv61.top/img/beinsportsmax1.png", url: "https://noisy-cake-8ebc.travestigamzes.workers.dev/https://corestream.ronaldovurdu.help//hls/bein-sports-max-1.m3u8" },
    { name: "Bein Sports Max 2", logo: "https://trgooltv61.top/img/beinsportsmax2.png", url: "https://noisy-cake-8ebc.travestigamzes.workers.dev/https://corestream.ronaldovurdu.help//hls/bein-sports-max-2.m3u8" },
    { name: "Tivibu Spor 1", logo: "https://itv224186.tmp.tivibu.com.tr:6430/images/poster/20250801839221.png", url: "https://dga1op10s1u3leo.ec876fd9240622.click/live/xtivibuspor-1/playlist.m3u8" },
    { name: "Tivibu Spor 2", logo: "https://itv224186.tmp.tivibu.com.tr:6430/images/poster/20250801839221.png", url: "https://noisy-cake-8ebc.travestigamzes.workers.dev/https://corestream.ronaldovurdu.help//hls/tivibu-spor-2.m3u8" },
    { name: "S Sport", logo: "https://www.trgoals125.top/lib/img/channels/s-sport.png", url: "https://andro.0638527.xyz/checklist/androstreamlivess1.m3u8" },
    { name: "S Sport 2", logo: "https://www.trgoals125.top/lib/img/channels/s-sport-2.png", url: "https://andro.0638527.xyz/checklist/androstreamlivess2.m3u8" },
    { name: "Tabii Spor", logo: "", url: "https://kl9mr2vxw7nq5py1sh4tj3gb6.medya.trt.com.tr/master_1080p.m3u8" },
    { name: "TRT Spor", logo: "https://www.trgoals124.top/lib/img/channels/trt-spor.png", url: "https://tv-trtspor1.medya.trt.com.tr/master.m3u8" },
    { name: "Trt 1", logo: "https://images.seeklogo.com/logo-png/26/2/trt-1-logo-png_seeklogo-260967.png", url: "https://tv-trt1.medya.trt.com.tr/master.m3u8" },
    { name: "Atv", logo: "https://iatv.tmgrup.com.tr/site/v2/i/atv-logo.png", url: "https://trkvz.daioncdn.net/atv/atv.m3u8?ce=3&app=d1ce2d40-5256-4550-b02e-e73c185a314e&st=Z6CX80tIdZAkt5Z0jDtziQ&e=1774009917&ppid=a78162fd54f80e6de01ef6123db2f50a" }
];

// MAÇ VERİLERİ (Örnek)
const matches = [
    { teams: "Fenerbahçe - Zalgiris", time: "20:45", hd: true },
    { teams: "Panathinaikos - Monaco", time: "22:15", hd: true },
    { teams: "Barcelona - Kızılyıldız", time: "23:00", hd: true }
];

function renderChannels(filter = "") {
    const list = document.getElementById("channels"); 
    list.innerHTML = "";
    channels.filter(c => c.name.toLowerCase().includes(filter.toLowerCase())).forEach(c => {
        const div = document.createElement("div"); 
        div.className = "channel"; 
        div.innerHTML = `
            <div class="channel-logo">${c.logo ? `<img src="${c.logo}" loading="lazy">` : `⚽`}</div>
            <div class="channel-name">${c.name} <span class="sub-name">Spor • HD</span></div>
        `;
        div.onclick = () => {
            playStream(c.url, c.name);
            document.querySelectorAll(".channel").forEach(el => el.classList.remove("selected-chan"));
            div.classList.add("selected-chan");
            if(window.innerWidth <= 768) toggleSidebar();
        };
        list.appendChild(div);
    });
}

function renderMatches() {
    const list = document.getElementById("matches-list");
    list.innerHTML = "";
    matches.forEach(m => {
        const div = document.createElement("div");
        div.className = "match-card";
        div.innerHTML = `
            <div class="match-info">
                <div class="match-teams">${m.teams}</div>
                <div class="match-meta">${m.time} • ${m.hd ? 'HD' : 'SD'}</div>
            </div>
        `;
        list.appendChild(div);
    });
}

document.getElementById("search").addEventListener("input", e => renderChannels(e.target.value));

// İlk kurulum
renderChannels();
renderMatches();
