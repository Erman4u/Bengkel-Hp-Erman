// ---- GOOGLE APPS SCRIPT API ----
// Data diambil dari: ambilSemuaData() di GAS
// Format kolom: [ID, Merk, Model, Harga, Kondisi, Stok, FotoURL]
const GAS_URL = 'https://script.google.com/macros/s/AKfycbxxVbEAhppA_R0ufppjIkLt_VXm9spI064RHRsZXI6Gl5U_whgK8r5ao_peIK3W67EK/exec';

// ---- FALLBACK DATA (jika API tidak tersedia) ----
const fallbackProducts = [
    { id: 1, name: 'Samsung Galaxy A12', brand: 'samsung', price: 'Rp 1.400.000', condition: 'Bekas', stock: 1, foto: '' },
    { id: 2, name: 'Oppo A3s', brand: 'oppo', price: 'Rp 850.000', condition: 'Bekas', stock: 1, foto: '' },
    { id: 3, name: 'Xiaomi Redmi 9A', brand: 'xiaomi', price: 'Rp 950.000', condition: 'Bekas', stock: 1, foto: '' },
    { id: 4, name: 'Vivo Y12', brand: 'vivo', price: 'Rp 1.100.000', condition: 'Bekas', stock: 1, foto: '' },
    { id: 5, name: 'iPhone SE 2020', brand: 'iphone', price: 'Rp 3.500.000', condition: 'Bekas', stock: 1, foto: '' },
];

// Global state
let allProducts = [];

// ---- BRAND MAPPING (normalisasi dari GAS) ----
const brandMap = {
    'samsung': 'samsung',
    'iphone': 'iphone',
    'oppo': 'oppo',
    'vivo': 'vivo',
    'xiaomi': 'xiaomi',
    'realme': 'realme',
    'infinix': 'infinix',
};

function normalizeBrand(merk) {
    if (!merk) return 'other';
    const lower = merk.trim().toLowerCase();
    return brandMap[lower] || lower;
}

const brandLabel = {
    samsung: 'Samsung', oppo: 'Oppo', xiaomi: 'Xiaomi',
    vivo: 'Vivo', iphone: 'iPhone', realme: 'Realme', infinix: 'Infinix'
};

function formatHarga(val) {
    if (!val && val !== 0) return '-';
    const num = parseInt(String(val).replace(/\D/g, ''), 10);
    if (isNaN(num)) return val;
    return 'Rp ' + num.toLocaleString('id-ID');
}

// Konversi URL Google Drive ke format yang bisa tampil tanpa login
function convertDriveUrl(url) {
    if (!url) return '';
    // Format thumbnail: https://drive.google.com/thumbnail?id=FILE_ID&sz=w400
    const thumbMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (thumbMatch) {
        return `https://lh3.googleusercontent.com/d/${thumbMatch[1]}=w400`;
    }
    // Format open: https://drive.google.com/file/d/FILE_ID/view
    const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileMatch) {
        return `https://lh3.googleusercontent.com/d/${fileMatch[1]}=w400`;
    }
    // URL lain (bukan Drive) langsung pakai
    return url;
}

function condBadge(condition) {
    const c = String(condition || '').toLowerCase();
    if (c === 'baru') return `<span class="badge-a">Baru</span>`;
    return `<span class="badge-b">Second</span>`;
}

function renderProductCard(p) {
    const imgHtml = p.foto
        ? `<img src="${p.foto}" alt="${p.name}" onerror="this.style.display='none'">`
        : `<img src="img/products_bg.png" alt="${p.name}" onerror="this.style.display='none'">`;

    const brandName = brandLabel[p.brand] || (p.brand ? p.brand.charAt(0).toUpperCase() + p.brand.slice(1) : 'HP');
    const stokBadge = (p.stock <= 0)
        ? `<span class="badge-b" style="background:rgba(255,50,50,0.15);color:#ff6b6b">Habis</span>`
        : `<span style="font-size:0.75rem;color:#4ade80"><i class="fas fa-check-circle"></i> Stok: ${p.stock}</span>`;

    return `
    <div class="product-card" data-brand="${p.brand}">
        <div class="product-img">
            ${imgHtml}
            <span class="product-brand-badge">${brandName}</span>
        </div>
        <div class="product-body">
            <h3>${p.name}</h3>
            <div class="product-meta">
                ${condBadge(p.condition)}
                ${stokBadge}
            </div>
            <div class="product-price"><span>Rp</span> ${p.price.replace('Rp ', '').replace('Rp', '').trim()}</div>
            <button class="btn-wa-sm" onclick="contactProduct('${p.name} - ${p.price}')" ${p.stock <= 0 ? 'disabled style="opacity:.5;cursor:not-allowed"' : ''}>
                <i class="fab fa-whatsapp"></i> Tanya Detail
            </button>
        </div>
    </div>`;
}

