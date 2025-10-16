<script type="module">
// Minimaler Auth-Client
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const url  = document.querySelector('meta[name="supabase-url"]')?.content;
const anon = document.querySelector('meta[name="supabase-anon"]')?.content;

if (!url || !anon) console.warn("Supabase Meta-Tags fehlen!");

export const supabase = createClient(url, anon, {
  auth: {
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: "vereint.auth",
  }
});

// Session in <body data-auth="in|out"> spiegeln (für UI/Nav)
function setAuthFlag(isIn){ document.body.dataset.auth = isIn ? "in" : "out"; }
const { data: { session } } = await supabase.auth.getSession();
setAuthFlag(!!session);

supabase.auth.onAuthStateChange((_evt, s) => {
  setAuthFlag(!!s);
  // PWA-Tabs synchronisieren
  try { localStorage.setItem("vereint.auth.changed", String(Date.now())); } catch(e){}
});

// Helfer
export async function signInWithEmail(email) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: location.origin + "/auth/account.html"
    }
  });
  if (error) throw error;
}

export async function signInWithProvider(provider) {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: location.origin + "/auth/account.html" }
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  location.href = "/auth/login.html";
}

// Guard: auf geschützten Seiten nutzen
export async function requireAuth() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) location.replace("/auth/login.html?next=" + encodeURIComponent(location.pathname));
  return session;
}
</script>
