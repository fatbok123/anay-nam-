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

// --- SEKMELER ARASI GEÇİŞ ---
function switchTab(tabId) {
    document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active');
    
    if(tabId === 'channels-content') {
        document.getElementById('tab-channels-btn').classList.add('active');
    } else {
        document.getElementById('tab-matches-btn').classList.add('active');
        renderMatches(); 
    }
}

// MAÇ VERİLERİ VE TIKLAMA ÖZELLİĞİ (GÜNCELLENDİ)
const matches = [
    { time: "20:00", teams: "Manchester City - Liverpool", channel: "Tabii Spor" },
    { time: "22:00", teams: "trabonspor - Galatasaray", channel: "Bein Sports 1" },
    { time: "21:45", teams: "Gençlerbirliği - Göztepe", channel: "Bein Sports 2" },
    { time: "22:00", teams: "Kasımpaşa - Kayserispor", channel: "Bein Sports 3" },
    { time: "22:00", teams: "Sassuolo - Cagliari", channel: "S Sport 2" },
    { time: "22:00", teams: "Erzurumspor - Iğdır FK", channel: "TRT Spor" }
];

function renderMatches() {
    const list = document.getElementById("matches-list");
    if(!list) return;
    list.innerHTML = "";
    
    matches.forEach(m => {
        const div = document.createElement("div");
        div.className = "match-item";
        
        // TIKLAMA ÖZELLİĞİ: Listedeki maça basınca yayını açar
        div.onclick = () => {
            const targetChannel = channels.find(c => c.name === m.channel);
            if (targetChannel) {
                playStream(targetChannel.url, targetChannel.name);
                // Mobildeyse menüyü kapat
                if(window.innerWidth <= 768) toggleSidebar();
            } else {
                alert("Kanal bulunamadı! Kanal isminin channels listesiyle aynı olduğundan emin olun.");
            }
        };

        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="color:var(--accent); font-weight:800; margin-right:10px;">${m.time}</span>
                <span style="flex-grow:1; font-size:13px;">${m.teams}</span>
            </div>
            <div style="font-size:10px; color:rgba(255,255,255,0.4); margin-top:5px; text-align:right;">${m.channel}</div>
        `;
        list.appendChild(div);
    });
}

// SİDEBAR KONTROL
function toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    const toggleBtn = document.querySelector(".toggle-btn");
    sidebar.classList.toggle("collapsed");
    toggleBtn.innerText = sidebar.classList.contains("collapsed") ? "▶" : "◀";
}

// "IŞIKLARI KAPAT" ÖZELLİĞİ
function toggleCinemaMode() {
    const isCinema = document.body.classList.toggle("cinema-mode");
    const sidebar = document.getElementById("sidebar");
    const btn = document.getElementById("cinema-btn");
    
    if (isCinema) {
        if (!sidebar.classList.contains("collapsed")) {
            toggleSidebar();
        }
        btn.innerHTML = '<i class="fas fa-lightbulb"></i> Işıkları Aç';
        btn.style.background = "var(--accent)";
        btn.style.color = "#000";
    } else {
        btn.innerHTML = 'Sinema Modu';
        btn.style.background = "";
        btn.style.color = "";
    }
}

// ESC TUŞU İLE ÇIKIŞ
document.addEventListener('keydown', function(e) {
    if (e.key === "Escape" && document.body.classList.contains("cinema-mode")) {
        toggleCinemaMode();
    }
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
    if (isMobile) {
        container.style.gridTemplateColumns = "1fr";
        container.style.height = "auto"; 
        container.style.display = "flex";
        container.style.flexDirection = "column";
    } else {
        const gridStyles = { 1: { col: "1fr" }, 2: { col: "1fr", row: "1fr 1fr" }, 4: { col: "1fr 1fr" } };
        container.style.display = "grid";
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
        if (players[i]) {
            players[i].muted = (i !== index);
        }
    });
    const activeName = playerInfos[index] ? playerInfos[index].innerText : "Yayın Merkezi";
    const currentChannelEl = document.getElementById("current-channel");
    if(currentChannelEl) currentChannelEl.innerText = activeName;
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
        iframe.style.width = "100%";
        iframe.style.height = "100%";
        iframe.style.border = "none";
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
            player.play().catch(() => {
                player.muted = true;
                player.play();
            });
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
            if (data.fatal) {
                switch (data.type) {
                    case Hls.ErrorTypes.NETWORK_ERROR: hls.startLoad(); break;
                    case Hls.ErrorTypes.MEDIA_ERROR: hls.recoverMediaError(); break;
                    default: hls.destroy(); break;
                }
            }
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

// KANAL VERİLERİ
const channels = [
    { name: "Bein Sports 1", logo: "https://trgooltv61.top/img/beinsports1.png", url: "https://hlsssssss.ercansov.workers.dev/https://corestream.ronaldovurdu.help//hls/bein-sports-1.m3u8" },
    { name: "Bein Sports 1 (B)", logo: "https://trgooltv61.top/img/beinsports1.png", url: "https://curly-fire-b7a1.bestlivever.workers.dev/watch/chunk/yayinz.m3u8" },
    { name: "Bein Sports 2", logo: "https://trgooltv61.top/img/beinsports2.png", url: "https://noisy-cake-8ebc.travestigamzes.workers.dev/https://corestream.ronaldovurdu.help//hls/bein-sports-2.m3u8" },
    { name: "Bein Sports 2 (B)", logo: "https://trgooltv61.top/img/beinsports2.png", url: "https://macizletaraftarium.online/ch?id=b2" },
    { name: "Bein Sports 3", logo: "https://trgooltv61.top/img/beinsports3.png", url: "https://macizletaraftarium.online/ch?id=b3" },
    { name: "Bein Sports 4", logo: "https://trgooltv61.top/img/beinsports4.png", url: "https://macizletaraftarium.online/ch?id=b4" },
    { name: "Bein Sports 5", logo: "https://trgooltv61.top/img/beinsports5.png", url: "https://macizletaraftarium.online/ch?id=b5" },
    { name: "Bein Sports Max 1", logo: "https://trgooltv61.top/img/beinsportsmax1.png", url: "https://noisy-cake-8ebc.travestigamzes.workers.dev/https://corestream.ronaldovurdu.help//hls/bein-sports-max-1.m3u8" },
    { name: "Bein Sports Max 1 (YEDEK)", logo: "https://trgooltv61.top/img/beinsportsmax1.png", url: "https://macizletaraftarium.online/ch?id=bm1" },
    { name: "Bein Sports Max 2", logo: "https://trgooltv61.top/img/beinsportsmax2.png", url: "https://macizletaraftarium.online/ch?id=bm2" },
    { name: "Tivibu Spor 1", logo: "https://itv224186.tmp.tivibu.com.tr:6430/images/poster/20250801839221.png", url: "https://macizletaraftarium.online/ch?id=t1" },
    { name: "Tivibu Spor 2", logo: "https://itv224186.tmp.tivibu.com.tr:6430/images/poster/20250801839221.png", url: "https://macizletaraftarium.online/ch?id=t2" },
    { name: "Tivibu Spor 3", logo: "https://itv224186.tmp.tivibu.com.tr:6430/images/poster/20250801839221.png", url: "https://macizletaraftarium.online/ch?id=t3" },
    { name: "Tivibu Spor 4", logo: "https://itv224186.tmp.tivibu.com.tr:6430/images/poster/20250801839221.png", url: "https://macizletaraftarium.online/ch?id=t4" },
    { name: "S Sport", logo: "https://trgooltv61.top/img/ssport1.png", url: "https://macizletaraftarium.online/ch?id=ss" },
    { name: "S Sport 2", logo: "https://trgooltv61.top/img/ssport2.png", url: "https://macizletaraftarium.online/ch?id=ss2" },
    { name: "S Sport 2 (YEDEK)", logo: "https://trgooltv61.top/img/ssport2.png", url: "https://dga1op10s1u3leo.ec876fd9240622.click/live/xssport2/playlist.m3u8" },
    { name: "Tabii Spor", logo: "https://images.seeklogo.com/logo-png/48/1/tabii-logo-png_seeklogo-481975.png", url: "https://kl9mr2vxw7nq5py1sh4tj3gb6.medya.trt.com.tr/master_1080p.m3u8" },
    { name: "Tabii Spor 1", logo: "https://images.seeklogo.com/logo-png/48/1/tabii-logo-png_seeklogo-481975.png", url: "https://pz4qt7nw1mr9sh2vl5xk8jg3y.medya.trt.com.tr/master.m3u8" },
    { name: "Tabii Spor 2 ", logo: "https://images.seeklogo.com/logo-png/48/1/tabii-logo-png_seeklogo-481975.png", url: "https://mr8bv4kl1nq7sh9tw2xp5zj6g.medya.trt.com.tr/master_1440p.m3u8" },
    { name: "Tabii Spor 3", logo: "https://images.seeklogo.com/logo-png/48/1/tabii-logo-png_seeklogo-481975.png", url: "https://mR4vL7nQ2sH9tW5xP1zK3gJ8b.medya.trt.com.tr/master.m3u8" },
    { name: "Tabii Spor 4", logo: "https://images.seeklogo.com/logo-png/48/1/tabii-logo-png_seeklogo-481975.png", url: "https://macizletaraftarium.online/ch?id=ex4" },
    { name: "TRT Spor", logo: "https://trgooltv61.top/img/trtspornew.png", url: "https://macizletaraftarium.online/ch?id=trtspor" },
    { name: "Smartspor", logo: "https://upload.wikimedia.org/wikipedia/commons/b/b5/Smart-spor_635084424044881793.png", url: "https://macizletaraftarium.online/ch?id=smarts" },
    { name: "Smartspor 2", logo: "https://upload.wikimedia.org/wikipedia/commons/b/b5/Smart-spor_635084424044881793.png", url: "https://macizletaraftarium.online/ch?id=sms2" },
    { name: "Eurosport 1", logo: "https://w7.pngwing.com/pngs/113/118/png-transparent-eurosport-2-logo-television-eurosport-1-sport1-television-blue-text.png", url: "https://macizletaraftarium.online/ch?id=eu1" },
    { name: "Eurosport 2", logo: "https://w7.pngwing.com/pngs/113/118/png-transparent-eurosport-2-logo-television-eurosport-1-sport1-television-blue-text.png", url: "https://macizletaraftarium.online/ch?id=eu2" },
    { name: "TRT Spor Yıldız", logo: "https://spormeydani.org/wp-content/uploads/2021/05/TRT_Spor_Star_Landscape_on_Light_6000x3000.png", url: "https://tv-trtspor2.medya.trt.com.tr/master.m3u8" },
    { name: "Trt 1", logo: "https://images.seeklogo.com/logo-png/26/2/trt-1-logo-png_seeklogo-260967.png", url: "https://macizletaraftarium.online/ch?id=trt1" },
    { name: "Atv", logo: "https://iatv.tmgrup.com.tr/site/v2/i/atv-logo.png", url: "https://macizletaraftarium.online/ch?id=atv" },
    { name: "A Spor (1080p)", logo: "https://trgooltv61.top/img/aspornew.png", url: "https://macizletaraftarium.online/ch?id=as" }
];

function renderChannels(filter = "") {
    const list = document.getElementById("channels"); 
    list.innerHTML = "";
    channels.filter(c => c.name.toLowerCase().includes(filter.toLowerCase())).forEach(c => {
        const div = document.createElement("div"); 
        div.className = "channel"; 
        div.innerHTML = `<div class="channel-logo">${c.logo ? `<img src="${c.logo}" loading="lazy">` : `⚽`}</div><div class="channel-name">${c.name}</div>`;
        div.onclick = () => {
            playStream(c.url, c.name);
            document.querySelectorAll(".channel").forEach(el => el.classList.remove("selected-chan"));
            div.classList.add("selected-chan");
            if(window.innerWidth <= 768) toggleSidebar();
        };
        list.appendChild(div);
    });
}

const searchInput = document.getElementById("search");
if(searchInput) {
    searchInput.addEventListener("input", e => renderChannels(e.target.value));
}

// İlk kurulum
setLayout(1);
renderChannels();