// ---- FETCH DATA DARI GOOGLE APPS SCRIPT ----
async function fetchProductsFromGAS() {
    const grid = document.getElementById('products-grid');
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px 0;color:var(--muted)">
        <i class="fas fa-spinner fa-spin" style="font-size:2rem;margin-bottom:12px;display:block"></i>
        Memuat data produk...
    </div>`;

    try {
        const res = await fetch(`${GAS_URL}?action=getData`, { mode: 'cors' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const ct = res.headers.get('content-type') || '';
        if (!ct.includes('json')) throw new Error('Response bukan JSON');

        const raw = await res.json();
        // GAS mengembalikan semua baris termasuk header row pertama
        // Skip baris header: [ID, Merk, Model, Harga, Kondisi, Stok, Foto URL]
        const rows = (Array.isArray(raw[0]) && typeof raw[0][3] === 'string') ? raw.slice(1) : raw;
        const mapped = rows.map((row, idx) => {
            if (Array.isArray(row)) {
                // Format: [ID, Merk, Model, Harga, Kondisi, Stok, FotoURL]
                return {
                    id: row[0] || idx,
                    brand: normalizeBrand(row[1]),
                    name: row[2] || 'Produk',
                    price: formatHarga(row[3]),
                    condition: row[4] || 'Second',
                    stock: parseInt(row[5]) || 0,
                    foto: convertDriveUrl(row[6] || ''),
                };
            }
            // Format object
            return {
                id: row.id || row.ID || idx,
                brand: normalizeBrand(row.merk || row.Merk || row.brand || ''),
                name: row.model || row.Model || row.nama || row.name || 'Produk',
                price: formatHarga(row.harga || row.Harga || row.price || 0),
                condition: row.kondisi || row.Kondisi || row.condition || 'Second',
                stock: parseInt(row.stok || row.Stok || row.stock || 0),
                foto: convertDriveUrl(row.foto || row.Foto || row.image || ''),
            };
        }); // Semua produk ditampilkan (stok 0 = badge "Habis")

        if (mapped.length === 0) throw new Error('Data kosong');
        allProducts = mapped;
        renderGrid(allProducts);
        updateFilterBtns(allProducts);

    } catch (err) {
        console.warn('[GAS] Gagal fetch:', err.message, '— menggunakan data lokal.');
        allProducts = fallbackProducts;
        renderGrid(allProducts);
        // tampilkan notif kecil
        const notice = document.createElement('p');
        notice.style.cssText = 'text-align:center;font-size:0.78rem;color:var(--muted);margin-top:8px;grid-column:1/-1';
        notice.textContent = '⚠️ Tidak dapat terhubung ke server. Menampilkan data contoh.';
        grid.appendChild(notice);
    }
}

function renderGrid(products) {
    const grid = document.getElementById('products-grid');
    if (!products.length) {
        grid.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:var(--muted);padding:40px 0">
            Tidak ada produk ditemukan untuk kategori ini.</p>`;
        return;
    }
    grid.innerHTML = products.map(renderProductCard).join('');
}

function updateFilterBtns(products) {
    // Tampilkan/sembunyikan filter btn berdasarkan brand yang ada
    const brands = new Set(products.map(p => p.brand));
    document.querySelectorAll('.filter-btn[data-brand]').forEach(btn => {
        btn.style.display = brands.has(btn.dataset.brand) ? '' : 'none';
    });
}

// Terhubung via fungsi global agar bisa dipanggil on-click dari HTML
window.filterProducts = function (brand, btn) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const filtered = brand === 'all' ? allProducts : allProducts.filter(p => p.brand === brand);
    renderGrid(filtered);
}

// ---- WHATSAPP ----
const WA_NUMBER = '6281340882207';
window.openWhatsApp = function (msg) {
    window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent('Halo Bengkel HP Erman, ' + msg + '.')}`, '_blank');
}
window.contactProduct = function (detail) {
    window.openWhatsApp(`Saya tertarik dengan HP second: ${detail}. Apakah masih tersedia?`);
}

document.addEventListener('DOMContentLoaded', () => {

    // ---- NAVBAR ----
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 20);
    });

    // ---- MOBILE MENU ----
    document.getElementById('mobile-menu-btn').addEventListener('click', () => {
        document.getElementById('mobile-menu').classList.toggle('open');
    });
    window.closeMobileMenu = function () {
        document.getElementById('mobile-menu').classList.remove('open');
    }

    // ---- SCROLL REVEAL ----
    const revealEls = document.querySelectorAll('.reveal, .reveal-l, .reveal-r');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); } });
    }, { threshold: 0.12 });
    revealEls.forEach(el => observer.observe(el));

    // ---- FETCH PRODUCTS DARI GAS ----
    fetchProductsFromGAS();

});
