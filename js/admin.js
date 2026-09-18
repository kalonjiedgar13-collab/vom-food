// ========================================================
// VOM FOOD - MOTEUR DU DASHBOARD ADMINISTRATEUR (GÉRANTE)
// ========================================================

const STORAGE_KEYS = {
  RESTAURANT: 'vom_restaurant_settings_v1',
  DISHES: 'vom_admin_dishes_v1',
  CATEGORIES: 'vom_categories_v1',
  ORDERS: 'vom_orders_db_v1',
  CHAT: 'vom_chat_threads_v1',
  REVIEWS: 'vom_reviews_db_v1',
  PROMOTIONS: 'vom_promotions_v1',
  DELIVERY: 'vom_delivery_settings_v1',
  PAYMENT: 'vom_payment_settings_v1',
  APPEARANCE: 'vom_appearance_settings_v1',
  SECURITY: 'vom_security_settings_v1',
  CONFIG: 'vom_general_config_v1',
  CUSTOM_BUILDER: 'vom_admin_custom_v1',
  STATUS: 'vom_restaurant_status_v1'
};

class VomAdminApp {
  constructor() {
    this.migrateDemoData();

    this.activeTab = 'dashboard';
    this.activeSettingsTab = 'restaurant';
    this.activeChatClient = null;
    this.orderFilter = 'all';
    this.selectedDishForEdit = null;
    this.uploadedDishImageSrc = null;

    this.initData();
    this.setupEventListeners();
    this.renderAll();
    this.setupStorageSync();
  }

  // ==========================================
  // INITIALISATION DES DONNÉES PAR DÉFAUT
  // ==========================================
  initData() {
    // 1. Restaurant
    this.restaurant = this.load(STORAGE_KEYS.RESTAURANT, {
      name: "VOM FOOD",
      slogan: "Manger n'est pas un luxe, c'est un droit",
      founder: "Cheffe Vom",
      address: "Croisement Av. de la Paix & Bd du 30 Juin, Kinshasa / Antenne Mbanza-Ngungu, RDC",
      phone: "+243 895 968 355",
      email: "contact@vomfood.cd",
      openingHours: "11h00 - 23h00 (7j/7)",
      orderDays: "Lundi au Jeudi",
      deliveryDays: "Vendredi et Samedi",
      logo: "./public/assets/vom_logo_transparent.png",
      cover: "./public/assets/hero4.jpg",
      isOpen: true
    });

    // 2. Plats
    this.dishes = this.load(STORAGE_KEYS.DISHES, [
      {
        id: "vom-10",
        name: "Combo Cuisse Royale",
        category: "poulet",
        price: 6500,
        prepTime: "15-20 min",
        ingredients: "Cuisse de poulet marinée, bananes plantains, frites maison, épices secrètes kinois",
        desc: "La formule gourmande royale : cuisse de poulet dorée au feu de braise, bananes plantains frites et frites croustillantes.",
        badge: "⭐ Best-seller",
        available: true,
        image: "./public/assets/thumb_hero4.jpg"
      },
      {
        id: "vom-06",
        name: "Cuisse + bananes plantains",
        category: "poulet",
        price: 6500,
        prepTime: "15 min",
        ingredients: "Cuisse de poulet braisée, bananes plantains frites dorées, sauce maison",
        desc: "Cuisse de poulet dorée au feu de braise accompagnée de généreuses bananes plantains sucrées.",
        badge: "🔥 Épicé",
        available: true,
        image: "./public/assets/thumb_hero2.jpg"
      },
      {
        id: "vom-02",
        name: "Poisson braisé + shikwague",
        category: "poisson",
        price: 6500,
        prepTime: "20-25 min",
        ingredients: "Poisson frais entier, marinade aux herbes, shikwague traditionnel, piment rouge",
        desc: "Poisson braisé aux épices maison, chair tendre et parfumée avec shikwague traditionnel.",
        badge: "Populaire",
        available: true,
        image: "./public/assets/thumb_hero3.jpg"
      },
      {
        id: "vom-01",
        name: "Plat des bananes plantains",
        category: "bananes",
        price: 6500,
        prepTime: "10 min",
        ingredients: "Bananes plantains mûres sélectionnées, huile végétale, sel fin",
        desc: "Grande assiette de bananes plantains frites bien dorées, croustillantes à l'extérieur et fondantes.",
        badge: "Classique",
        available: true,
        image: "./public/assets/thumb_hero1.jpg"
      }
    ]);

    // 3. Catégories
    this.categories = this.load(STORAGE_KEYS.CATEGORIES, [
      { id: "all", name: "Toutes les catégories", icon: "🍽️", order: 1 },
      { id: "poulet", name: "Cuisses & Grillades de Poulet", icon: "🍗", order: 2 },
      { id: "poisson", name: "Poissons Braisés", icon: "🐟", order: 3 },
      { id: "bananes", name: "Formules & Bananes Plantains", icon: "🍌", order: 4 },
      { id: "accompagnements", name: "Accompagnements & Frites", icon: "🍟", order: 5 },
      { id: "sauces", name: "Sauces & Piments Maison", icon: "🥫", order: 6 },
      { id: "boissons", name: "Boissons Fraîches & Jus", icon: "🥤", order: 7 }
    ]);

    // 4. Commandes
    this.orders = this.load(STORAGE_KEYS.ORDERS, []);

    // 5. Chat Multi-Clients
    this.chatThreads = this.load(STORAGE_KEYS.CHAT, {});

    // 6. Avis Clients
    this.reviews = this.load(STORAGE_KEYS.REVIEWS, []);

    // 7. Promotions
    this.promotions = this.load(STORAGE_KEYS.PROMOTIONS, []);

    // 8. Custom Dish Builder Options (8.000 Fc)
    this.customConfig = this.load(STORAGE_KEYS.CUSTOM_BUILDER, {
      basePrice: 8000,
      isAvailable: true,
      meats: [
        'Cuisse de poulet dorée 🍗',
        'Poisson braisé frais 🐟',
        'Saucisses grillées 🌭',
        'Duo Royal Cuisse & Poisson 👑'
      ],
      sides: [
        'Bananes plantains frites 🍌',
        'Frites croustillantes 🍟',
        'Shikwague traditionnel 🥖',
        'Duo Bananes & Frites 🍌🍟'
      ]
    });

    // 9. Livraison
    this.delivery = this.load(STORAGE_KEYS.DELIVERY, {
      isEnabled: true,
      fee: 0,
      zones: [],
      defaultStatus: "En cours de préparation"
    });

    // 10. Paiement
    this.payment = this.load(STORAGE_KEYS.PAYMENT, {
      method: "Paiement par transfert (Mobile Money / Transfert bancaire)",
      allowedMobileMoney: ["Airtel Money", "Orange Money", "M-Pesa"],
      currency: "Fc",
      totalCollected: 0,
      mobileMoneyNumbers: { airtel: "", orange: "", mpesa: "" }
    });

    // 11. Apparence
    this.appearance = this.load(STORAGE_KEYS.APPEARANCE, {
      primaryColor: "#8b4513",
      secondaryColor: "#d4a574",
      theme: "light",
      bannerText: "Bienvenue chez VOM FOOD • Grillades authentiques de Kinshasa"
    });

    // 12. Sécurité
    this.security = this.load(STORAGE_KEYS.SECURITY, {
      pin: "1234",
      adminId: "cheffe",
      twoFactorEnabled: true,
      sessions: [],
      loginLogs: []
    });

    // 13. Configuration Générale
    this.config = this.load(STORAGE_KEYS.CONFIG, {
      language: "fr",
      currency: "Fc",
      timezone: "Africa/Kinshasa (GMT+1)",
      dateFormat: "DD/MM/YYYY",
      terms: "Les commandes sont reçues du Lundi au Jeudi. Les livraisons sont effectuées le Vendredi et le Samedi. Livraison 100% gratuite à Kinshasa et Mbanza-Ngungu. Paiement par transfert (Mobile Money ou transfert bancaire).",
      privacy: "VOM FOOD s'engage à protéger vos informations personnelles. Vos adresses et numéros de téléphone sont exclusivement utilisés pour la livraison et le suivi de vos commandes."
    });
  }

  // Purge les anciennes données de démonstration (migration v1 → v2)
  migrateDemoData() {
    try {
      if (localStorage.getItem('vom_schema_version') === '2') return;
      Object.keys(STORAGE_KEYS).forEach(k => {
        try { localStorage.removeItem(STORAGE_KEYS[k]); } catch (e) {}
      });
      localStorage.setItem('vom_schema_version', '2');
    } catch (e) {}
  }

