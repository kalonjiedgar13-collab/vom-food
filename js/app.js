// ========================================================
// VOM FOOD - MOTEUR APPLICATIF CLIENT (PWA) & SYNC ADMIN
// ========================================================

const STORAGE_KEYS = {
  RESTAURANT: 'vom_restaurant_settings_v1',
  DISHES: 'vom_admin_dishes_v1',
  CUSTOM_BUILDER: 'vom_admin_custom_v1',
  ORDERS: 'vom_orders_db_v1',
  CHAT: 'vom_chat_threads_v1',
  REVIEWS: 'vom_reviews_db_v1',
  PROMOTIONS: 'vom_promotions_v1',
  DELIVERY: 'vom_delivery_settings_v1',
  PAYMENT: 'vom_payment_settings_v1',
  SCHEDULE: 'vom_admin_schedule_v1',
  STATUS: 'vom_restaurant_status_v1',
  SECURITY: 'vom_security_settings_v1'
};

class VomFoodApp {
  constructor() {
    this.migrateDemoData();

    this.cart = [];
    this.cartDeliveryFee = 0; // Livraison 100% Gratuite
    this.favorites = [];
    this.selectedDish = null;
    this.currentQty = 1;
    this.currentReviewStars = 5;

    // Données Client
    this.client = {
      name: 'Client',
      email: '',
      phone: '',
      password: 'password123',
      avatar: null,
      addresses: [],
      activeAddressId: null,
      settings: {
        notifsOrder: true,
        orderConfirmation: true,
        promosAndDiscounts: true,
        appSounds: true
      }
    };

    // Profil enregistré depuis le formulaire « Compléter mon profil »
    this.applySavedProfile();

    // Chargement des données synchronisées avec l'Espace Admin
    this.loadAdminSyncData();

    this.customDish = {
      meat: this.customConfig.meats[0] || 'Cuisse de poulet dorée 🍗',
      side: this.customConfig.sides[0] || 'Bananes plantains frites 🍌',
      spicy: 'Moyen 🟡',
      sauces: ['Sauce maison', 'Mayonnaise', 'Ketchup'],
      extras: [],
      price: this.customConfig.basePrice || 8000
    };

    this.init();
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

  loadAdminSyncData() {
    // 1. Restaurant & Horaires
    const savedRest = localStorage.getItem(STORAGE_KEYS.RESTAURANT);
    const savedSch = localStorage.getItem(STORAGE_KEYS.SCHEDULE);
    let orderDays = 'Lundi au Jeudi';
    let deliveryDays = 'Vendredi et Samedi';
    let phoneWhatsApp = '+243 895 968 355';

    if (savedRest) {
      try {
        const parsed = JSON.parse(savedRest);
        orderDays = parsed.orderDays || orderDays;
        deliveryDays = parsed.deliveryDays || deliveryDays;
        phoneWhatsApp = parsed.phone || phoneWhatsApp;
      } catch(e) {}
    } else if (savedSch) {
      try {
        const parsed = JSON.parse(savedSch);
        orderDays = parsed.orderDays || orderDays;
        deliveryDays = parsed.deliveryDays || deliveryDays;
        phoneWhatsApp = parsed.whatsappPhone || phoneWhatsApp;
      } catch(e) {}
    }

    this.admin = {
      pin: '1234',
      orderDays: orderDays,
      deliveryDays: deliveryDays,
      phoneWhatsApp: phoneWhatsApp
    };

    // 1b. Livraison (activée/désactivée + frais, définis par la gérante)
    this.delivery = { isEnabled: true, fee: 0, zones: [] };
    const savedDeliv = localStorage.getItem(STORAGE_KEYS.DELIVERY);
    if (savedDeliv) {
      try {
        const parsed = JSON.parse(savedDeliv);
        this.delivery.isEnabled = parsed.isEnabled !== false;
        this.delivery.fee = (typeof parsed.fee === 'number') ? parsed.fee : 0;
        if (parsed.zones) this.delivery.zones = parsed.zones;
      } catch (e) {}
    }

    // 1c. Moyens de paiement & numéros Mobile Money de la gérante
    this.payment = { mobileMoneyNumbers: {}, allowedMobileMoney: ['Airtel Money', 'Orange Money', 'M-Pesa'] };
    const savedPay = localStorage.getItem(STORAGE_KEYS.PAYMENT);
    if (savedPay) {
      try {
        const parsed = JSON.parse(savedPay);
        if (parsed.mobileMoneyNumbers) this.payment.mobileMoneyNumbers = parsed.mobileMoneyNumbers;
        if (parsed.allowedMobileMoney) this.payment.allowedMobileMoney = parsed.allowedMobileMoney;
      } catch(e) {}
    }

    // 2. Custom Dish Builder Options (8.000 Fc)
    const savedCustom = localStorage.getItem(STORAGE_KEYS.CUSTOM_BUILDER);
    if (savedCustom) {
      try {
        this.customConfig = JSON.parse(savedCustom);
      } catch(e) {
        this.customConfig = this.getDefaultCustomConfig();
      }
    } else {
      this.customConfig = this.getDefaultCustomConfig();
    }

    // 3. Plats au Menu
    const savedDishes = localStorage.getItem(STORAGE_KEYS.DISHES);
    if (savedDishes) {
      try {
        this.dishes = JSON.parse(savedDishes);
      } catch(e) {
        this.dishes = this.getDefaultDishes();
      }
    } else {
      this.dishes = this.getDefaultDishes();
    }

    // 4. Avis Clients
    const savedReviews = localStorage.getItem(STORAGE_KEYS.REVIEWS);
    if (savedReviews) {
      try {
        this.reviews = JSON.parse(savedReviews);
      } catch(e) {
        this.reviews = this.getDefaultReviews();
      }
    } else {
      this.reviews = this.getDefaultReviews();
    }

    // 5. Commandes
    const savedOrders = localStorage.getItem(STORAGE_KEYS.ORDERS);
    if (savedOrders) {
      try {
        this.orders = JSON.parse(savedOrders);
      } catch(e) {
        this.orders = this.getDefaultOrders();
      }
    } else {
      this.orders = this.getDefaultOrders();
    }
  }

  getDefaultCustomConfig() {
    return {
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
    };
  }

  getDefaultDishes() {
    return [
      {
        id: 'vom-10',
        name: 'Combo Cuisse Royale',
        price: 6500,
        isSpicy: true,
        available: true,
        desc: 'Cuisse de poulet marinée aux épices kinois, dorée au feu de braise et servie avec bananes plantains et frites croustillantes.',
        image: './public/assets/thumb_hero4.jpg',
        fullImage: './public/assets/hero4.jpg'
      },
      {
        id: 'vom-06',
        name: 'Cuisse + bananes plantains',
        price: 6500,
        isSpicy: false,
        available: true,
        desc: 'Cuisse de poulet braisée au feu doux accompagnée de généreuses bananes plantains frites.',
        image: './public/assets/thumb_hero2.jpg',
        fullImage: './public/assets/hero2.jpg'
      },
      {
        id: 'vom-02',
        name: 'Poisson braisé + shikwague',
        price: 6500,
        isSpicy: true,
        available: true,
        desc: 'Poisson frais grillé aux aromates kinois servi avec shikwague traditionnel.',
        image: './public/assets/thumb_hero3.jpg',
        fullImage: './public/assets/hero3.jpg'
      },
      {
        id: 'vom-01',
        name: 'Plat des bananes plantains',
        price: 6500,
        isSpicy: false,
        available: true,
        desc: 'Portion généreuse de bananes plantains frites bien dorées et sucrées.',
        image: './public/assets/thumb_hero1.jpg',
        fullImage: './public/assets/hero1.jpg'
      }
    ];
  }

  getDefaultReviews() {
    return [];
  }

  getDefaultOrders() {
    return [];
  }

  init() {
    this.renderPopularDishes();
    this.renderFullMenu();
    this.renderFavoritesScreen();
    this.renderCartScreen();
    this.renderAddresses();
    this.renderCustomBuilderOptions();
    this.renderClientOrdersScreen();
    this.renderChatMessages();
    this.updateCustomBuilderVisibility();
    this.updateCartBadge();
    this.updateFavoritesBadge();
    this.updateClientUI();
    this.updateScheduleUI();
    this.setupListeners();
    this.setupStorageSync();
  }

  setupStorageSync() {
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEYS.CHAT) {
        this.renderChatMessages();
      } else if (e.key === STORAGE_KEYS.ORDERS) {
        const saved = localStorage.getItem(STORAGE_KEYS.ORDERS);
        if (saved) try { this.orders = JSON.parse(saved); } catch(err) {}
        this.renderClientOrdersScreen();
      } else if (e.key === STORAGE_KEYS.REVIEWS) {
        const saved = localStorage.getItem(STORAGE_KEYS.REVIEWS);
        if (saved) try { this.reviews = JSON.parse(saved); } catch(err) {}
        this.renderDishReviews();
      } else if (e.key === STORAGE_KEYS.DISHES) {
        const saved = localStorage.getItem(STORAGE_KEYS.DISHES);
        if (saved) try { this.dishes = JSON.parse(saved); } catch(err) {}
        this.renderPopularDishes();
        this.renderFullMenu();
      } else if (e.key === STORAGE_KEYS.CUSTOM_BUILDER) {
        const saved = localStorage.getItem(STORAGE_KEYS.CUSTOM_BUILDER);
        if (saved) try { this.customConfig = JSON.parse(saved); } catch(err) {}
        this.renderCustomBuilderOptions();
        this.updateCustomBuilderVisibility();
      } else if (e.key === STORAGE_KEYS.RESTAURANT || e.key === STORAGE_KEYS.SCHEDULE) {
        this.loadAdminSyncData();
        this.updateClientUI();
        this.updateScheduleUI();
      } else if (e.key === STORAGE_KEYS.STATUS) {
        this.updateScheduleUI();
      } else if (e.key === STORAGE_KEYS.PAYMENT) {
        const savedPay = localStorage.getItem(STORAGE_KEYS.PAYMENT);
        if (savedPay) {
          try {
            const parsed = JSON.parse(savedPay);
            if (parsed.mobileMoneyNumbers) this.payment.mobileMoneyNumbers = parsed.mobileMoneyNumbers;
            if (parsed.allowedMobileMoney) this.payment.allowedMobileMoney = parsed.allowedMobileMoney;
          } catch(err) {}
        }
        this.renderCartScreen();
      }
    });
  }

  switchScreen(screenId) {
    document.querySelectorAll('.screen-view').forEach(v => v.classList.remove('active'));
    const target = document.getElementById(screenId);
    if (target) {
      target.classList.add('active');
      target.scrollTop = 0;
    }

    if (screenId === 'screen-cart') this.renderCartScreen();
    if (screenId === 'screen-favorites') this.renderFavoritesScreen();
    if (screenId === 'screen-edit-address') this.renderAddresses();
    if (screenId === 'screen-custom-builder') this.renderCustomBuilderOptions();
    if (screenId === 'screen-orders') this.renderClientOrdersScreen();
    if (screenId === 'screen-chat') this.renderChatMessages();

    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.screen === screenId);
    });

    const bottomNav = document.getElementById('bottomNav');
    const noNavScreens = [
      'screen-detail',
      'screen-custom-builder',
      'screen-edit-profile',
      'screen-edit-address',
      'screen-orders',
      'screen-app-settings',
      'screen-support',
      'screen-about'
    ];

    if (noNavScreens.includes(screenId)) {
      bottomNav.style.display = 'none';
    } else {
      bottomNav.style.display = 'flex';
    }
  }

  // ==========================================
  // SYSTÈME D'AVIS CLIENTS ET NOTATION
  // ==========================================
  selectRatingStar(stars) {
    this.currentReviewStars = stars;
    document.querySelectorAll('.rating-star-pick').forEach(el => {
      const s = parseInt(el.dataset.star);
      el.classList.toggle('selected', s <= stars);
    });
  }

  submitDishReview() {
    if (!this.selectedDish) return;

    const commentInput = document.getElementById('reviewCommentInput');
    const comment = commentInput ? commentInput.value.trim() : '';

    if (!comment) {
      alert('Veuillez écrire un commentaire avant de publier votre avis.');
      return;
    }

    const newReview = {
      id: `rev-${Date.now()}`,
      dishId: this.selectedDish.id,
      dishName: this.selectedDish.name,
      author: this.client.name,
      stars: this.currentReviewStars,
      date: 'À l\'instant',
      comment: comment,
      adminReply: null,
      isHidden: false
    };

    this.reviews.unshift(newReview);
    localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(this.reviews));

    commentInput.value = '';
    this.renderDishReviews();
    this.showToast('Votre avis a été publié avec succès ! ⭐');
  }

  renderDishReviews() {
    const list = document.getElementById('dishReviewsList');
    if (!list || !this.selectedDish) return;

    // Filtrer les avis pour ce plat (non masqués)
    const dishReviews = this.reviews.filter(r => (!r.dishId || r.dishId === this.selectedDish.id) && !r.isHidden);

    const countEl = document.getElementById('detailReviewsCount');
    if (countEl) countEl.innerText = dishReviews.length > 0 ? `${dishReviews.length} avis` : '';

    if (dishReviews.length === 0) {
      list.innerHTML = `<div style="font-size:11px; color:var(--c-text-muted); text-align:center; padding:8px;">Soyez le premier à donner votre avis sur ce plat !</div>`;
      return;
    }

    list.innerHTML = dishReviews.map(r => `
      <div class="review-item-bubble">
        <div class="review-author-line">
          <span>👤 ${r.author}</span>
          <span style="color:#f59e0b;">${'★'.repeat(r.stars)}</span>
        </div>
        <div class="review-comment-text">${r.comment}</div>
        <div style="font-size:9.5px; color:#8c7a6b; margin-top:2px;">${r.date}</div>

        ${r.adminReply ? `
          <div class="review-admin-reply-tag">
            <div class="review-admin-reply-author">
              <span>👑 Réponse officielle de Cheffe Vom :</span>
            </div>
            <div>${r.adminReply}</div>
          </div>
        ` : ''}
      </div>
    `).join('');
  }

  // ==========================================
  // CONSTRUCTEUR DE PLAT SUR MESURE (8.000 FC)
  // ==========================================
  openCustomBuilder() {
    if (this.customConfig.isAvailable === false) {
      this.showToast('Le Plat sur Mesure est momentanément indisponible 🙏');
      return;
    }
    this.customDish = {
      meat: this.customConfig.meats[0] || 'Cuisse de poulet dorée 🍗',
      side: this.customConfig.sides[0] || 'Bananes plantains frites 🍌',
      spicy: 'Moyen 🟡',
      sauces: ['Sauce maison', 'Mayonnaise', 'Ketchup'],
      extras: [],
      price: this.customConfig.basePrice || 8000
    };
    this.renderCustomBuilderOptions();
    this.switchScreen('screen-custom-builder');
  }

  renderCustomBuilderOptions() {
    const meatBox = document.getElementById('builderMeatsContainer');
    if (meatBox) {
      meatBox.innerHTML = this.customConfig.meats.map((m, idx) => `
        <div class="custom-pill-opt ${idx === 0 ? 'active' : ''}" onclick="window.vomApp.selectCustomOpt('meat', '${m}', this)">
          ${m}
        </div>
      `).join('');
    }

    const sideBox = document.getElementById('builderSidesContainer');
    if (sideBox) {
      sideBox.innerHTML = this.customConfig.sides.map((s, idx) => `
        <div class="custom-pill-opt ${idx === 0 ? 'active' : ''}" onclick="window.vomApp.selectCustomOpt('side', '${s}', this)">
          ${s}
        </div>
      `).join('');
    }
  }

  updateCustomBuilderVisibility() {
    const available = this.customConfig.isAvailable !== false;
    const banner = document.getElementById('customDishBanner');
    if (banner) banner.style.display = available ? '' : 'none';
    // Si le client est sur l'écran de personnalisation et que la gérante le désactive → retour au menu
    if (!available) {
      const builderScreen = document.getElementById('screen-custom-builder');
      if (builderScreen && builderScreen.classList.contains('active')) {
        this.switchScreen('screen-menu');
        this.showToast('Le Plat sur Mesure vient d\'être désactivé par la gérante 🙏');
      }
    }
  }

  selectCustomOpt(category, value, elem) {
    this.customDish[category] = value;
    elem.parentElement.querySelectorAll('.custom-pill-opt').forEach(opt => opt.classList.remove('active'));
    elem.classList.add('active');
  }

  addCustomDishToCart() {
    const sauces = [];
    if (document.getElementById('bldSauce')?.checked) sauces.push('Sauce maison');
    if (document.getElementById('bldMayo')?.checked) sauces.push('Mayonnaise');
    if (document.getElementById('bldKetchup')?.checked) sauces.push('Ketchup');

    const extras = [];
    let extraCost = 0;
    if (document.getElementById('bldExtraBanane')?.checked) {
      extras.push('+ Bananes');
      extraCost += 1000;
    }
    if (document.getElementById('bldExtraShikwague')?.checked) {
      extras.push('+ Shikwague');
      extraCost += 500;
    }

    const price = (this.customConfig.basePrice || 8000) + extraCost;
    const customName = `Plat sur Mesure : ${this.customDish.meat}`;
    const customOptions = `${this.customDish.side} • ${this.customDish.spicy}`;

    this.cart.push({
      dish: {
        id: `custom-${Date.now()}`,
        name: customName,
        price: price,
        image: './public/assets/thumb_hero4.jpg'
      },
      qty: 1,
      portion: 'standard',
      sauces: sauces,
      customDetails: customOptions,
      extras: extras,
      unitPrice: price,
      totalPrice: price
    });

    this.showToast(`Plat personnalisé (${price.toLocaleString('fr-FR')} Fc) ajouté au panier ! 🎨`);
    this.updateCartBadge();
    this.switchScreen('screen-cart');
  }

  // ==========================================
  // PANIER & COMMANDE WHATSAPP / SYNC ADMIN
  // ==========================================
  renderCartScreen() {
    const container = document.getElementById('cartItemsList');
    const emptyView = document.getElementById('cartEmptyView');
    const contentView = document.getElementById('cartContentView');
    const badge = document.getElementById('cartNavCount');

    const totalCount = this.cart.reduce((sum, i) => sum + i.qty, 0);
    if (badge) badge.innerText = totalCount;

    if (this.cart.length === 0) {
      if (emptyView) emptyView.style.display = 'flex';
      if (contentView) contentView.style.display = 'none';
      return;
    }

    if (emptyView) emptyView.style.display = 'none';
    if (contentView) contentView.style.display = 'flex';

    if (container) {
      container.innerHTML = this.cart.map((item, idx) => `
        <div class="cart-item-card">
          <div class="cart-item-thumb">
            <img src="${item.dish.image}" alt="${item.dish.name}">
          </div>

          <div class="cart-item-info">
            <div class="cart-item-title">${item.dish.name}</div>
            <div class="cart-item-options">
              ${item.customDetails ? `<strong>${item.customDetails}</strong><br>` : ''}
              ${item.sauces.join(', ') || 'Nature'}
              ${item.extras.length ? ` • ${item.extras.join(', ')}` : ''}
            </div>
            <div class="cart-item-price">${item.totalPrice.toLocaleString('fr-FR')} Fc</div>
          </div>

          <div class="cart-item-stepper">
            <button class="btn-step" onclick="window.vomApp.changeCartItemQty(${idx}, -1)">−</button>
            <span class="step-qty">${item.qty}</span>
            <button class="btn-step" onclick="window.vomApp.changeCartItemQty(${idx}, 1)">+</button>
          </div>
        </div>
      `).join('');
    }

    const subtotal = this.cart.reduce((sum, i) => sum + i.totalPrice, 0);
    // Livraison : gratuite ou payante selon le réglage de la gérante
    const deliveryOn = this.delivery && this.delivery.isEnabled !== false;
    const fee = deliveryOn ? (this.delivery.fee || 0) : 0;
    const total = subtotal + fee;

    const subElem = document.getElementById('cartSubtotalValue');
    const feeElem = document.getElementById('cartDeliveryFeeValue');
    const totalElem = document.getElementById('cartTotalFinalValue');
    const btnPrice = document.getElementById('cartBtnTotalPrice');

    if (subElem) subElem.innerText = `${subtotal.toLocaleString('fr-FR')} Fc`;
    if (feeElem) {
      if (!deliveryOn) feeElem.innerText = `Livraison indisponible`;
      else if (fee === 0) feeElem.innerText = `0 Fc (Gratuit 🎉)`;
      else feeElem.innerText = `${fee.toLocaleString('fr-FR')} Fc`;
    }
    if (totalElem) totalElem.innerText = `${total.toLocaleString('fr-FR')} Fc`;
    if (btnPrice) btnPrice.innerText = `${total.toLocaleString('fr-FR')} Fc`;

    this.renderMobileMoneyInfo();
  }

  renderMobileMoneyInfo() {
    const box = document.getElementById('cartMobileMoneyInfo');
    if (!box) return;
    const mmn = (this.payment && this.payment.mobileMoneyNumbers) || {};
    const rows = [];
    if (mmn.airtel) rows.push(`<span>📶 <b>Airtel Money :</b> ${mmn.airtel}</span>`);
    if (mmn.orange) rows.push(`<span>🟠 <b>Orange Money :</b> ${mmn.orange}</span>`);
    if (mmn.mpesa) rows.push(`<span>🟢 <b>M-Pesa :</b> ${mmn.mpesa}</span>`);
    if (rows.length === 0) { box.style.display = 'none'; return; }
    box.style.display = 'flex';
    box.innerHTML = `<span style="font-size:11px; font-weight:800; color:var(--c-primary);">📲 Ou payez par Mobile Money :</span>` + rows.join('');
  }

  changeCartItemQty(index, delta) {
    if (index < 0 || index >= this.cart.length) return;

    this.cart[index].qty += delta;

    if (this.cart[index].qty <= 0) {
      this.cart.splice(index, 1);
      this.showToast('Plat retiré du panier');
    } else {
      this.cart[index].totalPrice = this.cart[index].unitPrice * this.cart[index].qty;
    }

    this.renderCartScreen();
    this.updateCartBadge();
  }

  clearCart() {
    if (this.cart.length === 0) return;
    if (confirm('Voulez-vous vider tout votre panier ?')) {
      this.cart = [];
      this.renderCartScreen();
      this.updateCartBadge();
      this.showToast('Panier vidé');
    }
  }

  submitOrderWhatsApp() {
    if (this.cart.length === 0) {
      alert('Votre panier est vide !');
      return;
    }

    const orderNum = `VF-${Math.floor(1000 + Math.random() * 9000)}`;
    const subtotal = this.cart.reduce((sum, i) => sum + i.totalPrice, 0);
    const total = subtotal;
    const note = document.getElementById('cartCustomerNote')?.value.trim();

    const activeAddr = this.client.addresses.find(a => a.id === this.client.activeAddressId)?.address || this.client.addresses[0]?.address || 'Kinshasa';

    // Enregistrer la commande dans la base locale partagée avec l'Admin
    const newOrder = {
      id: orderNum,
      clientName: this.client.name,
      clientPhone: this.client.phone,
      address: activeAddr,
      items: this.cart.map(i => ({
        name: i.dish.name,
        qty: i.qty,
        price: i.unitPrice,
        details: i.customDetails,
        sauces: i.sauces
      })),
      subtotal: subtotal,
      deliveryFee: 0,
      total: total,
      status: "new",
      paymentMethod: "Paiement par transfert (Mobile Money)",
      paymentStatus: "pending",
      date: "Aujourd'hui " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      notes: note || "Commande passée via application mobile"
    };

    this.orders.unshift(newOrder);
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(this.orders));

    let msg = `Bonjour VOM FOOD ! Je passe commande (${orderNum}) :\n\n`;
    msg += `👤 Client : ${this.client.name} (${this.client.phone})\n`;
    msg += `📍 Adresse : ${activeAddr}\n\n`;
    msg += `🛒 DÉTAILS DE LA COMMANDE :\n`;

    this.cart.forEach((item, idx) => {
      msg += `${idx + 1}. ${item.qty}x ${item.dish.name} - ${item.totalPrice.toLocaleString('fr-FR')} Fc\n`;
      if (item.customDetails) msg += `   Personnalisation : ${item.customDetails}\n`;
      msg += `   Sauces : ${item.sauces.join(', ') || 'Nature'}\n`;
      if (item.extras.length) msg += `   Suppléments : ${item.extras.join(', ')}\n`;
    });

    if (note) {
      msg += `\n📝 Instructions cuisine : ${note}\n`;
    }

    msg += `\n🛵 Livraison : Gratuite (0 Fc)\n`;
    msg += `💵 Mode de paiement : Paiement par transfert (Mobile Money ou transfert bancaire)\n`;
    msg += `💰 TOTAL À PAYER : ${total.toLocaleString('fr-FR')} Fc\n\n`;
    msg += `Merci et à très vite ! 🍗✨`;

    const phoneClean = (this.admin.phoneWhatsApp || '+243895968355').replace(/[^0-9]/g, '');
    const url = `https://wa.me/${phoneClean}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');

    this.showToast('Commande transmise à Cheffe Vom ! 🎉');
  }

  // ==========================================
  // SUIVI DES COMMANDES CLIENT
  // ==========================================
  renderClientOrdersScreen() {
    const box = document.getElementById('clientOrdersContainer');
    if (!box) return;

    if (this.orders.length === 0) {
      box.innerHTML = `
        <div class="edit-form-card" style="text-align:center; padding:20px;">
          <div style="font-size:28px; margin-bottom:6px;">📦</div>
          <div style="font-size:12.5px; font-weight:800; color:var(--c-primary);">Aucune commande en cours</div>
          <div style="font-size:11px; color:var(--c-text-muted);">Vos commandes apparaîtront ici avec leur suivi en temps réel.</div>
        </div>
      `;
      return;
    }

    box.innerHTML = this.orders.map(o => `
      <div class="edit-form-card">
        <div style="display:flex; justify-content:space-between; font-weight:800; font-size:12.5px;">
          <span>Commande #${o.id}</span>
          <span style="color:var(--c-primary);">${o.total.toLocaleString('fr-FR')} Fc</span>
        </div>
        <div style="font-size:11.5px; color:var(--c-text-muted);">
          ${o.items.map(i => `${i.qty}x ${i.name}`).join(', ')}
        </div>
        <div style="font-size:11px; font-weight:800; margin-top:3px; color:${this.getStatusColor(o.status)};">
          ${this.getStatusBadgeLabel(o.status)}
        </div>
        <div style="font-size:10px; color:var(--c-text-muted); margin-top:2px;">
          🛵 Livraison Gratuite (0 Fc) • Paiement à la réception
        </div>
      </div>
    `).join('');
  }

  getStatusBadgeLabel(status) {
    switch (status) {
      case 'new': return '🟡 Commande reçue';
      case 'confirmed': return '🔵 Confirmée par Cheffe Vom';
      case 'prep': return '🔥 En préparation sur le grill';
      case 'ready': return '🍲 Prête pour le départ';
      case 'delivering': return '🛵 En cours de livraison vers chez vous';
      case 'delivered': return '✅ Livrée avec succès • Bon appétit !';
      case 'cancelled': return '❌ Commande annulée';
      default: return '🔥 En cours de traitement';
    }
  }

  getStatusColor(status) {
    switch (status) {
      case 'new': return '#b45309';
      case 'confirmed': return '#1d4ed8';
      case 'prep': return '#ea580c';
      case 'ready': return '#7c3aed';
      case 'delivering': return '#2563eb';
      case 'delivered': return '#166534';
      case 'cancelled': return '#dc2626';
      default: return '#ea580c';
    }
  }

  // ==========================================
  // DISCUSSIONS CLIENT & LIVE CHAT SYNC
  // ==========================================
  renderChatMessages() {
    const box = document.getElementById('chatMessagesBox');
    if (!box) return;

    let chatData = null;
    const raw = localStorage.getItem(STORAGE_KEYS.CHAT);
    if (raw) {
      try {
        chatData = JSON.parse(raw);
      } catch(e) {}
    }

    const MY_THREAD_ID = 'client-vom';
    const thread = chatData?.[MY_THREAD_ID];

    if (!thread || !thread.messages || thread.messages.length === 0) {
      box.innerHTML = `<div style="text-align:center; color:var(--c-text-muted); font-size:12px; padding:24px 12px; line-height:1.5;">
        💬 Envoyez un message à la Gérante,<br>elle vous répondra en direct ici.
      </div>`;
      return;
    }

    box.innerHTML = thread.messages.map(m => `
      <div class="bubble ${m.sender === 'admin' ? 'bubble-received' : 'bubble-sent'}">
        ${m.sender === 'admin' ? '<strong>👑 Gérante VOM FOOD :</strong><br>' : ''}
        ${m.text}
        <div style="font-size:9px; opacity:0.7; text-align:right; margin-top:2px;">${m.time || ''}</div>
      </div>
    `).join('');

    box.scrollTop = box.scrollHeight;
  }

  sendChatMessage() {
    const input = document.getElementById('chatInput');
    const msg = input.value.trim();
    if (!msg) return;

    let chatData = {};
    const raw = localStorage.getItem(STORAGE_KEYS.CHAT);
    if (raw) {
      try { chatData = JSON.parse(raw); } catch(e) {}
    }

    const MY_THREAD_ID = 'client-vom';
    if (!chatData[MY_THREAD_ID]) {
      chatData[MY_THREAD_ID] = {
        id: MY_THREAD_ID,
        name: this.client.name,
        phone: this.client.phone,
        avatar: "👤",
        isOnline: true,
        unread: 0,
        lastMessageTime: "À l'instant",
        messages: []
      };
    }

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    chatData[MY_THREAD_ID].messages.push({
      sender: "client",
      text: msg,
      time: timeStr
    });
    chatData[MY_THREAD_ID].unread = (chatData[MY_THREAD_ID].unread || 0) + 1;
    chatData[MY_THREAD_ID].lastMessageTime = timeStr;

    localStorage.setItem(STORAGE_KEYS.CHAT, JSON.stringify(chatData));
    input.value = '';
    this.renderChatMessages();
    // 📡 Le message est maintenant transmis en temps réel au serveur (js/sync.js),
    // puis diffusé à l'Espace Admin de la gérante. Sa réponse arrive en direct.
  }

  // ==========================================
  // CODE PIN ADMIN / ACCÈS GÉRANTE
  // ==========================================
  openAdminPinModal() {
    const modal = document.getElementById('adminPinModalOverlay');
    if (modal) {
      modal.classList.add('active');
      document.getElementById('adminPinInputField')?.focus();
    }
  }

  closeAdminPinModal() {
    document.getElementById('adminPinModalOverlay')?.classList.remove('active');
  }

  verifyAdminPin() {
    const input = document.getElementById('adminPinInputField');
    const entered = input ? input.value.trim() : '';

    let storedPin = '1234';
    const savedSec = localStorage.getItem(STORAGE_KEYS.SECURITY);
    if (savedSec) {
      try {
        const parsed = JSON.parse(savedSec);
        if (parsed.pin) storedPin = parsed.pin;
      } catch(e) {}
    }

    if (entered === storedPin) {
      this.closeAdminPinModal();
      window.location.href = './admin.html';
    } else {
      alert('Code PIN incorrect. Veuillez réessayer.');
      if (input) input.value = '';
    }
  }

  // ==========================================
  // PROFIL & ADRESSES
  // ==========================================
  saveProfile() {
    const name = document.getElementById('editClientName')?.value.trim();
    const email = document.getElementById('editClientEmail')?.value.trim();
    const phone = document.getElementById('editClientPhone')?.value.trim();
    const newPwd = document.getElementById('editClientNewPassword')?.value.trim();
    const confirmPwd = document.getElementById('editClientConfirmPassword')?.value.trim();

    if (newPwd && newPwd !== confirmPwd) {
      alert('Les mots de passe ne correspondent pas !');
      return;
    }

    if (name) this.client.name = name;
    if (email) this.client.email = email;
    if (phone) this.client.phone = phone;
    if (newPwd) this.client.password = newPwd;

    this.updateClientUI();
    this.showToast('Profil mis à jour ! ✅');
    this.switchScreen('screen-settings');
  }

  renderAddresses() {
    const container = document.getElementById('addressListContainer');
    if (!container) return;

    container.innerHTML = this.client.addresses.map((item) => `
      <div class="address-item-card">
        <div style="flex:1;">
          <div style="font-size:12px; font-weight:800; color:var(--c-text);">
            📍 ${item.label} ${item.id === this.client.activeAddressId ? '<span style="font-size:9.5px; background:#dcfce7; color:#166534; padding:1px 6px; border-radius:8px; margin-left:4px;">Par défaut</span>' : ''}
          </div>
          <div style="font-size:11px; color:var(--c-text-muted); margin-top:2px;">${item.address}</div>
          <div style="font-size:10.5px; font-weight:700; color:#166534; margin-top:1px;">Livraison Gratuite (0 Fc)</div>
        </div>
        <div style="display:flex; gap:6px;">
          <button class="btn-delete-addr" onclick="window.vomApp.deleteAddress(${item.id})" title="Supprimer">🗑️</button>
        </div>
      </div>
    `).join('');
  }

  addNewAddress() {
    const label = document.getElementById('newAddrLabel')?.value.trim() || 'Adresse';
    const address = document.getElementById('newAddrText')?.value.trim();

    if (!address) {
      alert('Veuillez entrer une adresse complète');
      return;
    }

    const newId = Date.now();
    this.client.addresses.push({
      id: newId,
      label: label,
      address: address,
      zone: 'Livraison Gratuite',
      fee: 0
    });

    document.getElementById('newAddrText').value = '';
    this.renderAddresses();
    this.updateClientUI();
    this.showToast('Nouvelle adresse ajoutée ! 📍');
  }

  deleteAddress(id) {
    if (this.client.addresses.length <= 1) {
      alert('Vous devez conserver au moins une adresse de livraison.');
      return;
    }
    this.client.addresses = this.client.addresses.filter(a => a.id !== id);
    this.renderAddresses();
    this.updateClientUI();
    this.showToast('Adresse supprimée');
  }

  saveAppSettings() {
    this.client.settings.notifsOrder = document.getElementById('settingNotifOrder')?.checked ?? true;
    this.client.settings.orderConfirmation = document.getElementById('settingOrderConfirm')?.checked ?? true;
    this.client.settings.promosAndDiscounts = document.getElementById('settingPromos')?.checked ?? true;
    this.client.settings.appSounds = document.getElementById('settingSounds')?.checked ?? true;

    this.showToast('Paramètres enregistrés ! ✅');
    this.switchScreen('screen-settings');
  }

  submitProblemReport() {
    const topic = document.getElementById('supportProblemTopic')?.value || 'Autre';
    const desc = document.getElementById('supportProblemDesc')?.value.trim();

    if (!desc) {
      alert('Veuillez décrire le problème rencontré.');
      return;
    }

    const msg = `Bonjour VOM FOOD Support !\nSignalement : ${topic}\n\nDétail : ${desc}\nClient : ${this.client.name} (${this.client.phone})`;
    const phoneClean = (this.admin.phoneWhatsApp || '+243895968355').replace(/[^0-9]/g, '');
    const url = `https://wa.me/${phoneClean}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');

    document.getElementById('supportProblemDesc').value = '';
    this.showToast('Signalement transmis au support ! 📨');
    this.switchScreen('screen-settings');
  }

  handleAvatarUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      this.client.avatar = e.target.result;
      this.updateClientUI();
      this.showToast('Photo mise à jour ! 📷');
    };
    reader.readAsDataURL(file);
  }

  applySavedProfile() {
    try {
      const raw = localStorage.getItem('vom_client_profile_v1');
      if (!raw) return;
      const p = JSON.parse(raw);
      if (p.name) this.client.name = p.name;
      if (p.avatar) this.client.avatar = p.avatar;
      if (p.contact) {
        // si ça ressemble à un e-mail → email, sinon téléphone
        if (p.contact.indexOf('@') !== -1) this.client.email = p.contact;
        else this.client.phone = p.contact;
      }
      if (p.zone) {
        const addr = p.address ? (p.address + ', ' + p.zone) : p.zone;
        this.client.addresses[0] = { id: 1, label: 'Maison', address: addr, zone: 'Livraison Gratuite', fee: 0 };
        this.client.activeAddressId = 1;
      }
    } catch (e) {}
  }

  updateClientUI() {
    document.querySelectorAll('.user-display-name').forEach(el => el.innerText = this.client.name);
    document.querySelectorAll('.user-display-phone').forEach(el => el.innerText = this.client.phone);
    document.querySelectorAll('.user-display-email').forEach(el => el.innerText = this.client.email);

    const eName = document.getElementById('editClientName');
    const eEmail = document.getElementById('editClientEmail');
    const ePhone = document.getElementById('editClientPhone');

    if (eName) eName.value = this.client.name;
    if (eEmail) eEmail.value = this.client.email;
    if (ePhone) ePhone.value = this.client.phone;

    const avatarBoxes = document.querySelectorAll('.client-avatar-container');
    avatarBoxes.forEach(box => {
      if (this.client.avatar) {
        box.innerHTML = `<img src="${this.client.avatar}" alt="${this.client.name}" class="client-avatar-img">`;
      } else {
        box.innerHTML = `<span>👤</span>`;
      }
    });

    const editPreview = document.getElementById('avatarEditPreview');
    if (editPreview) {
      if (this.client.avatar) {
        editPreview.innerHTML = `
          <img src="${this.client.avatar}" alt="${this.client.name}">
          <span class="avatar-camera-badge">📷 Modifier</span>
        `;
      } else {
        editPreview.innerHTML = `
          <span style="font-size: 26px;">👤</span>
          <span class="avatar-camera-badge">📷 Ajouter</span>
        `;
      }
    }
  }

  updateScheduleUI() {
    document.querySelectorAll('.display-order-days').forEach(el => el.innerText = this.admin.orderDays);
    document.querySelectorAll('.display-delivery-days').forEach(el => el.innerText = this.admin.deliveryDays);
  }

  // ==========================================
  // FAVORIS & DETAIL PLATS
  // ==========================================
  toggleFavorite(dishId, event) {
    if (event) event.stopPropagation();

    const idx = this.favorites.indexOf(dishId);
    const dish = this.dishes.find(d => d.id === dishId);
    const dishName = dish ? dish.name : 'Plat';

    if (idx > -1) {
      this.favorites.splice(idx, 1);
      this.showToast(`${dishName} retiré des favoris`);
    } else {
      this.favorites.push(dishId);
      this.showToast(`${dishName} ajouté aux favoris ❤️`);
    }

    this.renderPopularDishes();
    this.renderFullMenu();
    this.renderFavoritesScreen();
    this.updateFavoritesBadge();
    this.updateDetailHeart();
  }

  isFavorite(dishId) {
    return this.favorites.includes(dishId);
  }

  updateFavoritesBadge() {
    const badge = document.getElementById('favNavCount');
    if (badge) {
      badge.innerText = this.favorites.length;
    }
  }

  updateDetailHeart() {
    const btn = document.getElementById('detailFavBtn');
    if (btn && this.selectedDish) {
      const isFav = this.isFavorite(this.selectedDish.id);
      btn.innerText = isFav ? '❤️' : '🤍';
      btn.classList.toggle('is-fav', isFav);
    }
  }

  renderPopularDishes(query = '') {
    const container = document.getElementById('popularDishesGrid');
    if (!container) return;

    let list = this.dishes.filter(d => d.available !== false);
    if (query.trim() !== '') {
      list = list.filter(d => d.name.toLowerCase().includes(query.toLowerCase()));
    }

    container.innerHTML = list.map(dish => {
      const isFav = this.isFavorite(dish.id);
      return `
        <div class="dish-card-item" onclick="window.vomApp.openDishDetail('${dish.id}')">
          <div class="card-top-tags">
            ${dish.isSpicy ? '<span class="tag-spicy">🔥 Épicé</span>' : '<span></span>'}
            <div class="btn-fav-heart ${isFav ? 'is-fav' : ''}" onclick="window.vomApp.toggleFavorite('${dish.id}', event)" title="Favori">
              ${isFav ? '❤️' : '🤍'}
            </div>
          </div>

          <div class="dish-card-img-box">
            <img src="${dish.image}" alt="${dish.name}">
          </div>

          <div class="dish-card-name">${dish.name}</div>

          <div class="dish-card-footer-row">
            <div class="dish-card-price">${dish.price.toLocaleString('fr-FR')} Fc</div>
            <button class="btn-card-add" onclick="event.stopPropagation(); window.vomApp.quickAdd('${dish.id}')">
              +
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  renderFullMenu() {
    const container = document.getElementById('fullMenuGrid');
    if (!container) return;

    const list = this.dishes.filter(d => d.available !== false);

    container.innerHTML = list.map(dish => {
      const isFav = this.isFavorite(dish.id);
      return `
        <div class="dish-card-item" onclick="window.vomApp.openDishDetail('${dish.id}')">
          <div class="card-top-tags">
            ${dish.isSpicy ? '<span class="tag-spicy">🔥 Épicé</span>' : '<span></span>'}
            <div class="btn-fav-heart ${isFav ? 'is-fav' : ''}" onclick="window.vomApp.toggleFavorite('${dish.id}', event)">
              ${isFav ? '❤️' : '🤍'}
            </div>
          </div>
          <div class="dish-card-img-box">
            <img src="${dish.image}" alt="${dish.name}">
          </div>
          <div class="dish-card-name">${dish.name}</div>
          <div class="dish-card-footer-row">
            <div class="dish-card-price">${dish.price.toLocaleString('fr-FR')} Fc</div>
            <button class="btn-card-add" onclick="event.stopPropagation(); window.vomApp.quickAdd('${dish.id}')">
              +
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  renderFavoritesScreen() {
    const container = document.getElementById('favoritesGrid');
    if (!container) return;

    const favDishes = this.dishes.filter(d => this.favorites.includes(d.id));

    if (favDishes.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px 10px; color: var(--c-text-muted);">
          <div style="font-size: 36px; margin-bottom: 8px;">🤍</div>
          <p style="font-weight: 700; font-size: 14px; color: var(--c-primary); margin-bottom: 4px;">Aucun favori pour le moment</p>
          <p style="font-size: 12px;">Cliquez sur le cœur ❤️ d'un plat pour l'ajouter à vos favoris !</p>
        </div>
      `;
      return;
    }

    container.innerHTML = favDishes.map(dish => `
      <div class="dish-card-item" onclick="window.vomApp.openDishDetail('${dish.id}')">
        <div class="card-top-tags">
          ${dish.isSpicy ? '<span class="tag-spicy">🔥 Épicé</span>' : '<span></span>'}
          <div class="btn-fav-heart is-fav" onclick="window.vomApp.toggleFavorite('${dish.id}', event)">
            ❤️
          </div>
        </div>
        <div class="dish-card-img-box">
          <img src="${dish.image}" alt="${dish.name}">
        </div>
        <div class="dish-card-name">${dish.name}</div>
        <div class="dish-card-footer-row">
          <div class="dish-card-price">${dish.price.toLocaleString('fr-FR')} Fc</div>
          <button class="btn-card-add" onclick="event.stopPropagation(); window.vomApp.quickAdd('${dish.id}')">
            +
          </button>
        </div>
      </div>
    `).join('');
  }

  openDishDetail(dishId) {
    const dish = this.dishes.find(d => d.id === dishId) || this.dishes[0];
    this.selectedDish = dish;
    this.currentQty = 1;
    this.selectRatingStar(5);

    document.getElementById('detailHeroImg').src = dish.fullImage || dish.image;
    document.getElementById('detailTitle').innerText = dish.name;
    document.getElementById('detailDesc').innerText = dish.desc;
    document.getElementById('detailQtyCount').innerText = '1';

    this.updateDetailHeart();
    this.renderDishReviews();

    document.getElementById('toggleChoux').checked = true;
    document.getElementById('toggleMayo').checked = true;
    document.getElementById('togglePiment').checked = true;
    document.getElementById('toggleExtraBanane').checked = false;
    document.getElementById('toggleExtraShikwague').checked = false;

    this.calculateDetailTotal();
    this.switchScreen('screen-detail');
  }

  changeQty(delta) {
    this.currentQty = Math.max(1, this.currentQty + delta);
    document.getElementById('detailQtyCount').innerText = this.currentQty;
    this.calculateDetailTotal();
  }

  calculateDetailTotal() {
    if (!this.selectedDish) return;
    let base = this.selectedDish.price;

    if (document.getElementById('toggleExtraBanane')?.checked) base += 1000;
    if (document.getElementById('toggleExtraShikwague')?.checked) base += 500;

    const total = base * this.currentQty;
    document.getElementById('detailTotalBtnPrice').innerText = `${total.toLocaleString('fr-FR')} Fc`;
  }

  confirmAddToCart() {
    if (!this.selectedDish) return;

    const sauces = [];
    if (document.getElementById('toggleChoux')?.checked) sauces.push('Sauce');
    if (document.getElementById('toggleMayo')?.checked) sauces.push('Mayonnaise');
    if (document.getElementById('togglePiment')?.checked) sauces.push('Ketchup');

    const extras = [];
    let extraCost = 0;
    if (document.getElementById('toggleExtraBanane')?.checked) {
      extras.push('+ Bananes');
      extraCost += 1000;
    }
    if (document.getElementById('toggleExtraShikwague')?.checked) {
      extras.push('+ Shikwague');
      extraCost += 500;
    }

    const pimentChoice = document.querySelector('input[name="detailPiment"]:checked')?.value || 'Piment Moyen 🟡';

    this.cart.push({
      dish: this.selectedDish,
      qty: this.currentQty,
      portion: 'standard',
      sauces: sauces,
      customDetails: `${pimentChoice}`,
      extras: extras,
      unitPrice: this.selectedDish.price + extraCost,
      totalPrice: (this.selectedDish.price + extraCost) * this.currentQty
    });

    this.showToast(`${this.currentQty}x ${this.selectedDish.name} personnalisé !`);
    this.updateCartBadge();
    this.switchScreen('screen-cart');
  }

  quickAdd(dishId) {
    const dish = this.dishes.find(d => d.id === dishId);
    if (!dish) return;

    this.cart.push({
      dish: dish,
      qty: 1,
      portion: 'standard',
      sauces: ['Sauce maison', 'Mayonnaise', 'Ketchup'],
      customDetails: 'Assaisonnement Maison',
      extras: [],
      unitPrice: dish.price,
      totalPrice: dish.price
    });

    this.showToast(`1x ${dish.name} ajouté !`);
    this.updateCartBadge();
  }

  updateCartBadge() {
    const total = this.cart.reduce((sum, i) => sum + i.qty, 0);
    const badge = document.getElementById('cartNavCount');
    if (badge) badge.innerText = total;
  }

  showToast(msg) {
    const toast = document.createElement('div');
    toast.style.cssText = 'position:fixed; bottom:74px; left:50%; transform:translateX(-50%); background:#8b4513; color:#fff; padding:9px 18px; border-radius:20px; font-size:12px; font-weight:700; z-index:9999; box-shadow:0 4px 15px rgba(139,69,19,0.3);';
    toast.innerText = `🍗 ${msg}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2200);
  }

  logout() {
    localStorage.removeItem('vom_session_v1');
    this.showToast('Déconnexion réussie');
    setTimeout(() => {
      window.location.href = './welcome.html';
    }, 600);
  }

  toggleInstructionsDropdown() {
    const header = document.getElementById('instructionsHeaderToggle');
    const body = document.getElementById('instructionsDropdownBody');
    if (header && body) {
      header.classList.toggle('open');
      body.classList.toggle('open');
    }
  }

  toggleSuggestionChip(chipText, element) {
    element.classList.toggle('selected');
    const input = document.getElementById('cartCustomerNote');
    if (!input) return;

    let currentNotes = input.value.split(', ').filter(s => s.trim() !== '');

    if (element.classList.contains('selected')) {
      if (!currentNotes.includes(chipText)) currentNotes.push(chipText);
    } else {
      currentNotes = currentNotes.filter(s => s !== chipText);
    }

    input.value = currentNotes.join(', ');
  }

  toggleCustomNoteInput() {
    const area = document.getElementById('customNoteInputArea');
    const input = document.getElementById('cartCustomerNote');
    if (area) {
      area.style.display = area.style.display === 'none' ? 'block' : 'none';
      if (area.style.display === 'block' && input) input.focus();
    }
  }

  setupListeners() {
    document.getElementById('searchFoodInput')?.addEventListener('input', (e) => {
      this.renderPopularDishes(e.target.value);
    });

    document.querySelectorAll('.toggle-custom-input').forEach(input => {
      input.addEventListener('change', () => this.calculateDetailTotal());
    });

    document.getElementById('btnSendChat')?.addEventListener('click', () => this.sendChatMessage());
    document.getElementById('chatInput')?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.sendChatMessage();
    });

    document.getElementById('avatarFileInput')?.addEventListener('change', (e) => {
      this.handleAvatarUpload(e);
    });

    document.getElementById('adminPinInputField')?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.verifyAdminPin();
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.vomApp = new VomFoodApp();
});
