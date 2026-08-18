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

  // 6. FETCH ADMIN CATEGORIES ROUTINE
  window.fetchAdminCategories = async function() {
    const client = window.urSbClient || window.adminSupabase || createAdminSupabaseClient();
    if (!client) {
      return { data: [], error: { message: 'Supabase client not initialized' } };
    }
    try {
      const { data, error } = await client
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true });
      return { data: data || [], error };
    } catch (err) {
      console.error('fetchAdminCategories error:', err);
      return { data: [], error: err };
    }
  };

  // 7. FETCH ADMIN ORDERS ROUTINE
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

  // 8. FETCH PRODUCT GALLERY IMAGES
  window.fetchProductImages = async function(productId) {
    const client = window.urSbClient || window.adminSupabase || createAdminSupabaseClient();
    if (!client || !productId) return { data: [], error: null };
    try {
      const { data, error } = await client
        .from('product_images')
        .select('*')
        .eq('product_id', productId)
        .order('display_order', { ascending: true });
      return { data: data || [], error };
    } catch (err) {
      console.error('fetchProductImages error:', err);
      return { data: [], error: err };
    }
  };

  // 9. TOAST UTILITY
  window.adminToast = function(msg, isError = false) {
    let container = document.getElementById('adminToastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'adminToastContainer';
      container.style.cssText = 'position:fixed; top:20px; right:20px; z-index:99999; display:flex; flex-direction:column; gap:10px; max-width:380px;';
      document.body.appendChild(container);
    }
    let toast = document.createElement('div');
    const bg = isError ? '#d90429' : '#111';
    toast.style.cssText = `background:${bg}; color:#fff; padding:12px 20px; border-radius:6px; font-weight:600; font-size:0.85rem; box-shadow:0 4px 16px rgba(0,0,0,0.2); animation:fadeIn 0.3s ease;`;
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4500);
  };

  // 10. DRAWER CONTROLS
  window.openDrawer = function() {
    let drawer = document.getElementById('adminDrawer');
    if (drawer) drawer.classList.add('active');
  };
  window.closeDrawer = function() {
    let drawer = document.getElementById('adminDrawer');
    if (drawer) drawer.classList.remove('active');
  };

  // 11. ROBUST SUPABASE STORAGE UPLOADER (SUPPORTS BOTH RAW FILE AND HTML INPUT)
  window.uploadFileToStorage = async function(fileOrInput, bucket = 'product-images', folder = 'products') {
    let file = null;
    if (fileOrInput instanceof File) {
      file = fileOrInput;
    } else if (fileOrInput && fileOrInput.files && fileOrInput.files.length > 0) {
      file = fileOrInput.files[0];
    }

    if (!file) return null;

    const client = window.urSbClient || window.adminSupabase || createAdminSupabaseClient();
    if (!client) {
      console.warn('Supabase client unavailable. Falling back to default asset.');
      return 'images/logo.jpg';
    }

    // Clean file extension & safe filename
    const originalExt = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanExt = originalExt.length > 0 ? originalExt : 'jpg';
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 30);
    const filePath = `${folder}/${timestamp}_${randomStr}_${sanitizedName}.${cleanExt}`;

    try {
      const { data, error: uploadError } = await client.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type || 'image/jpeg'
        });

      if (uploadError) {
        console.error(`Storage upload error (${bucket}):`, uploadError);
        window.adminToast(`Storage Upload Error: ${uploadError.message || 'Check bucket & RLS settings'}`, true);
        return null;
      }

      const { data: publicUrlData } = client.storage
        .from(bucket)
        .getPublicUrl(filePath);

      if (publicUrlData && publicUrlData.publicUrl) {
        return publicUrlData.publicUrl;
      }
      return null;
    } catch (err) {
      console.error('Storage Exception:', err);
      window.adminToast(`Upload failed: ${err.message || 'Network error'}`, true);
      return null;
    }
  };

  // Backwards compatibility alias
  window.uploadProductImage = async function(fileInput) {
    const url = await window.uploadFileToStorage(fileInput, 'product-images', 'products');
    return url || 'images/logo.jpg';
  };

  // 12. MULTI-FILE UPLOADER FOR UNLIMITED GALLERY & BULK UPLOADS
  window.uploadMultipleFiles = async function(fileList, bucket = 'product-images', folder = 'products', onProgress = null) {
    const files = Array.from(fileList || []);
    if (files.length === 0) return [];

    const results = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (onProgress && typeof onProgress === 'function') {
        onProgress(i + 1, files.length, file.name);
      }
      const url = await window.uploadFileToStorage(file, bucket, folder);
      results.push({
        file: file,
        fileName: file.name,
        url: url,
        success: !!url
      });
    }
    return results;
  };

  // 13. SYNC / SAVE PRODUCT GALLERY IMAGES TO DATABASE
  window.saveProductGalleryImages = async function(productId, imageUrls) {
    const client = window.urSbClient || window.adminSupabase || createAdminSupabaseClient();
    if (!client || !productId || !imageUrls || imageUrls.length === 0) return { count: 0 };

    try {
      const rows = imageUrls.map((url, idx) => ({
        product_id: productId,
        image_url: url,
        display_order: idx + 1,
        created_at: new Date()
      }));

      const { data, error } = await client
        .from('product_images')
        .insert(rows);

      if (error) {
        console.error('Error inserting product gallery images:', error);
        return { error };
      }
      return { count: rows.length, data };
    } catch (err) {
      console.error('saveProductGalleryImages exception:', err);
      return { error: err };
    }
  };

  // 14. STORE DELIVERY & SHIPPING SETTINGS MANAGEMENT
  window.fetchStoreDeliverySettings = async function() {
    const client = window.urSbClient || window.adminSupabase || createAdminSupabaseClient();
    if (!client) return { delivery_fee: 60, free_shipping_above: 999 };

    try {
      const { data, error } = await client
        .from('store_settings')
        .select('*')
        .eq('id', 'default')
        .maybeSingle();

      if (error || !data) {
        return { delivery_fee: 60, free_shipping_above: 999 };
      }
      return data;
    } catch(err) {
      console.error('fetchStoreDeliverySettings error:', err);
      return { delivery_fee: 60, free_shipping_above: 999 };
    }
  };

  window.saveStoreDeliverySettings = async function(deliveryFee, freeShippingAbove) {
    const client = window.urSbClient || window.adminSupabase || createAdminSupabaseClient();
    if (!client) {
      window.adminToast('Supabase client not connected');
      return { error: 'Not connected' };
    }

    try {
      const fee = parseFloat(deliveryFee) || 0;
      const threshold = parseFloat(freeShippingAbove) || 0;

      const { data, error } = await client
        .from('store_settings')
        .upsert({
          id: 'default',
          delivery_fee: fee,
          free_shipping_above: threshold,
          updated_at: new Date()
        }, { onConflict: 'id' });

      if (error) {
        console.error('saveStoreDeliverySettings error:', error);
        window.adminToast('Error saving delivery charges: ' + error.message);
        return { error };
      }

      window.adminToast(`✓ Delivery Charge set to ₹${fee} (Free above ₹${threshold}) applied store-wide!`);
      return { success: true, data };
    } catch(err) {
      console.error('saveStoreDeliverySettings exception:', err);
      window.adminToast('Error saving delivery charges: ' + err.message);
      return { error: err };
    }
  };

  window.initDeliverySettingsUI = async function() {
    const feeInput = document.getElementById('settingDeliveryFee');
    const thresholdInput = document.getElementById('settingFreeShippingAbove');
    if (!feeInput && !thresholdInput) return;

    const settings = await window.fetchStoreDeliverySettings();
    if (feeInput && settings.delivery_fee !== undefined) {
      feeInput.value = settings.delivery_fee;
    }
    if (thresholdInput && settings.free_shipping_above !== undefined) {
      thresholdInput.value = settings.free_shipping_above;
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
    window.initDeliverySettingsUI();
  });

  document.addEventListener('adminSupabaseReady', function() {
    window.initDeliverySettingsUI();
  });

})();
