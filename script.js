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

// SİDEBAR KONTROL (GÜNCELLENDİ)
function toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    const toggleBtn = document.getElementById("sidebar-toggle");
    sidebar.classList.toggle("active"); // HTML'deki yeni mantığa göre "active" kullanıyoruz
    
    if (sidebar.classList.contains("active")) {
        toggleBtn.innerText = "◀";
        toggleBtn.style.left = "260px";
    } else {
        toggleBtn.innerText = "▶";
        toggleBtn.style.left = "10px";
    }
}

// YENİ: SEKMELER ARASI GEÇİŞ (HTML'DEKİ ONCLICK İÇİN)
function switchTab(tab) {
    const tabChannels = document.getElementById('tab-channels');
    const tabMatches = document.getElementById('tab-matches');
    const btnChannels = document.getElementById('btn-channels');
    const btnMatches = document.getElementById('btn-matches');

    if(tab === 'channels') {
        tabChannels.classList.add('active');
        tabMatches.classList.remove('active');
        btnChannels.classList.add('active');
        btnMatches.classList.remove('active');
    } else {
        tabChannels.classList.remove('active');
        tabMatches.classList.add('active');
        btnChannels.classList.remove('active');
        btnMatches.classList.add('active');
        // Maçlar sekmesi seçildiğinde maçları yükle (opsiyonel fonksiyon eklenebilir)
        renderMatches(); 
    }
}

// SİNEMA MODU
function toggleCinemaMode() {
    document.body.classList.toggle("cinema-mode");
    const btn = document.getElementById("cinema-btn");
    btn.innerText = document.body.classList.contains("cinema-mode") ? "Normal Moda Dön" : "Sinema Modu";
}

// ESC TUŞU İLE ÇIKIŞ
document.addEventListener('keydown', (e) => {
    if (e.key === "Escape" && document.body.classList.contains("cinema-mode")) toggleCinemaMode();
});

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
    container.className = count === 1 ? "" : "multi-layout"; // CSS'te kolaylık sağlar

    for (let i = 0; i < count; i++) {
        const box = document.createElement("div");
        box.className = `player-box ${i === activePlayer ? 'active' : ''}`;
        box.id = `box-${i}`;
        
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
    const activeName = playerInfos[index] ? playerInfos[index].innerText : "Yayın Merkezi";
    document.getElementById("current-channel").innerText = activeName;
}

