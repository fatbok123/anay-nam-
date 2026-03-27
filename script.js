// ===============================
// 📱 MOBİL PANEL SİSTEMİ
// ===============================

// PANEL AÇ / KAPAT
function togglePanel() {
    const panel = document.getElementById("bottomPanel");
    panel.classList.toggle("open");
}

// TAB DEĞİŞTİR
function switchTab(tabId) {
    document.querySelectorAll(".tab").forEach(btn => btn.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));

    // aktif buton
    event.target.classList.add("active");

    // aktif içerik
    document.getElementById(tabId).classList.add("active");
}

// ===============================
// 📺 MOBİL KANAL SENKRON
// ===============================

function syncMobileChannels() {
    const desktopList = document.getElementById("channels");
    const mobileList = document.getElementById("channels-mobile");

    if (!desktopList || !mobileList) return;

    mobileList.innerHTML = "";

    channels.forEach(c => {
        if (!c.name.toLowerCase().includes(currentFilter.toLowerCase())) return;

        const div = document.createElement("div");
        div.className = "channel";

        div.innerHTML = `
            <div class="channel-logo">
                ${c.logo ? `<img src="${c.logo}" loading="lazy">` : `⚽`}
            </div>
            <div class="channel-name">${c.name}</div>
        `;

        div.onclick = () => {
            playStream(c.url, c.name);

            document.querySelectorAll(".channel").forEach(el => el.classList.remove("selected-chan"));
            div.classList.add("selected-chan");

            // mobilde panel kapansın
            if (window.innerWidth <= 768) {
                togglePanel();
            }
        };

        mobileList.appendChild(div);
    });
}

// ===============================
// 🔍 SEARCH SENKRON
// ===============================

let currentFilter = "";

document.getElementById("search")?.addEventListener("input", e => {
    currentFilter = e.target.value;
    renderChannels(currentFilter);
    syncMobileChannels();
});

document.getElementById("search-mobile")?.addEventListener("input", e => {
    currentFilter = e.target.value;
    renderChannels(currentFilter);
    syncMobileChannels();
});

// ===============================
// 🔄 RENDER HOOK (EN ÖNEMLİ)
// ===============================

// eski render'ı sakla
const originalRenderChannels = renderChannels;

renderChannels = function(filter = "") {
    currentFilter = filter;

    // normal render
    originalRenderChannels(filter);

    // mobil render
    syncMobileChannels();
};

// ===============================
// ⚽ MAÇ SİSTEMİ (BASİT)
// ===============================

const matches = [
    {
        name: "Galatasaray vs Fenerbahçe",
        time: "20:00",
        channel: "Bein Sports 1",
        url: channels.find(c => c.name.includes("Bein Sports 1"))?.url
    },
    {
        name: "Real Madrid vs Barcelona",
        time: "22:00",
        channel: "S Sport",
        url: channels.find(c => c.name.includes("S Sport"))?.url
    }
];

function renderMatches() {
    const container = document.getElementById("matchesTab");
    if (!container) return;

    container.innerHTML = "";

    matches.forEach(m => {
        const div = document.createElement("div");
        div.className = "match";

        div.innerHTML = `
            ⚽ ${m.name}<br>
            <small>${m.time} - ${m.channel}</small>
        `;

        div.onclick = () => {
            if (m.url) {
                playStream(m.url, m.name);
                if (window.innerWidth <= 768) togglePanel();
            }
        };

        container.appendChild(div);
    });
}

// ===============================
// 🚀 INIT
// ===============================

setTimeout(() => {
    syncMobileChannels();
    renderMatches();
}, 500);
