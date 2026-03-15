// ---- PRODUCT DATA ----
const products = [
    { id: 1, name: 'Samsung Galaxy A12', brand: 'samsung', price: 'Rp 1.400.000', condition: 'A', warranty: '2 Minggu' },
    { id: 2, name: 'Oppo A3s', brand: 'oppo', price: 'Rp 850.000', condition: 'B', warranty: '1 Minggu' },
    { id: 3, name: 'Xiaomi Redmi 9A', brand: 'xiaomi', price: 'Rp 950.000', condition: 'A', warranty: '2 Minggu' },
    { id: 4, name: 'Vivo Y12', brand: 'vivo', price: 'Rp 1.100.000', condition: 'B', warranty: '1 Minggu' },
    { id: 5, name: 'iPhone SE 2020', brand: 'iphone', price: 'Rp 3.500.000', condition: 'A+', warranty: '3 Minggu' },
    { id: 6, name: 'Samsung Galaxy M21', brand: 'samsung', price: 'Rp 1.800.000', condition: 'A', warranty: '2 Minggu' },
    { id: 7, name: 'Xiaomi Poco X3', brand: 'xiaomi', price: 'Rp 2.500.000', condition: 'A', warranty: '3 Minggu' },
    { id: 8, name: 'Oppo Reno 4F', brand: 'oppo', price: 'Rp 2.100.000', condition: 'B+', warranty: '2 Minggu' },
];

const brandLabel = { samsung: 'Samsung', oppo: 'Oppo', xiaomi: 'Xiaomi', vivo: 'Vivo', iphone: 'iPhone' };

function condBadge(c) {
    if (c.startsWith('A')) return `<span class="badge-a">Kondisi ${c}</span>`;
    return `<span class="badge-b">Kondisi ${c}</span>`;
}

function renderProductCard(p) {
    return `
    <div class="product-card" data-brand="${p.brand}">
        <div class="product-img">
            <img src="products_bg.png" alt="${p.name}" onerror="this.style.display='none'">
            <span class="product-brand-badge">${brandLabel[p.brand] || p.brand}</span>
        </div>
        <div class="product-body">
            <h3>${p.name}</h3>
            <div class="product-meta">
                ${condBadge(p.condition)}
                <span class="badge-warranty"><i class="fas fa-shield-halved"></i> ${p.warranty}</span>
            </div>
            <div class="product-price"><span>Rp</span> ${p.price.replace('Rp ', '')} </div>
            <button class="btn-wa-sm" onclick="contactProduct('${p.name} - ${p.price}')">
                <i class="fab fa-whatsapp"></i> Tanya Detail
            </button>
        </div>
    </div>`;
}

// Terhubung via fungsi global agar bisa dpanggil on-click dari HTML
window.filterProducts = function (brand, btn) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const filtered = brand === 'all' ? products : products.filter(p => p.brand === brand);
    document.getElementById('products-grid').innerHTML = filtered.map(renderProductCard).join('');
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

    // ---- INIT PRODUCTS ----
    document.getElementById('products-grid').innerHTML = products.map(renderProductCard).join('');

});
