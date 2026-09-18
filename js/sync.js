// ============================================================
// VOM FOOD — SYNCHRONISATION TEMPS RÉEL (client ⇄ serveur ⇄ admin)
// À inclure AVANT app.js / admin.js dans chaque page.
// Rend le localStorage « multi-appareils » : chaque écriture est
// envoyée au serveur, qui la diffuse aux autres navigateurs.
// ============================================================
(function () {
  var SHARED_KEYS = [
    'vom_restaurant_settings_v1',
    'vom_admin_dishes_v1',
    'vom_admin_custom_v1',
    'vom_orders_db_v1',
    'vom_chat_threads_v1',
    'vom_reviews_db_v1',
    'vom_promotions_v1',
    'vom_delivery_settings_v1',
    'vom_admin_schedule_v1',
    'vom_restaurant_status_v1',
    'vom_security_settings_v1',
    'vom_payment_settings_v1',
    'vom_categories_v1',
    'vom_appearance_settings_v1',
    'vom_general_config_v1'
  ];

  var applying = false;   // évite de renvoyer au serveur ce qu'on vient de recevoir
  var sseAlive = false;   // true quand le flux temps réel répond

  function post(key, value) {
    try {
      fetch('./api/set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: key, value: value })
      }).catch(function () {});
    } catch (e) {}
  }

  function fireStorageEvent(key, newValue) {
    try {
      var ev = new StorageEvent('storage', { key: key, newValue: newValue });
      window.dispatchEvent(ev);
    } catch (e) {
      try {
        var ev2 = document.createEvent('StorageEvent');
        ev2.initStorageEvent('storage', false, false, key, null, newValue, location.href, localStorage);
        window.dispatchEvent(ev2);
      } catch (e2) {}
    }
  }

  function applyRemote(remote) {
    applying = true;
    try {
      for (var k in remote) {
        if (!Object.prototype.hasOwnProperty.call(remote, k)) continue;
        var v = remote[k];
        if (v === null || typeof v === 'undefined') continue;
        if (localStorage.getItem(k) !== v) {
          localStorage.setItem(k, v);
          fireStorageEvent(k, v);
        }
      }
    } finally {
      applying = false;
    }
  }

  // ---- 1) Intercepter les écritures locales pour les envoyer au serveur ----
  var origSetItem = Storage.prototype.setItem;
  Storage.prototype.setItem = function (k, v) {
    origSetItem.call(this, k, v);
    if (!applying && SHARED_KEYS.indexOf(k) !== -1) {
      post(k, v);
    }
  };

  var origRemoveItem = Storage.prototype.removeItem;
  Storage.prototype.removeItem = function (k) {
    origRemoveItem.call(this, k);
    if (!applying && SHARED_KEYS.indexOf(k) !== -1) {
      post(k, null);
    }
  };

  // ---- 2) Au chargement : récupérer l'état du serveur ----
  function initialSync() {
    fetch('./api/state', { cache: 'no-store' })
      .then(function (r) { return r.json(); })
      .then(function (state) {
        var remoteKeys = Object.keys(state || {});
        if (remoteKeys.length === 0) {
          // Serveur vide : on le remplit avec nos données locales
          SHARED_KEYS.forEach(function (k) {
            var v = localStorage.getItem(k);
            if (v != null) post(k, v);
          });
        } else {
          applyRemote(state);
        }
      })
      .catch(function () {});
  }

  // ---- 3) Flux temps réel (SSE) ----
  function openSSE() {
    try {
      var es = new EventSource('./api/events');
      es.onmessage = function (e) {
        sseAlive = true;
        try {
          var d = JSON.parse(e.data);
          if (d.type === 'hello') {
            applyRemote(d.state || {});
          } else if (d.type === 'update') {
            var patch = {};
            patch[d.key] = d.value;
            applyRemote(patch);
          }
        } catch (err) {}
      };
      es.onerror = function () {
        sseAlive = false;
        es.close();
        setTimeout(openSSE, 3000);
      };
    } catch (e) {
      sseAlive = false;
    }
  }

  // ---- 4) Filet de sécurité : sondage léger de version (fiable derrière tout proxy) ----
  var lastRev = -1;
  setInterval(function () {
    fetch('./api/version', { cache: 'no-store' })
      .then(function (r) { return r.json(); })
      .then(function (v) {
        if (v && v.rev !== lastRev) {
          lastRev = v.rev;
          fetch('./api/state', { cache: 'no-store' })
            .then(function (r2) { return r2.json(); })
            .then(function (state) { applyRemote(state || {}); })
            .catch(function () {});
        }
      })
      .catch(function () {});
  }, 2000);

  initialSync();
  openSSE();

  window.VomSync = { post: post, applyRemote: applyRemote, rawSetItem: origSetItem, rawRemoveItem: origRemoveItem };
})();
