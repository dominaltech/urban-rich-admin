// URBAN RICH ADMIN DASHBOARD CORE JAVASCRIPT SYSTEM

(function() {
  'use strict';

  // 1. EMBEDDED SUPABASE CREDENTIALS
  const SUPABASE_URL = "https://vemlqojqluimqegryxug.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlbWxxb2pxbHVpbXFlZ3J5eHVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5Nzc3NzksImV4cCI6MjEwMTU1Mzc3OX0.bmwk1KkJ8LMCQAhlZQzThShSQhcXqrkPVNGj-z8vPes";

  window.UR_CONFIG = window.UR_CONFIG || {};
  window.UR_CONFIG.SUPABASE_URL = SUPABASE_URL;
  window.UR_CONFIG.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;
  window.UR_CONFIG.VAPID_PUBLIC_KEY = "BLAiHhe09D65RzlO2uYBZlskrAI7M3Xg4Bu5vHN4jLjlP6Ss5aEvViiTwOPgWLQqbAn27_ATJtaOmlreHSjdFTc";

  window.urSbClient = null;
  window.adminSupabase = null;

  function createAdminSupabaseClient() {
    if (window.adminSupabase) return window.adminSupabase;
    if (window.supabase && typeof window.supabase.createClient === 'function') {
      try {
        const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        window.urSbClient = client;
        window.adminSupabase = client;
        console.log('Admin Supabase client initialized successfully');
        return client;
      } catch (e) {
        console.error('Error creating admin Supabase client:', e);
      }
    }
    return null;
  }

  // Synchronous attempt
  createAdminSupabaseClient();

  // Retry loop for CDN script evaluation
  let retryCount = 0;
  const initInterval = setInterval(function() {
    if (createAdminSupabaseClient() || retryCount > 20) {
      clearInterval(initInterval);
      document.dispatchEvent(new CustomEvent('adminSupabaseReady'));
    }
    retryCount++;
  }, 100);

  // 2. VAPID BASE64 HELPER CONVERTER
  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // 3. ALLOW PUSH NOTIFICATIONS HANDLER FOR ADMIN SETTINGS (REGISTER DEVICE TO SUPABASE)
  window.requestAdminNotificationPermission = async function() {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      window.adminToast('Web Push Notifications not supported in this browser.');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const reg = await navigator.serviceWorker.ready;
        const vapidPublicKey = window.UR_CONFIG.VAPID_PUBLIC_KEY;

        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
        });

        const client = window.urSbClient || window.adminSupabase || createAdminSupabaseClient();
        if (client) {
          await client.from('admin_push_subscriptions').upsert({
            user_agent: navigator.userAgent,
            endpoint: sub.endpoint,
            keys: JSON.parse(JSON.stringify(sub.toJSON().keys)),
            updated_at: new Date()
          }, { onConflict: 'endpoint' });
        }

        window.adminToast('Order Notifications Allowed & Device Registered!');
        const btn = document.getElementById('pushNotifyBtn');
        if (btn) {
          btn.textContent = 'NOTIFICATIONS ENABLED ✓';
          btn.style.background = '#2b9348';
        }
      } else {
        window.adminToast('Notification permission denied.');
      }
    } catch(err) {
      console.error(err);
      window.adminToast('Notification registration error: ' + err.message);
    }
  };

  // 4. FETCH ADMIN USERS (PROFILES TABLE QUERY WITH ALL COLUMNS)
  window.fetchAdminUsers = async function() {
    const client = window.urSbClient || window.adminSupabase || createAdminSupabaseClient();
    if (!client) {
      return { data: [], error: { message: 'Supabase client not initialized' } };
    }
    try {
      const { data, error } = await client
        .from('profiles')
        .select('id, full_name, phone, role, default_address, address, pincode, created_at, updated_at')
        .order('created_at', { ascending: false });
      return { data: data || [], error };
    } catch (err) {
      console.error('fetchAdminUsers error:', err);
      return { data: [], error: err };
    }
  };

  // 5. FETCH ADMIN PRODUCTS ROUTINE
  window.fetchAdminProducts = async function() {
    const client = window.urSbClient || window.adminSupabase || createAdminSupabaseClient();
    if (!client) {
      return { data: [], error: { message: 'Supabase client not initialized' } };
    }
    try {
      const { data, error } = await client
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      return { data: data || [], error };
    } catch (err) {
      console.error('fetchAdminProducts error:', err);
      return { data: [], error: err };
    }
  };

  // 6. FETCH ADMIN ORDERS ROUTINE
  window.fetchAdminOrders = async function() {
    const client = window.urSbClient || window.adminSupabase || createAdminSupabaseClient();
    if (!client) {
      return { data: [], error: { message: 'Supabase client not initialized' } };
    }
    try {
      const { data, error } = await client
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      return { data: data || [], error };
    } catch (err) {
      console.error('fetchAdminOrders error:', err);
      return { data: [], error: err };
    }
  };

  // 7. TOAST UTILITY
  window.adminToast = function(msg) {
    let container = document.getElementById('adminToastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'adminToastContainer';
      container.style.cssText = 'position:fixed; top:20px; right:20px; z-index:99999; display:flex; flex-direction:column; gap:10px;';
      document.body.appendChild(container);
    }
    let toast = document.createElement('div');
    toast.style.cssText = 'background:#111; color:#fff; padding:12px 20px; border-radius:6px; font-weight:600; font-size:0.85rem; box-shadow:0 4px 12px rgba(0,0,0,0.15);';
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  };

  // 8. DRAWER CONTROLS
  window.openDrawer = function() {
    let drawer = document.getElementById('adminDrawer');
    if (drawer) drawer.classList.add('active');
  };
  window.closeDrawer = function() {
    let drawer = document.getElementById('adminDrawer');
    if (drawer) drawer.classList.remove('active');
  };

  // 9. STORAGE IMAGE UPLOADER
  window.uploadProductImage = async function(fileInput) {
    if (!fileInput.files || fileInput.files.length === 0) return null;
    const client = window.urSbClient || window.adminSupabase;
    if (!client) return 'images/logo.jpg';

    const file = fileInput.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `products/${fileName}`;

    try {
      const { error: uploadError } = await client.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        return 'images/logo.jpg';
      }

      const { data } = client.storage
        .from('product-images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (err) {
      console.error(err);
      return 'images/logo.jpg';
    }
  };

  document.addEventListener('DOMContentLoaded', function() {
    if ("Notification" in window && Notification.permission === "granted") {
      const btn = document.getElementById('pushNotifyBtn');
      if (btn) {
        btn.textContent = 'NOTIFICATIONS ENABLED ✓';
        btn.style.background = '#2b9348';
      }
    }
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js')
        .then(reg => console.log('Admin SW registered:', reg))
        .catch(err => console.error('Admin SW registration failed:', err));
    }
  });

})();