// CANLI YAYIN BAŞLATMA
function playStream(url, name = "Bilinmeyen Kanal") {
    if (players.length === 0) setLayout(1);

    const player = players[activePlayer];
    const box = document.getElementById(`box-${activePlayer}`);
    const video = player.media;
    
    if (playerInfos[activePlayer]) playerInfos[activePlayer].innerText = name.toUpperCase();
    
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
        const hls = new Hls({ maxBufferLength: 30, enableWorker: true });
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

// KANAL VERİLERİ (GÜNCEL)
const channels = [
    { name: "Bein Sports 1", logo: "https://trgooltv61.top/img/beinsports1.png", url: "https://hlsssssss.ercansov.workers.dev/https://corestream.ronaldovurdu.help//hls/bein-sports-1.m3u8" },
    { name: "Bein Sports 1 (YEDEK)", logo: "https://trgooltv61.top/img/beinsports1.png", url: "https://curly-fire-b7a1.bestlivever.workers.dev/watch/chunk/yayinz.m3u8" },
    { name: "Bein Sports 2", logo: "https://trgooltv61.top/img/beinsports2.png", url: "https://noisy-cake-8ebc.travestigamzes.workers.dev/https://corestream.ronaldovurdu.help//hls/bein-sports-2.m3u8" },
    { name: "Bein Sports 3", logo: "https://trgooltv61.top/img/beinsports3.png", url: "https://hlsssssss.ercansov.workers.dev/https://corestream.ronaldovurdu.help//hls/bein-sports-3.m3u8" },
    { name: "Bein Sports 4", logo: "https://trgooltv61.top/img/beinsports4.png", url: "https://noisy-cake-8ebc.travestigamzes.workers.dev/https://corestream.ronaldovurdu.help//hls/bein-sports-4.m3u8" },
    { name: "Bein Sports 5", logo: "https://trgooltv61.top/img/beinsports5.png", url: "https://hlsssssss.ercansov.workers.dev/https://corestream.ronaldovurdu.help//hls/bein-sports-5.m3u8" },
    { name: "Bein Sports Max 1", logo: "https://trgooltv61.top/img/beinsportsmax1.png", url: "https://noisy-cake-8ebc.travestigamzes.workers.dev/https://corestream.ronaldovurdu.help//hls/bein-sports-max-1.m3u8" },
    { name: "Bein Sports Max 2", logo: "https://trgooltv61.top/img/beinsportsmax2.png", url: "https://noisy-cake-8ebc.travestigamzes.workers.dev/https://corestream.ronaldovurdu.help//hls/bein-sports-max-2.m3u8" },
    { name: "Tivibu Spor 1", logo: "https://itv224186.tmp.tivibu.com.tr:6430/images/poster/20250801839221.png", url: "https://dga1op10s1u3leo.ec876fd9240622.click/live/xtivibuspor-1/playlist.m3u8" },
    { name: "S Sport", logo: "https://www.trgoals125.top/lib/img/channels/s-sport.png", url: "https://andro.0638527.xyz/checklist/androstreamlivess1.m3u8" },
    { name: "S Sport 2", logo: "https://www.trgoals125.top/lib/img/channels/s-sport-2.png", url: "https://andro.0638527.xyz/checklist/androstreamlivess2.m3u8" },
    { name: "TRT Spor", logo: "https://www.trgoals124.top/lib/img/channels/trt-spor.png", url: "https://tv-trtspor1.medya.trt.com.tr/master.m3u8" },
    { name: "TRT 1", logo: "https://images.seeklogo.com/logo-png/26/2/trt-1-logo-png_seeklogo-260967.png", url: "https://tv-trt1.medya.trt.com.tr/master.m3u8" },
    { name: "A Spor", logo: "https://www.trgoals124.top/lib/img/channels/a-spor.png", url: "https://noisy-cake-8ebc.travestigamzes.workers.dev/https://corestream.ronaldovurdu.help//hls/a-spor.m3u8" }
];

function renderChannels(filter = "") {
    const list = document.getElementById("channels"); 
    list.innerHTML = "";
    channels.filter(c => c.name.toLowerCase().includes(filter.toLowerCase())).forEach(c => {
        const div = document.createElement("div"); 
        div.className = "channel"; 
        div.innerHTML = `
            <div class="channel-logo">
                ${c.logo ? `<img src="${c.logo}" alt="${c.name}" loading="lazy" onerror="this.src='https://via.placeholder.com/40/00ff00/000000?text=TV'">` : `<i class="fas fa-tv"></i>`}
            </div>
            <div class="channel-name">${c.name}</div>
        `;
        div.onclick = () => {
            playStream(c.url, c.name);
            document.querySelectorAll(".channel").forEach(el => el.classList.remove("selected-chan"));
            div.classList.add("selected-chan");
            if(window.innerWidth <= 768) toggleSidebar(); // Mobilde kanala basınca menüyü kapat
        };
        list.appendChild(div);
    });
}

// ÖRNEK: MAÇLAR LİSTESİ (Şu anlık statik, ileride API bağlayabilirsin)
function renderMatches() {
    const list = document.getElementById("tab-matches");
    list.innerHTML = `
        <div class="match-card">
            <div style="font-size:11px; color:#00ff00;">BUGÜN 20:45</div>
            <div style="font-weight:700; margin:5px 0;">Türkiye - İtalya</div>
            <div style="font-size:11px; color:#888;">Bein Sports 1</div>
        </div>
        <div class="match-card">
            <div style="font-size:11px; color:#00ff00;">BUGÜN 22:00</div>
            <div style="font-weight:700; margin:5px 0;">Real Madrid - Barcelona</div>
            <div style="font-size:11px; color:#888;">S Sport</div>
        </div>
    `;
}

document.getElementById("search").addEventListener("input", e => renderChannels(e.target.value));

// İlk kurulum
setLayout(1);
renderChannels();
