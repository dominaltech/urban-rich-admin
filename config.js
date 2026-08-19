// URBAN RICH ADMIN CONFIGURATION

window.UR_CONFIG = {
  // Supabase Database & Auth Credentials
  SUPABASE_URL: "https://vemlqojqluimqegryxug.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlbWxxb2pxbHVpbXFlZ3J5eHVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5Nzc3NzksImV4cCI6MjEwMTU1Mzc3OX0.bmwk1KkJ8LMCQAhlZQzThShSQhcXqrkPVNGj-z8vPes",

  // Cashfree Payment Gateway Credentials (READ FROM VERCEL ENV VARS)
  CASHFREE_APP_ID: (typeof process !== 'undefined' && process.env && process.env.CASHFREE_APP_ID) || "",
  CASHFREE_SECRET_KEY: (typeof process !== 'undefined' && process.env && process.env.CASHFREE_SECRET_KEY) || "",
  CASHFREE_ENV: "PRODUCTION",

  // Web Push Notifications VAPID Keys
  VAPID_SUBJECT: "mailto:support@urbanrichshop.com",
  VAPID_PUBLIC_KEY: "BLAiHhe09D65RzlO2uYBZlskrAI7M3Xg4Bu5vHN4jLjlP6Ss5aEvViiTwOPgWLQqbAn27_ATJtaOmlreHSjdFTc",
  VAPID_PRIVATE_KEY: "LjCWxk2jZ7GDuOeKB7c98keCK2HmyROBzK8h99uQz84"
};