  load(key, fallback) {
    const raw = localStorage.getItem(key);
    if (!raw) {
      // Valeur par défaut écrite LOCALEMENT SEULEMENT (sans l'envoyer au serveur),
      // pour ne jamais écraser les vraies données partagées (commandes, avis, chat…).
      try {
        if (window.VomSync && window.VomSync.rawSetItem) {
          window.VomSync.rawSetItem.call(localStorage, key, JSON.stringify(fallback));
        } else {
          localStorage.setItem(key, JSON.stringify(fallback));
        }
      } catch (e) {}
      return fallback;
    }
    try {
      return JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  }

  save(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
  }

  setupStorageSync() {
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEYS.CHAT) {
        this.chatThreads = this.load(STORAGE_KEYS.CHAT, this.chatThreads);
        this.renderChatThreadsList();
        this.renderActiveConversation();
      } else if (e.key === STORAGE_KEYS.ORDERS) {
        this.orders = this.load(STORAGE_KEYS.ORDERS, this.orders);
        this.renderOrders();
        this.updateDashboardKPIs();
      } else if (e.key === STORAGE_KEYS.REVIEWS) {
        this.reviews = this.load(STORAGE_KEYS.REVIEWS, this.reviews);
        this.renderReviews();
        this.updateDashboardKPIs();
      } else if (e.key === STORAGE_KEYS.DISHES) {
        this.dishes = this.load(STORAGE_KEYS.DISHES, this.dishes);
        this.renderMenuDishes();
        this.updateDashboardKPIs();
      } else if (e.key === STORAGE_KEYS.CUSTOM_BUILDER) {
        this.customConfig = this.load(STORAGE_KEYS.CUSTOM_BUILDER, this.customConfig);
        this.renderCustomIngredientsLists();
      } else if (e.key === STORAGE_KEYS.PROMOTIONS) {
        this.promotions = this.load(STORAGE_KEYS.PROMOTIONS, this.promotions);
        this.renderPromotions();
      } else if (e.key === STORAGE_KEYS.CATEGORIES) {
        this.categories = this.load(STORAGE_KEYS.CATEGORIES, this.categories);
        this.renderCategories();
      }
    });
  }

  // ==========================================
  // NAVIGATION GLOBALE DES ONGLETS
  // ==========================================
  switchTab(tabId) {
    this.activeTab = tabId;
    document.querySelectorAll('.adm-view-panel').forEach(p => p.classList.remove('active'));
    const panel = document.getElementById(`view-${tabId}`);
    if (panel) panel.classList.add('active');

    document.querySelectorAll('.admin-nav-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });

    const titleMap = {
      dashboard: "🏠 Tableau de Bord & Vue d'Ensemble",
      chat: "💬 Espace Discussions Clients",
      orders: "📦 Gestion des Commandes & Livraisons",
      menu: "🍔 Gestion des Plats & Carte",
      categories: "📂 Gestion des Catégories",
      stats: "📊 Statistiques & Performances",
      promotions: "🎟️ Promotions & Codes Réduction",
      avis: "⭐ Avis Clients & Modération",
      help: "❓ Aide & Guide de la Gérante",
      settings: "⚙️ Paramètres de la Boutique"
    };

    const titleEl = document.getElementById('topbarPageTitle');
    if (titleEl) titleEl.innerText = titleMap[tabId] || "Administration";

    // Si on ouvre le chat, scroll down
    if (tabId === 'chat') {
      setTimeout(() => this.scrollChatToBottom(), 50);
    }

    // Fermer sidebar mobile si ouverte
    document.getElementById('adminSidebar')?.classList.remove('open');
  }

  switchSettingsSubTab(subTabId) {
    this.activeSettingsTab = subTabId;
    document.querySelectorAll('.settings-panel').forEach(p => p.classList.remove('active'));
    const target = document.getElementById(`settings-panel-${subTabId}`);
    if (target) target.classList.add('active');

    document.querySelectorAll('.settings-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.subtab === subTabId);
    });
  }

  toggleSidebarMobile() {
    document.getElementById('adminSidebar')?.classList.toggle('open');
  }

  // ==========================================
  // RENDU COMPLET
  // ==========================================
  renderAll() {
    this.renderRestaurantStatus();
    this.renderDashboard();
    this.renderChatModule();
    this.renderOrders();
    this.renderMenuDishes();
    this.renderCategories();
    this.renderStats();
    this.renderPromotions();
    this.renderReviews();
    this.renderSettingsForms();
  }

  // ==========================================
  // DASHBOARD & STATUT
  // ==========================================
  renderRestaurantStatus() {
    const sw = document.getElementById('restaurantStatusSwitch');
    const label = document.getElementById('restaurantStatusText');
    const topLabel = document.getElementById('topbarRestaurantStatus');

    if (sw) sw.checked = this.restaurant.isOpen;
    const text = this.restaurant.isOpen ? "🟢 Ouvert aux commandes" : "🔴 Fermé temporairement (Pause)";
    const color = this.restaurant.isOpen ? "#166534" : "#dc2626";

    if (label) {
      label.innerText = text;
      label.style.color = color;
    }
    if (topLabel) {
      topLabel.innerText = this.restaurant.isOpen ? "🟢 Ouvert" : "🔴 Fermé";
      topLabel.style.color = color;
    }
  }

  toggleRestaurantStatus(isOpen) {
    this.restaurant.isOpen = isOpen;
    this.save(STORAGE_KEYS.RESTAURANT, this.restaurant);
    this.save(STORAGE_KEYS.STATUS, { isOpen });
    this.renderRestaurantStatus();
    this.showToast(isOpen ? "Le restaurant est maintenant OUVERT aux commandes ! 🟢" : "Le restaurant est en pause (FERMÉ) 🔴");
  }

  renderDashboard() {
    this.updateDashboardKPIs();
    this.renderRecentOrdersTable();
  }

  updateDashboardKPIs() {
    const totalRev = this.orders.reduce((sum, o) => o.paymentStatus === 'paid' ? sum + o.total : sum, 0);
    const totalOrdersCount = this.orders.length;
    const unreadMsgs = Object.values(this.chatThreads).reduce((sum, t) => sum + (t.unread || 0), 0);

    const kpiRev = document.getElementById('kpiTotalRevenue');
    const kpiOrders = document.getElementById('kpiOrdersCount');
    const kpiDishes = document.getElementById('kpiDishesCount');
    const kpiUnread = document.getElementById('kpiUnreadChat');
    const kpiDelivery = document.getElementById('kpiDeliveryStatus');

    if (kpiRev) kpiRev.innerText = `${totalRev.toLocaleString('fr-FR')} Fc`;
    if (kpiOrders) kpiOrders.innerText = `${totalOrdersCount}`;
    if (kpiDishes) kpiDishes.innerText = `${this.dishes.length}`;
    if (kpiUnread) kpiUnread.innerText = `${unreadMsgs}`;
    if (kpiDelivery) kpiDelivery.innerText = "Gratuite (0 Fc)";

    // Note moyenne des avis clients
    const avgRating = this.reviews.length
      ? this.reviews.reduce((sum, r) => sum + (r.stars || 0), 0) / this.reviews.length
      : 0;
    const kpiAvg = document.getElementById('kpiAvgRating');
    if (kpiAvg) kpiAvg.innerText = this.reviews.length ? `${avgRating.toFixed(1).replace('.', ',')} ★` : '—';
    const kpiReviewsNb = document.getElementById('kpiReviewsCount');
    if (kpiReviewsNb) kpiReviewsNb.innerText = this.reviews.length ? `${this.reviews.length} avis reçus` : 'Aucun avis pour le moment';

    // Badges Sidebar
    const navOrderBadge = document.getElementById('navOrdersBadge');
    if (navOrderBadge) {
      const activeCount = this.orders.filter(o => ['new', 'confirmed', 'prep', 'ready', 'delivering'].includes(o.status)).length;
      navOrderBadge.innerText = activeCount;
    }

    const navChatBadge = document.getElementById('navChatBadge');
    if (navChatBadge) {
      navChatBadge.innerText = unreadMsgs;
      navChatBadge.style.display = unreadMsgs > 0 ? 'inline-block' : 'none';
    }
  }

  renderRecentOrdersTable() {
    const box = document.getElementById('dashRecentOrdersList');
    if (!box) return;

    const recent = this.orders.slice(0, 3);
    if (recent.length === 0) {
      box.innerHTML = `<div style="font-size:12px; color:var(--adm-text-muted); text-align:center; padding:16px 10px;">Aucune commande pour le moment</div>`;
      return;
    }
    box.innerHTML = recent.map(o => `
      <div style="display:flex; justify-content:space-between; align-items:center; background:#ffffff; border:1.5px solid var(--adm-accent-border); padding:10px 14px; border-radius:12px; font-size:12px;">
        <div style="display:flex; align-items:center; gap:10px;">
          <div style="font-weight:900; color:var(--adm-primary);">${o.id}</div>
          <div>
            <div style="font-weight:800;">${o.clientName}</div>
            <div style="font-size:10.5px; color:var(--adm-text-muted);">${o.items.map(i => `${i.qty}x ${i.name}`).join(', ')}</div>
          </div>
        </div>
        <div style="display:flex; align-items:center; gap:10px;">
          <span class="adm-pill ${this.getOrderStatusClass(o.status)}">${this.getOrderStatusLabel(o.status)}</span>
          <div style="font-weight:800; color:var(--adm-primary);">${o.total.toLocaleString('fr-FR')} Fc</div>
        </div>
      </div>
    `).join('');
  }

  // ==========================================
  // 1. ESPACE DISCUSSIONS AVEC CLIENTS (LIVE CHAT)
  // ==========================================
  renderChatModule() {
    this.renderChatThreadsList();
    this.renderActiveConversation();
  }

  renderChatThreadsList() {
    const list = document.getElementById('chatThreadsList');
    if (!list) return;

    const threads = Object.values(this.chatThreads);
    if (threads.length === 0) {
      list.innerHTML = `<div style="font-size:12px; color:var(--adm-text-muted); text-align:center; padding:18px 10px;">Aucune discussion pour le moment</div>`;
      return;
    }
    list.innerHTML = threads.map(t => {
      const lastMsg = t.messages.length ? t.messages[t.messages.length - 1] : { text: "Nouvelle discussion", time: "" };
      const isActive = t.id === this.activeChatClient;
      return `
        <div class="thread-user-item ${isActive ? 'active' : ''}" onclick="window.vomAdmin.selectChatClient('${t.id}')">
          <div class="thread-avatar">
            ${t.avatar.startsWith('http') || t.avatar.startsWith('data:') || t.avatar.startsWith('./') ? `<img src="${t.avatar}">` : `<span>${t.avatar}</span>`}
          </div>
          <div class="thread-meta">
            <div class="thread-name-row">
              <span class="thread-name">${t.name}</span>
              <span class="thread-time">${lastMsg.time}</span>
            </div>
            <div class="thread-preview" style="${t.unread > 0 ? 'font-weight:800; color:var(--adm-primary);' : ''}">
              ${lastMsg.sender === 'admin' ? '✓ ' : ''}${lastMsg.text}
            </div>
          </div>
          ${t.unread > 0 ? `<span class="nav-badge badge-danger" style="margin-left:4px;">${t.unread}</span>` : ''}
        </div>
      `;
    }).join('');
  }

  selectChatClient(clientId) {
    this.activeChatClient = clientId;
    if (this.chatThreads[clientId]) {
      this.chatThreads[clientId].unread = 0;
      this.save(STORAGE_KEYS.CHAT, this.chatThreads);
    }
    this.renderChatThreadsList();
    this.renderActiveConversation();
    this.updateDashboardKPIs();
    setTimeout(() => this.scrollChatToBottom(), 50);
  }

  renderActiveConversation() {
    const current = this.chatThreads[this.activeChatClient];
    if (!current) return;

    // Header info
    const nameEl = document.getElementById('chatActiveCustomerName');
    const phoneEl = document.getElementById('chatActiveCustomerPhone');
    const avatarEl = document.getElementById('chatActiveCustomerAvatar');

    if (nameEl) nameEl.innerText = current.name;
    if (phoneEl) phoneEl.innerText = `${current.phone} • 🟢 En ligne`;
    if (avatarEl) {
      avatarEl.innerHTML = current.avatar.startsWith('http') || current.avatar.startsWith('data:') || current.avatar.startsWith('./') ? 
        `<img src="${current.avatar}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">` : 
        `<span style="font-size:20px;">${current.avatar}</span>`;
    }

    // Messages
    const container = document.getElementById('chatMessagesScroll');
    if (!container) return;

    container.innerHTML = current.messages.map(m => `
      <div class="chat-bubble ${m.sender === 'admin' ? 'bubble-from-admin' : 'bubble-from-client'}">
        <div>${m.text}</div>
        <div class="bubble-time-stamp">${m.time} ${m.sender === 'admin' ? '✓✓' : ''}</div>
      </div>
    `).join('');
  }

  sendAdminChatMessage(textToSend = null) {
    const input = document.getElementById('adminChatInput');
    const msg = textToSend || (input ? input.value.trim() : '');
    if (!msg) return;

    const thread = this.chatThreads[this.activeChatClient];
    if (!thread) return;

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    thread.messages.push({
      sender: "admin",
      text: msg,
      time: timeStr
    });

    if (input && !textToSend) input.value = '';

    this.save(STORAGE_KEYS.CHAT, this.chatThreads);
    this.renderActiveConversation();
    this.renderChatThreadsList();
    this.scrollChatToBottom();

    this.showToast(`Message envoyé à ${thread.name} ! 💬`);
  }

  sendCannedMessage(msgText) {
    this.sendAdminChatMessage(msgText);
  }

  scrollChatToBottom() {
    const container = document.getElementById('chatMessagesScroll');
    if (container) container.scrollTop = container.scrollHeight;
  }

  // ==========================================
  // 2. GESTION DES COMMANDES
  // ==========================================
  filterOrders(status) {
    this.orderFilter = status;
    document.querySelectorAll('.order-filter-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === status);
    });
    this.renderOrders();
  }

  renderOrders() {
    const grid = document.getElementById('ordersAdminGrid');
    if (!grid) return;

    let list = [...this.orders];
    if (this.orderFilter !== 'all') {
      list = list.filter(o => o.status === this.orderFilter);
    }

    const searchQuery = document.getElementById('orderSearchInput')?.value.trim().toLowerCase() || '';
    if (searchQuery) {
      list = list.filter(o => o.id.toLowerCase().includes(searchQuery) || o.clientName.toLowerCase().includes(searchQuery) || o.clientPhone.includes(searchQuery));
    }

    if (list.length === 0) {
      grid.innerHTML = `
        <div style="grid-column:1/-1; text-align:center; padding:40px 10px; background:#fff; border-radius:16px; border:1.5px solid var(--adm-accent-border);">
          <div style="font-size:36px; margin-bottom:8px;">📦</div>
          <p style="font-weight:800; font-size:14px; color:var(--adm-primary);">Aucune commande trouvée</p>
          <p style="font-size:12px; color:var(--adm-text-muted);">Aucune commande dans cette catégorie pour l'instant.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = list.map(o => `
      <div class="order-card-admin">
        <div class="order-card-header">
          <div>
            <span class="order-card-num">${o.id}</span>
            <span style="font-size:11px; color:var(--adm-text-muted); margin-left:6px;">🕒 ${o.date}</span>
          </div>
          <span class="adm-pill ${this.getOrderStatusClass(o.status)}">
            ${this.getOrderStatusLabel(o.status)}
          </span>
        </div>

        <div style="font-size:12px; font-weight:700;">
          👤 ${o.clientName} • 📞 ${o.clientPhone}
        </div>
        <div style="font-size:11px; color:var(--adm-text-muted);">
          📍 ${o.address}
        </div>

        <div class="order-items-list">
          ${o.items.map(item => `
            <div>
              <div class="order-item-row">
                <span>${item.qty}x ${item.name}</span>
                <span>${(item.price * item.qty).toLocaleString('fr-FR')} Fc</span>
              </div>
              ${item.details ? `<div class="order-item-detail">• ${item.details}</div>` : ''}
              ${item.sauces && item.sauces.length ? `<div class="order-item-detail">• Sauces : ${item.sauces.join(', ')}</div>` : ''}
            </div>
          `).join('')}
          ${o.notes ? `<div style="font-size:11px; color:#b45309; font-weight:700; border-top:1px dashed #e2d2c1; padding-top:4px; margin-top:2px;">📝 Note client : ${o.notes}</div>` : ''}
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px dashed var(--adm-accent-border); padding-top:6px;">
          <div>
            <div style="font-size:10px; color:var(--adm-text-muted); text-transform:uppercase;">Total (Livraison Offerte)</div>
            <div style="font-size:15px; font-weight:900; color:var(--adm-primary);">${o.total.toLocaleString('fr-FR')} Fc</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:10px; color:var(--adm-text-muted);">Paiement :</div>
            <button class="adm-btn adm-btn-sm ${o.paymentStatus === 'paid' ? 'adm-btn-success' : 'adm-btn-secondary'}" onclick="window.vomAdmin.togglePaymentStatus('${o.id}')">
              ${o.paymentStatus === 'paid' ? '🟢 Payé (Encaissé)' : '🟡 En attente de paiement'}
            </button>
          </div>
        </div>

        <div class="order-actions-bar">
          <select class="adm-select" style="padding:6px 10px; font-size:11.5px; width:auto; flex:1;" onchange="window.vomAdmin.changeOrderStatus('${o.id}', this.value)">
            <option value="new" ${o.status === 'new' ? 'selected' : ''}>🟡 Nouvelle</option>
            <option value="confirmed" ${o.status === 'confirmed' ? 'selected' : ''}>🔵 Confirmée</option>
            <option value="prep" ${o.status === 'prep' ? 'selected' : ''}>🟠 En préparation</option>
            <option value="ready" ${o.status === 'ready' ? 'selected' : ''}>🟣 Prête pour livraison</option>
            <option value="delivering" ${o.status === 'delivering' ? 'selected' : ''}>🛵 En cours de livraison</option>
            <option value="delivered" ${o.status === 'delivered' ? 'selected' : ''}>🟢 Livrée avec succès</option>
            <option value="cancelled" ${o.status === 'cancelled' ? 'selected' : ''}>🔴 Annulée</option>
          </select>

          <button class="adm-btn adm-btn-secondary adm-btn-sm" onclick="window.vomAdmin.printOrderReceipt('${o.id}')" title="Imprimer Reçu / Bon Cuisine">
            🧾 Reçu
          </button>
        </div>
      </div>
    `).join('');
  }

  getOrderStatusClass(status) {
    switch (status) {
      case 'new': return 'pill-warning';
      case 'confirmed': return 'pill-info';
      case 'prep': return 'pill-warning';
      case 'ready': return 'pill-info';
      case 'delivering': return 'pill-info';
      case 'delivered': return 'pill-success';
      case 'cancelled': return 'pill-danger';
      default: return 'pill-neutral';
    }
  }

  getOrderStatusLabel(status) {
    switch (status) {
      case 'new': return '🟡 Nouvelle commande';
      case 'confirmed': return '🔵 Confirmée';
      case 'prep': return '🔥 En préparation';
      case 'ready': return '🍲 Prête';
      case 'delivering': return '🛵 En livraison';
      case 'delivered': return '✅ Livrée';
      case 'cancelled': return '❌ Annulée';
      default: return status;
    }
  }

  changeOrderStatus(orderId, newStatus) {
    const o = this.orders.find(x => x.id === orderId);
    if (o) {
      o.status = newStatus;
      if (newStatus === 'delivered') o.paymentStatus = 'paid';
      this.save(STORAGE_KEYS.ORDERS, this.orders);
      this.renderOrders();
      this.updateDashboardKPIs();
      this.showToast(`Statut de ${orderId} mis à jour : ${this.getOrderStatusLabel(newStatus)} ! 📦`);
    }
  }

  togglePaymentStatus(orderId) {
    const o = this.orders.find(x => x.id === orderId);
    if (o) {
      o.paymentStatus = o.paymentStatus === 'paid' ? 'pending' : 'paid';
      this.save(STORAGE_KEYS.ORDERS, this.orders);
      this.renderOrders();
      this.showToast(`Paiement de ${orderId} marqué comme ${o.paymentStatus === 'paid' ? 'PAYÉ 🟢' : 'EN ATTENTE 🟡'}`);
    }
  }

  printOrderReceipt(orderId) {
    const o = this.orders.find(x => x.id === orderId);
    if (!o) return;

    const modal = document.getElementById('receiptModalOverlay');
    const content = document.getElementById('receiptModalContent');

    if (modal && content) {
      content.innerHTML = `
        <div class="receipt-printable">
          <div style="text-align:center; margin-bottom:10px;">
            <div style="font-weight:900; font-size:16px;">👑 VOM FOOD RESTAURANT</div>
            <div style="font-size:11px;">« Manger n'est pas un luxe, c'est un droit »</div>
            <div style="font-size:10px; margin-top:2px;">Kinshasa & Mbanza-Ngungu • Tél : ${this.restaurant.phone}</div>
            <div style="border-bottom:1px dashed #000; margin:8px 0;"></div>
            <div style="font-weight:800; font-size:13px;">BON DE COMMANDE : ${o.id}</div>
            <div style="font-size:10.5px;">Date : ${o.date}</div>
          </div>

          <div style="margin-bottom:8px;">
            <strong>CLIENT :</strong> ${o.clientName}<br>
            <strong>TÉLÉPHONE :</strong> ${o.clientPhone}<br>
            <strong>ADRESSE :</strong> ${o.address}
          </div>

          <div style="border-bottom:1px dashed #000; margin:6px 0;"></div>

          <div style="display:flex; flex-direction:column; gap:4px; margin-bottom:8px;">
            ${o.items.map(i => `
              <div style="display:flex; justify-content:space-between;">
                <span>${i.qty}x ${i.name}</span>
                <span>${(i.price * i.qty).toLocaleString('fr-FR')} Fc</span>
              </div>
              ${i.details ? `<div style="font-size:10px; padding-left:6px;">• ${i.details}</div>` : ''}
              ${i.sauces && i.sauces.length ? `<div style="font-size:10px; padding-left:6px;">• Sauces : ${i.sauces.join(', ')}</div>` : ''}
            `).join('')}
          </div>

          <div style="border-bottom:1px dashed #000; margin:6px 0;"></div>

          <div style="display:flex; justify-content:space-between; font-weight:700;">
            <span>LIVRAISON :</span>
            <span>0 Fc (OFFERTE 🎉)</span>
          </div>
          <div style="display:flex; justify-content:space-between; font-weight:900; font-size:14px; margin-top:4px;">
            <span>TOTAL NET À PAYER :</span>
            <span>${o.total.toLocaleString('fr-FR')} Fc</span>
          </div>
          <div style="font-size:10.5px; margin-top:4px;">
            Mode de paiement : ${o.paymentMethod}<br>
            Statut : ${o.paymentStatus === 'paid' ? '🟢 ENCAISSÉ' : '🟡 À ENCAISSER À LA LIVRAISON'}
          </div>

          ${o.notes ? `<div style="margin-top:6px; font-size:10.5px; background:#f5f5f5; padding:4px;"><strong>NOTE CUISINE :</strong> ${o.notes}</div>` : ''}

          <div style="border-bottom:1px dashed #000; margin:8px 0;"></div>
          <div style="text-align:center; font-size:10.5px;">
            Merci pour votre commande ! 🍗✨<br>
            www.vomfood.cd
          </div>
        </div>
      `;
      modal.classList.add('active');
    }
  }

  closeReceiptModal() {
    document.getElementById('receiptModalOverlay')?.classList.remove('active');
  }

  // ==========================================
  // 3. GESTION DES PLATS & CARTE DU MENU
  // ==========================================
  renderMenuDishes() {
    const grid = document.getElementById('dishesAdminGrid');
    if (!grid) return;

    const catFilter = document.getElementById('dishCategoryFilter')?.value || 'all';
    const searchQuery = document.getElementById('dishSearchInput')?.value.trim().toLowerCase() || '';

    let list = [...this.dishes];
    if (catFilter !== 'all') {
      list = list.filter(d => d.category === catFilter);
    }
    if (searchQuery) {
      list = list.filter(d => d.name.toLowerCase().includes(searchQuery) || d.desc.toLowerCase().includes(searchQuery));
    }

    grid.innerHTML = list.map(d => `
      <div class="dish-card-admin">
        <div class="dish-admin-img-wrap">
          <img src="${d.image}" alt="${d.name}">
          ${d.badge ? `<div class="dish-badge-overlay">${d.badge}</div>` : ''}
        </div>
        <div class="dish-admin-body">
          <div style="display:flex; justify-content:space-between; align-items:flex-start;">
            <div class="dish-admin-title">${d.name}</div>
            <div class="dish-admin-price">${d.price.toLocaleString('fr-FR')} Fc</div>
          </div>
          <div style="font-size:11px; color:var(--adm-text-muted);">${d.desc}</div>
          <div style="font-size:10.5px; color:var(--adm-primary); font-weight:700;">
            ⏱️ Temps de prép : ${d.prepTime || '15 min'} • 📂 Catégorie : ${this.getCategoryName(d.category)}
          </div>
          ${d.ingredients ? `<div style="font-size:10px; color:#7a6a5a; font-style:italic;">🥗 Ingrédients : ${d.ingredients}</div>` : ''}
        </div>

        <div class="dish-admin-footer">
          <div style="display:flex; align-items:center; gap:8px;">
            <label class="adm-switch">
              <input type="checkbox" ${d.available ? 'checked' : ''} onchange="window.vomAdmin.toggleDishAvailability('${d.id}', this.checked)">
              <span class="adm-switch-slider"></span>
            </label>
            <span style="font-size:11px; font-weight:700; color:${d.available ? 'var(--adm-success)' : 'var(--adm-danger)'};">
              ${d.available ? 'Disponible' : 'Épuisé'}
            </span>
          </div>

          <div style="display:flex; gap:6px;">
            <button class="adm-btn adm-btn-secondary adm-btn-sm" onclick="window.vomAdmin.openEditDishModal('${d.id}')">
              ✏️ Modifier
            </button>
            <button class="adm-btn adm-btn-danger adm-btn-sm" onclick="window.vomAdmin.deleteDish('${d.id}')">
              🗑️
            </button>
          </div>
        </div>
      </div>
    `).join('');
  }

  getCategoryName(catId) {
    const c = this.categories.find(x => x.id === catId);
    return c ? c.name : catId;
  }

  toggleDishAvailability(dishId, isAvailable) {
    const d = this.dishes.find(x => x.id === dishId);
    if (d) {
      d.available = isAvailable;
      this.save(STORAGE_KEYS.DISHES, this.dishes);
      this.renderMenuDishes();
      this.showToast(`Plat "${d.name}" marqué comme ${isAvailable ? 'DISPONIBLE 🟢' : 'ÉPUISÉ 🔴'}`);
    }
  }

  openAddDishModal() {
    this.selectedDishForEdit = null;
    this.uploadedDishImageSrc = null;

    document.getElementById('dishModalTitle').innerText = "➕ Ajouter un Nouveau Plat au Menu";
    document.getElementById('editDishName').value = '';
    document.getElementById('editDishDesc').value = '';
    document.getElementById('editDishPrice').value = '6500';
    document.getElementById('editDishCategory').value = 'poulet';
    document.getElementById('editDishPrepTime').value = '15 min';
    document.getElementById('editDishIngredients').value = '';
    document.getElementById('editDishBadge').value = 'none';
    document.getElementById('editDishAvailable').checked = true;

    document.getElementById('modalDishPhotoPreviewTag').style.display = 'none';
    document.getElementById('modalDishPhotoPlaceholderIcon').style.display = 'block';

    document.getElementById('dishEditModalOverlay').classList.add('active');
  }

  openEditDishModal(dishId) {
    const d = this.dishes.find(x => x.id === dishId);
    if (!d) return;

    this.selectedDishForEdit = d;
    this.uploadedDishImageSrc = d.image;

    document.getElementById('dishModalTitle').innerText = `✏️ Modifier le plat : ${d.name}`;
    document.getElementById('editDishName').value = d.name;
    document.getElementById('editDishDesc').value = d.desc;
    document.getElementById('editDishPrice').value = d.price;
    document.getElementById('editDishCategory').value = d.category || 'poulet';
    document.getElementById('editDishPrepTime').value = d.prepTime || '15 min';
    document.getElementById('editDishIngredients').value = d.ingredients || '';
    document.getElementById('editDishBadge').value = d.badge || 'none';
    document.getElementById('editDishAvailable').checked = d.available !== false;

    const previewTag = document.getElementById('modalDishPhotoPreviewTag');
    const placeholder = document.getElementById('modalDishPhotoPlaceholderIcon');
    if (previewTag && placeholder) {
      previewTag.src = d.image;
      previewTag.style.display = 'block';
      placeholder.style.display = 'none';
    }

    document.getElementById('dishEditModalOverlay').classList.add('active');
  }

  closeDishModal() {
    document.getElementById('dishEditModalOverlay')?.classList.remove('active');
  }

  handleDishPhotoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      this.uploadedDishImageSrc = e.target.result;
      const tag = document.getElementById('modalDishPhotoPreviewTag');
      const icon = document.getElementById('modalDishPhotoPlaceholderIcon');
      if (tag && icon) {
        tag.src = e.target.result;
        tag.style.display = 'block';
        icon.style.display = 'none';
      }
    };
    reader.readAsDataURL(file);
  }

  saveDishForm() {
    const name = document.getElementById('editDishName')?.value.trim();
    const desc = document.getElementById('editDishDesc')?.value.trim() || 'Spécialité kinois préparée à la commande.';
    const price = parseInt(document.getElementById('editDishPrice')?.value) || 6500;
    const category = document.getElementById('editDishCategory')?.value || 'poulet';
    const prepTime = document.getElementById('editDishPrepTime')?.value.trim() || '15 min';
    const ingredients = document.getElementById('editDishIngredients')?.value.trim() || '';
    const badgeVal = document.getElementById('editDishBadge')?.value;
    const available = document.getElementById('editDishAvailable')?.checked ?? true;

    if (!name) {
      alert('Veuillez renseigner le nom du plat.');
      return;
    }

    if (this.selectedDishForEdit) {
      // Modification
      this.selectedDishForEdit.name = name;
      this.selectedDishForEdit.desc = desc;
      this.selectedDishForEdit.price = price;
      this.selectedDishForEdit.category = category;
      this.selectedDishForEdit.prepTime = prepTime;
      this.selectedDishForEdit.ingredients = ingredients;
      this.selectedDishForEdit.badge = badgeVal !== 'none' ? badgeVal : null;
      this.selectedDishForEdit.available = available;
      if (this.uploadedDishImageSrc) {
        this.selectedDishForEdit.image = this.uploadedDishImageSrc;
      }
      this.showToast(`Plat "${name}" modifié avec succès ! ✅`);
    } else {
      // Ajout nouveau plat
      const newDish = {
        id: `vom-${Date.now()}`,
        name: name,
        desc: desc,
        price: price,
        category: category,
        prepTime: prepTime,
        ingredients: ingredients,
        badge: badgeVal !== 'none' ? badgeVal : null,
        available: available,
        image: this.uploadedDishImageSrc || './public/assets/thumb_hero4.jpg'
      };
      this.dishes.push(newDish);
      this.showToast(`Nouveau plat "${name}" ajouté à la carte ! 🍗`);
    }

    this.save(STORAGE_KEYS.DISHES, this.dishes);
    this.closeDishModal();
    this.renderMenuDishes();
    this.updateDashboardKPIs();
  }

  deleteDish(dishId) {
    const d = this.dishes.find(x => x.id === dishId);
    if (!d) return;

    if (confirm(`Êtes-vous sûre de vouloir supprimer définitivement le plat "${d.name}" du menu ?`)) {
      this.dishes = this.dishes.filter(x => x.id !== dishId);
      this.save(STORAGE_KEYS.DISHES, this.dishes);
      this.renderMenuDishes();
      this.updateDashboardKPIs();
      this.showToast(`Plat "${d.name}" supprimé !`);
    }
  }

  // ==========================================
  // 4. GESTION DES CATÉGORIES
  // ==========================================
  renderCategories() {
    const container = document.getElementById('categoriesAdminList');
    if (!container) return;

    const realCats = this.categories.filter(c => c.id !== 'all');

    container.innerHTML = realCats.map((cat, idx) => {
      const count = this.dishes.filter(d => d.category === cat.id).length;
      return `
        <div style="display:flex; justify-content:space-between; align-items:center; background:#ffffff; border:1.5px solid var(--adm-accent-border); padding:12px 16px; border-radius:14px; box-shadow:var(--adm-shadow);">
          <div style="display:flex; align-items:center; gap:12px;">
            <span style="font-size:22px; width:36px; height:36px; display:flex; align-items:center; justify-content:center; background:var(--adm-accent-light); border-radius:10px;">${cat.icon}</span>
            <div>
              <div style="font-size:13.5px; font-weight:800; color:var(--adm-text);">${cat.name}</div>
              <div style="font-size:11px; color:var(--adm-text-muted);">${count} plat(s) rattaché(s)</div>
            </div>
          </div>

          <div style="display:flex; align-items:center; gap:6px;">
            <button class="adm-btn adm-btn-secondary adm-btn-sm" onclick="window.vomAdmin.moveCategory(${idx}, -1)" ${idx === 0 ? 'disabled style="opacity:0.4;"' : ''} title="Monter">⬆️</button>
            <button class="adm-btn adm-btn-secondary adm-btn-sm" onclick="window.vomAdmin.moveCategory(${idx}, 1)" ${idx === realCats.length - 1 ? 'disabled style="opacity:0.4;"' : ''} title="Descendre">⬇️</button>
            <button class="adm-btn adm-btn-danger adm-btn-sm" onclick="window.vomAdmin.deleteCategory('${cat.id}')" title="Supprimer">🗑️</button>
          </div>
        </div>
      `;
    }).join('');

    // Remplir aussi les selects de catégories dans les filtres et modals
    this.updateCategorySelectOptions();
  }

  updateCategorySelectOptions() {
    const filterSelect = document.getElementById('dishCategoryFilter');
    const modalSelect = document.getElementById('editDishCategory');

    const optionsHTML = this.categories.map(c => `
      <option value="${c.id}">${c.icon} ${c.name}</option>
    `).join('');

    if (filterSelect) filterSelect.innerHTML = optionsHTML;
    if (modalSelect) {
      modalSelect.innerHTML = this.categories.filter(c => c.id !== 'all').map(c => `
        <option value="${c.id}">${c.icon} ${c.name}</option>
      `).join('');
    }
  }

  addNewCategory() {
    const name = document.getElementById('newCategoryName')?.value.trim();
    const icon = document.getElementById('newCategoryIcon')?.value.trim() || '🍽️';

    if (!name) {
      alert('Veuillez entrer un nom de catégorie.');
      return;
    }

    const newId = `cat_${Date.now()}`;
    this.categories.push({
      id: newId,
      name: name,
      icon: icon,
      order: this.categories.length + 1
    });

    document.getElementById('newCategoryName').value = '';
    this.save(STORAGE_KEYS.CATEGORIES, this.categories);
    this.renderCategories();
    this.showToast(`Nouvelle catégorie "${name}" créée ! 📂`);
  }

  moveCategory(realIndex, direction) {
    const realCats = this.categories.filter(c => c.id !== 'all');
    const targetIndex = realIndex + direction;

    if (targetIndex < 0 || targetIndex >= realCats.length) return;

    const temp = realCats[realIndex];
    realCats[realIndex] = realCats[targetIndex];
    realCats[targetIndex] = temp;

    this.categories = [{ id: "all", name: "Toutes les catégories", icon: "🍽️", order: 1 }, ...realCats];
    this.save(STORAGE_KEYS.CATEGORIES, this.categories);
    this.renderCategories();
  }

  deleteCategory(catId) {
    const count = this.dishes.filter(d => d.category === catId).length;
    if (count > 0) {
      alert(`Impossible de supprimer cette catégorie car ${count} plat(s) y sont rattachés. Déplacez d'abord ces plats.`);
      return;
    }

    if (confirm('Voulez-vous supprimer cette catégorie ?')) {
      this.categories = this.categories.filter(c => c.id !== catId);
      this.save(STORAGE_KEYS.CATEGORIES, this.categories);
      this.renderCategories();
      this.showToast('Catégorie supprimée');
    }
  }

  // ==========================================
  // 5. STATISTIQUES & PERFORMANCES
  // ==========================================
  renderStats() {
    // Calculs
    const orders = this.orders || [];
    const totalOrders = orders.length;
    const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
    const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;
    const totalSales = orders.reduce((s, o) => s + (o.total || 0), 0);
    const avgBasket = totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0;

    document.getElementById('statTotalSales').innerText = `${totalSales.toLocaleString('fr-FR')} Fc`;
    document.getElementById('statSalesUSD').innerText = `≈ ${(totalSales / 2800).toFixed(2)} $ USD`;
    document.getElementById('statTotalOrders').innerText = `${totalOrders}`;
    const deliveredRate = totalOrders > 0 ? Math.round((deliveredOrders / totalOrders) * 100) : 0;
    document.getElementById('statDeliveredRate').innerText = `${deliveredRate}% (${deliveredOrders} livrées)`;
    document.getElementById('statCancelledCount').innerText = `${cancelledOrders} annulées`;
    document.getElementById('statAvgBasket').innerText = `${avgBasket.toLocaleString('fr-FR')} Fc`;

    // Graphique des Plats les plus vendus
    // Top plats calculés depuis les vraies commandes
    const orderItems = [];
    (this.orders || []).forEach(o => {
      (o.items || []).forEach(i => {
        const found = orderItems.find(x => x.name === i.name);
        if (found) { found.count += (i.qty || 1); found.rev += (i.price || 0); }
        else orderItems.push({ name: i.name, count: (i.qty || 1), rev: (i.price || 0) });
      });
    });
    const topDishes = orderItems
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(i => ({ name: i.name, count: i.count, rev: i.rev, percent: 0 }));

    if (topDishes.length > 0) {
      const maxCount = topDishes[0].count;
      topDishes.forEach(t => { t.percent = Math.round((t.count / maxCount) * 100); });
    }

    // Adresses de livraison les plus actives (calculées depuis les vraies commandes)
    const zonesContainer = document.getElementById('statsZonesRanking');
    if (zonesContainer) {
      const addrCounts = {};
      orders.forEach(o => {
        const a = (o.address || '').trim();
        if (a) addrCounts[a] = (addrCounts[a] || 0) + 1;
      });
      const zones = Object.entries(addrCounts).sort((a, b) => b[1] - a[1]);
      if (zones.length === 0) {
        zonesContainer.innerHTML = `<div style="font-size:12px; color:var(--adm-text-muted); text-align:center; padding:12px 0;">Aucune livraison pour le moment</div>`;
      } else {
        zonesContainer.innerHTML = `<div style="display:flex; flex-wrap:wrap; gap:8px; font-size:12px;">` +
          zones.map(([addr, count]) => `<span class="adm-pill pill-info">${addr} (${count} commandes)</span>`).join('') +
          `</div>`;
      }
    }

    const topContainer = document.getElementById('statsTopDishesRanking');
    if (topContainer) {
      if (topDishes.length === 0) {
        topContainer.innerHTML = `<div style="font-size:12px; color:var(--adm-text-muted); text-align:center; padding:16px 0;">Aucune vente pour le moment</div>`;
      } else {
      topContainer.innerHTML = topDishes.map((item, idx) => `
        <div style="display:flex; flex-direction:column; gap:4px; margin-bottom:10px;">
          <div style="display:flex; justify-content:space-between; font-size:12.5px; font-weight:800;">
            <span>#${idx + 1} ${item.name}</span>
            <span style="color:var(--adm-primary);">${item.count} ventes (${item.rev.toLocaleString('fr-FR')} Fc)</span>
          </div>
          <div style="height:8px; background:var(--adm-accent-light); border-radius:4px; overflow:hidden;">
            <div style="height:100%; width:${item.percent}%; background:var(--adm-primary); border-radius:4px;"></div>
          </div>
        </div>
      `).join('');
      }
    }
  }

  // ==========================================
  // 6. GESTION DES PROMOTIONS
  // ==========================================
  renderPromotions() {
    const list = document.getElementById('promotionsAdminList');
    if (!list) return;

    list.innerHTML = this.promotions.map(p => `
      <div style="background:#ffffff; border:1.5px solid var(--adm-accent-border); border-radius:14px; padding:14px; display:flex; justify-content:space-between; align-items:center; box-shadow:var(--adm-shadow);">
        <div style="display:flex; align-items:center; gap:12px;">
          <span style="font-size:24px; background:var(--adm-accent-light); width:42px; height:42px; border-radius:12px; display:flex; align-items:center; justify-content:center;">🎟️</span>
          <div>
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-size:13.5px; font-weight:900; color:var(--adm-primary); font-family:monospace; background:#fff7ed; padding:2px 8px; border-radius:6px; border:1px solid #fed7aa;">${p.code}</span>
              <span class="adm-pill ${p.isActive ? 'pill-success' : 'pill-danger'}">${p.isActive ? 'Actif' : 'Inactif'}</span>
            </div>
            <div style="font-size:12px; font-weight:700; color:var(--adm-text); margin-top:2px;">${p.title}</div>
            <div style="font-size:11px; color:var(--adm-text-muted);">
              Réduction : <strong>${p.type === 'percent' ? `${p.value}%` : `${p.value.toLocaleString('fr-FR')} Fc`}</strong> • Du ${p.startDate} au ${p.endDate} • Utilisé ${p.uses} fois
            </div>
          </div>
        </div>

        <div style="display:flex; align-items:center; gap:8px;">
          <label class="adm-switch">
            <input type="checkbox" ${p.isActive ? 'checked' : ''} onchange="window.vomAdmin.togglePromotionActive('${p.id}', this.checked)">
            <span class="adm-switch-slider"></span>
          </label>
          <button class="adm-btn adm-btn-danger adm-btn-sm" onclick="window.vomAdmin.deletePromotion('${p.id}')">🗑️</button>
        </div>
      </div>
    `).join('');
  }

  addNewPromotion() {
    const code = document.getElementById('newPromoCode')?.value.trim().toUpperCase();
    const title = document.getElementById('newPromoTitle')?.value.trim() || 'Réduction Exceptionnelle';
    const type = document.getElementById('newPromoType')?.value || 'percent';
    const value = parseInt(document.getElementById('newPromoValue')?.value) || 10;
    const startDate = document.getElementById('newPromoStartDate')?.value || '2026-08-01';
    const endDate = document.getElementById('newPromoEndDate')?.value || '2026-09-01';

    if (!code) {
      alert('Veuillez entrer un code promotionnel (ex: ROYAL20).');
      return;
    }

    this.promotions.unshift({
      id: `promo-${Date.now()}`,
      code: code,
      title: title,
      type: type,
      value: value,
      targetDish: "all",
      startDate: startDate,
      endDate: endDate,
      isActive: true,
      uses: 0
    });

    document.getElementById('newPromoCode').value = '';
    this.save(STORAGE_KEYS.PROMOTIONS, this.promotions);
    this.renderPromotions();
    this.showToast(`Promotion "${code}" créée et activée ! 🎟️`);
  }

  togglePromotionActive(promoId, isActive) {
    const p = this.promotions.find(x => x.id === promoId);
    if (p) {
      p.isActive = isActive;
      this.save(STORAGE_KEYS.PROMOTIONS, this.promotions);
      this.renderPromotions();
      this.showToast(`Code promo ${p.code} ${isActive ? 'ACTIVÉ 🟢' : 'DÉSACTIVÉ 🔴'}`);
    }
  }

  deletePromotion(promoId) {
    if (confirm('Voulez-vous supprimer cette promotion ?')) {
      this.promotions = this.promotions.filter(x => x.id !== promoId);
      this.save(STORAGE_KEYS.PROMOTIONS, this.promotions);
      this.renderPromotions();
      this.showToast('Promotion supprimée');
    }
  }

  // ==========================================
  // 7. AVIS CLIENTS & MODÉRATION
  // ==========================================
  renderReviews() {
    const list = document.getElementById('reviewsAdminList');
    if (!list) return;

    if (this.reviews.length === 0) {
      list.innerHTML = `<div style="font-size:12.5px; color:var(--adm-text-muted); text-align:center; padding:24px 10px;">Aucun avis pour le moment. Les avis des clients apparaîtront ici. 🌟</div>`;
      return;
    }

    list.innerHTML = this.reviews.map(r => `
      <div style="background:#ffffff; border:1.5px solid var(--adm-accent-border); border-radius:14px; padding:14px; display:flex; flex-direction:column; gap:8px; box-shadow:var(--adm-shadow); opacity:${r.isHidden ? '0.5' : '1'};">
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <div>
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-weight:900; font-size:13px;">👤 ${r.author}</span>
              <span style="color:#f59e0b; font-size:13px;">${'★'.repeat(r.stars)}</span>
              ${r.isHidden ? '<span class="adm-pill pill-danger">Masqué</span>' : ''}
            </div>
            <div style="font-size:11px; color:var(--adm-text-muted);">Plat noté : <strong>${r.dishName}</strong> • ${r.date}</div>
          </div>

          <div style="display:flex; gap:6px;">
            <button class="adm-btn adm-btn-secondary adm-btn-sm" onclick="window.vomAdmin.toggleHideReview('${r.id}')">
              ${r.isHidden ? '👁️ Afficher' : '🚫 Masquer'}
            </button>
          </div>
        </div>

        <div style="font-size:12.5px; line-height:1.4; color:var(--adm-text); background:var(--adm-accent-light); padding:8px 12px; border-radius:10px;">
          « ${r.comment} »
        </div>

        <!-- Réponse Cheffe Vom -->
        ${r.adminReply ? `
          <div style="margin-left:14px; background:#fdf8f0; border-left:3px solid var(--adm-primary); padding:8px 12px; border-radius:0 10px 10px 0; font-size:11.5px;">
            <div style="font-weight:800; color:var(--adm-primary); display:flex; align-items:center; gap:4px;">
              <span>👑 Réponse officielle de Cheffe Vom :</span>
            </div>
            <div style="color:var(--adm-text); margin-top:2px;">${r.adminReply}</div>
          </div>
        ` : `
          <div style="display:flex; gap:6px; margin-top:4px;">
            <input type="text" id="replyInput_${r.id}" class="adm-input" placeholder="Rédiger une réponse publique de Cheffe Vom..." style="font-size:11.5px; padding:6px 10px;">
            <button class="adm-btn adm-btn-primary adm-btn-sm" onclick="window.vomAdmin.submitReviewReply('${r.id}')">
              💬 Répondre
            </button>
          </div>
        `}
      </div>
    `).join('');
  }

  submitReviewReply(revId) {
    const input = document.getElementById(`replyInput_${revId}`);
    const text = input ? input.value.trim() : '';

    if (!text) {
      alert('Veuillez écrire une réponse.');
      return;
    }

    const r = this.reviews.find(x => x.id === revId);
    if (r) {
      r.adminReply = text;
      this.save(STORAGE_KEYS.REVIEWS, this.reviews);
      this.renderReviews();
      this.showToast(`Réponse de Cheffe Vom publiée pour ${r.author} ! ⭐`);
    }
  }

  toggleHideReview(revId) {
    const r = this.reviews.find(x => x.id === revId);
    if (r) {
      r.isHidden = !r.isHidden;
      this.save(STORAGE_KEYS.REVIEWS, this.reviews);
      this.renderReviews();
      this.showToast(`Avis ${r.isHidden ? 'MASQUÉ 🚫' : 'VISIBLE 👁️'}`);
    }
  }

  // ==========================================
  // 8. GESTION COMPLÈTE DES PARAMÈTRES (7 SECTIONS)
  // ==========================================
  renderSettingsForms() {
    // 1. Restaurant
    const setRestName = document.getElementById('setRestName');
    const setRestSlogan = document.getElementById('setRestSlogan');
    const setRestAddr = document.getElementById('setRestAddr');
    const setRestPhone = document.getElementById('setRestPhone');
    const setRestEmail = document.getElementById('setRestEmail');
    const setRestHours = document.getElementById('setRestHours');
    const setRestOrderDays = document.getElementById('setRestOrderDays');
    const setRestDeliveryDays = document.getElementById('setRestDeliveryDays');

    if (setRestName) setRestName.value = this.restaurant.name;
    if (setRestSlogan) setRestSlogan.value = this.restaurant.slogan;
    if (setRestAddr) setRestAddr.value = this.restaurant.address;
    if (setRestPhone) setRestPhone.value = this.restaurant.phone;
    if (setRestEmail) setRestEmail.value = this.restaurant.email;
    if (setRestHours) setRestHours.value = this.restaurant.openingHours;
    if (setRestOrderDays) setRestOrderDays.value = this.restaurant.orderDays;
    if (setRestDeliveryDays) setRestDeliveryDays.value = this.restaurant.deliveryDays;

    // 2. Plats & Custom Builder
    const setCustomPrice = document.getElementById('setCustomBasePrice');
    if (setCustomPrice) setCustomPrice.value = this.customConfig.basePrice;
    const setCustomAvailable = document.getElementById('setCustomAvailable');
    if (setCustomAvailable) setCustomAvailable.checked = this.customConfig.isAvailable !== false;
    this.renderCustomIngredientsLists();

    // 3. Livraison
    const setDeliveryToggle = document.getElementById('setDeliveryToggle');
    if (setDeliveryToggle) setDeliveryToggle.checked = this.delivery.isEnabled;
    this.renderDeliveryZonesList();

    // 4. Paiement
    const setPayCollected = document.getElementById('setTotalCollectedDisplay');
    if (setPayCollected) setPayCollected.innerText = `${this.payment.totalCollected.toLocaleString('fr-FR')} Fc (Total Encaissé)`;
    const payAirtel = document.getElementById('payAirtelNumber');
    const payOrange = document.getElementById('payOrangeNumber');
    const payMpesa = document.getElementById('payMpesaNumber');
    const mmn = this.payment.mobileMoneyNumbers || {};
    if (payAirtel) payAirtel.value = mmn.airtel || '';
    if (payOrange) payOrange.value = mmn.orange || '';
    if (payMpesa) payMpesa.value = mmn.mpesa || '';

    // 5. Apparence
    const setPrimaryColor = document.getElementById('setPrimaryColorPicker');
    const setSecondaryColor = document.getElementById('setSecondaryColorPicker');
    const setBannerText = document.getElementById('setBannerText');

    if (setPrimaryColor) setPrimaryColor.value = this.appearance.primaryColor;
    if (setSecondaryColor) setSecondaryColor.value = this.appearance.secondaryColor;
    if (setBannerText) setBannerText.value = this.appearance.bannerText;

    // 6. Sécurité
    const setAdminId = document.getElementById('secAdminId');
    if (setAdminId) setAdminId.value = this.security.adminId || 'cheffe';
    this.renderSessionsList();
    this.renderLoginHistory();

    // 7. Config générale
    const setLang = document.getElementById('setConfigLang');
    const setCurr = document.getElementById('setConfigCurrency');
    const setTerms = document.getElementById('setConfigTerms');
    const setPriv = document.getElementById('setConfigPrivacy');

    if (setLang) setLang.value = this.config.language;
    if (setCurr) setCurr.value = this.config.currency;
    if (setTerms) setTerms.value = this.config.terms;
    if (setPriv) setPriv.value = this.config.privacy;
  }

  savePaymentNumbers() {
    this.payment.mobileMoneyNumbers = this.payment.mobileMoneyNumbers || {};
    this.payment.mobileMoneyNumbers.airtel = document.getElementById('payAirtelNumber')?.value.trim() || '';
    this.payment.mobileMoneyNumbers.orange = document.getElementById('payOrangeNumber')?.value.trim() || '';
    this.payment.mobileMoneyNumbers.mpesa = document.getElementById('payMpesaNumber')?.value.trim() || '';
    this.save(STORAGE_KEYS.PAYMENT, this.payment);
    this.showToast('Numéros Mobile Money enregistrés ! ✅');
  }

  saveRestaurantInfo() {
    this.restaurant.name = document.getElementById('setRestName')?.value.trim() || 'VOM FOOD';
    this.restaurant.slogan = document.getElementById('setRestSlogan')?.value.trim() || "Manger n'est pas un luxe, c'est un droit";
    this.restaurant.address = document.getElementById('setRestAddr')?.value.trim() || 'Kinshasa & Mbanza-Ngungu, RDC';
    this.restaurant.phone = document.getElementById('setRestPhone')?.value.trim() || '+243 895 968 355';
    this.restaurant.email = document.getElementById('setRestEmail')?.value.trim() || 'contact@vomfood.cd';
    this.restaurant.openingHours = document.getElementById('setRestHours')?.value.trim() || '11h00 - 23h00 (7j/7)';
    this.restaurant.orderDays = document.getElementById('setRestOrderDays')?.value.trim() || 'Lundi au Jeudi';
    this.restaurant.deliveryDays = document.getElementById('setRestDeliveryDays')?.value.trim() || 'Vendredi et Samedi';

    this.save(STORAGE_KEYS.RESTAURANT, this.restaurant);
    // Sync schedule for backward compatibility
    this.save('vom_admin_schedule_v1', {
      orderDays: this.restaurant.orderDays,
      deliveryDays: this.restaurant.deliveryDays,
      whatsappPhone: this.restaurant.phone
    });

    this.showToast('Informations du restaurant enregistrées avec succès ! 🏪');
  }

  saveCustomDishSettings() {
    const p = parseInt(document.getElementById('setCustomBasePrice')?.value) || 8000;
    this.customConfig.basePrice = p;
    this.save(STORAGE_KEYS.CUSTOM_BUILDER, this.customConfig);
    this.showToast(`Prix de base du plat sur mesure fixé à ${p.toLocaleString('fr-FR')} Fc ! 🎨`);
  }

  toggleCustomAvailability(checked) {
    this.customConfig.isAvailable = !!checked;
    this.save(STORAGE_KEYS.CUSTOM_BUILDER, this.customConfig);
    const lbl = document.getElementById('setCustomAvailableLabel');
    if (lbl) {
      lbl.innerText = checked ? '🟢 Disponible' : '🔴 Indisponible';
      lbl.style.color = checked ? 'var(--adm-success)' : 'var(--adm-danger, #b23a3a)';
    }
    this.showToast(checked ? '🟢 Plat sur Mesure DISPONIBLE pour les clients' : '🔴 Plat sur Mesure masqué aux clients');
  }

  renderCustomIngredientsLists() {
    const meatBox = document.getElementById('adminCustomMeatsList');
    if (meatBox) {
      meatBox.innerHTML = this.customConfig.meats.map((m, idx) => `
        <div style="display:flex; justify-content:space-between; align-items:center; background:#fff; border:1px solid var(--adm-accent-border); padding:6px 10px; border-radius:8px; font-size:12px;">
          <span>${m}</span>
          <button class="adm-btn adm-btn-danger adm-btn-sm" onclick="window.vomAdmin.removeCustomOption('meats', ${idx})">🗑️</button>
        </div>
      `).join('');
    }

    const sideBox = document.getElementById('adminCustomSidesList');
    if (sideBox) {
      sideBox.innerHTML = this.customConfig.sides.map((s, idx) => `
        <div style="display:flex; justify-content:space-between; align-items:center; background:#fff; border:1px solid var(--adm-accent-border); padding:6px 10px; border-radius:8px; font-size:12px;">
          <span>${s}</span>
          <button class="adm-btn adm-btn-danger adm-btn-sm" onclick="window.vomAdmin.removeCustomOption('sides', ${idx})">🗑️</button>
        </div>
      `).join('');
    }
  }

  addCustomOption(type) {
    const input = document.getElementById(type === 'meats' ? 'newCustomMeatInput' : 'newCustomSideInput');
    const val = input ? input.value.trim() : '';
    if (!val) return;

    this.customConfig[type].push(val);
    input.value = '';
    this.save(STORAGE_KEYS.CUSTOM_BUILDER, this.customConfig);
    this.renderCustomIngredientsLists();
    this.showToast(`Option "${val}" ajoutée !`);
  }

  removeCustomOption(type, index) {
    if (this.customConfig[type].length <= 1) {
      alert('Vous devez conserver au moins une option.');
      return;
    }
    this.customConfig[type].splice(index, 1);
    this.save(STORAGE_KEYS.CUSTOM_BUILDER, this.customConfig);
    this.renderCustomIngredientsLists();
  }

  // LIVRAISON
  renderDeliveryZonesList() {
    const list = document.getElementById('adminDeliveryZonesList');
    if (!list) return;

    list.innerHTML = this.delivery.zones.map((z, idx) => `
      <div style="display:flex; justify-content:space-between; align-items:center; background:#fff; border:1px solid var(--adm-accent-border); padding:6px 12px; border-radius:8px; font-size:12px;">
        <span>📍 ${z} <strong style="color:var(--adm-success); margin-left:6px;">(Livraison 0 Fc)</strong></span>
        <button class="adm-btn adm-btn-danger adm-btn-sm" onclick="window.vomAdmin.removeDeliveryZone(${idx})">🗑️</button>
      </div>
    `).join('');
  }

  addNewDeliveryZone() {
    const input = document.getElementById('newDeliveryZoneInput');
    const val = input ? input.value.trim() : '';
    if (!val) return;

    this.delivery.zones.push(val);
    input.value = '';
    this.save(STORAGE_KEYS.DELIVERY, this.delivery);
    this.renderDeliveryZonesList();
    this.showToast(`Zone "${val}" ajoutée à la livraison gratuite ! 🚚`);
  }

  removeDeliveryZone(index) {
    this.delivery.zones.splice(index, 1);
    this.save(STORAGE_KEYS.DELIVERY, this.delivery);
    this.renderDeliveryZonesList();
  }

  // APPARENCE
  saveAppearanceSettings() {
    this.appearance.primaryColor = document.getElementById('setPrimaryColorPicker')?.value || '#8b4513';
    this.appearance.secondaryColor = document.getElementById('setSecondaryColorPicker')?.value || '#d4a574';
    this.appearance.bannerText = document.getElementById('setBannerText')?.value.trim() || '';

    this.save(STORAGE_KEYS.APPEARANCE, this.appearance);
    this.showToast('Apparence mise à jour ! 🎨');
  }

  // SÉCURITÉ
  saveAdminId() {
    const val = document.getElementById('secAdminId')?.value.trim().toLowerCase();
    if (!val) {
      this.showToast('Veuillez renseigner un identifiant gérante.');
      return;
    }
    this.security.adminId = val;
    this.save(STORAGE_KEYS.SECURITY, this.security);
    this.showToast('Identifiant gérante enregistré ! 👤');
  }

  saveNewPin() {
    const cur = document.getElementById('secCurrentPin')?.value.trim();
    const np1 = document.getElementById('secNewPin1')?.value.trim();
    const np2 = document.getElementById('secNewPin2')?.value.trim();

    if (cur !== this.security.pin) {
      alert('Code PIN actuel incorrect.');
      return;
    }
    if (!np1 || np1.length < 4) {
      alert('Le nouveau code PIN doit comporter au moins 4 chiffres.');
      return;
    }
    if (np1 !== np2) {
      alert('La confirmation du code PIN ne correspond pas.');
      return;
    }

    this.security.pin = np1;
    this.save(STORAGE_KEYS.SECURITY, this.security);

    document.getElementById('secCurrentPin').value = '';
    document.getElementById('secNewPin1').value = '';
    document.getElementById('secNewPin2').value = '';

    this.showToast('Code PIN administrateur modifié avec succès ! 🔐');
  }

  renderSessionsList() {
    const box = document.getElementById('adminSessionsList');
    if (!box) return;

    box.innerHTML = (this.security.sessions || []).map((s, idx) => `
      <div style="display:flex; justify-content:space-between; align-items:center; background:#fff; border:1px solid var(--adm-accent-border); padding:8px 12px; border-radius:10px; font-size:12px;">
        <div>
          <div style="font-weight:800;">${s.device} ${s.isCurrent ? '<span class="adm-pill pill-success" style="font-size:9.5px;">Session Actuelle</span>' : ''}</div>
          <div style="font-size:10.5px; color:var(--adm-text-muted);">IP : ${s.ip} • 📍 ${s.location} • ${s.date}</div>
        </div>
        ${!s.isCurrent ? `<button class="adm-btn adm-btn-danger adm-btn-sm" onclick="window.vomAdmin.terminateSession(${idx})">Déconnecter</button>` : ''}
      </div>
    `).join('');
  }

  terminateSession(idx) {
    this.security.sessions.splice(idx, 1);
    this.save(STORAGE_KEYS.SECURITY, this.security);
    this.renderSessionsList();
    this.showToast('Session fermée avec succès');
  }

  renderLoginHistory() {
    const box = document.getElementById('adminLoginHistoryTable');
    if (!box) return;

    box.innerHTML = (this.security.loginLogs || []).map(l => `
      <tr style="border-bottom:1px solid #f1e4d6;">
        <td style="padding:6px 8px; font-size:11.5px;">${l.date}</td>
        <td style="padding:6px 8px; font-size:11.5px;">${l.ip}</td>
        <td style="padding:6px 8px; font-size:11.5px;">${l.method}</td>
        <td style="padding:6px 8px; font-size:11.5px;"><span class="adm-pill pill-success">${l.status}</span></td>
      </tr>
    `).join('');
  }

  // CONFIG GÉNÉRALE
  saveGeneralConfig() {
    this.config.language = document.getElementById('setConfigLang')?.value || 'fr';
    this.config.currency = document.getElementById('setConfigCurrency')?.value || 'Fc';
    this.config.terms = document.getElementById('setConfigTerms')?.value.trim() || '';
    this.config.privacy = document.getElementById('setConfigPrivacy')?.value.trim() || '';

    this.save(STORAGE_KEYS.CONFIG, this.config);
    this.showToast('Configuration générale enregistrée ! ⚙️');
  }

  // LOGOUT
  logoutAdmin() {
    if (confirm('Voulez-vous quitter l\'espace administrateur ?')) {
      localStorage.removeItem('vom_session_v1');
      sessionStorage.removeItem('vom_admin_ok');
      window.location.href = './welcome.html';
    }
  }

  // ==========================================
  // UTILITAIRES & LISTENERS
  // ==========================================
  showToast(msg) {
    const toast = document.createElement('div');
    toast.style.cssText = 'position:fixed; bottom:20px; right:20px; background:#8b4513; color:#fff; padding:12px 20px; border-radius:14px; font-size:12.5px; font-weight:800; z-index:99999; box-shadow:0 10px 25px rgba(139,69,19,0.35); display:flex; align-items:center; gap:8px; animation:admFadeIn 0.2s ease;';
    toast.innerText = msg;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }

  setupEventListeners() {
    // Chat input Enter key
    document.getElementById('adminChatInput')?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.sendAdminChatMessage();
    });

    // Filtre recherche plats
    document.getElementById('dishSearchInput')?.addEventListener('input', () => {
      this.renderMenuDishes();
    });

    // Filtre recherche commandes
    document.getElementById('orderSearchInput')?.addEventListener('input', () => {
      this.renderOrders();
    });
  }
}

// Initialisation globale
document.addEventListener('DOMContentLoaded', () => {
  window.vomAdmin = new VomAdminApp();
});
