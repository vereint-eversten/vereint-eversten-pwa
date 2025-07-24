
const supabase = supabase.createClient(
  'https://ntccnkvpxrpwgxmiherf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50Y2Nua3ZweHJwd2d4bWloZXJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4MzgyODYsImV4cCI6MjA2ODQxNDI4Nn0.JncC2HbFHONVid0aRYXfFohMu5D_ORVwj0XgyQg3khc'
);

supabase.auth.getSession().then(({ data: { session } }) => {
  if (session) {
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('after-login').classList.remove('hidden');
  }
});

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("register-btn")?.addEventListener("click", register);
  document.getElementById("login-btn")?.addEventListener("click", login);
  document.getElementById("logout-btn")?.addEventListener("click", logout);
  document.getElementById("toggle-register-form")?.addEventListener("click", toggleRegisterForm);
  document.getElementById("password-reset-btn")?.addEventListener("click", passwordReset);
});

function toggleRegisterForm() {
  document.getElementById('register-form').classList.toggle('hidden');
  document.getElementById('login-form').classList.toggle('hidden');
  document.getElementById('status-msg').innerText = "";
}

async function login() {
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    document.getElementById('status-msg').innerText = "❌ Login fehlgeschlagen: " + error.message;
  } else {
    window.location.href = "/dashboard.html";
  }
}

async function register() {
  const email = document.getElementById('register-email').value;
  const password = document.getElementById('register-password').value;
  const name = document.getElementById('register-name').value;
  const birthyear = document.getElementById('register-birthyear').value;
  const ds = document.getElementById('register-datenschutz').checked;
  const foto = document.getElementById('register-foto').checked;
  const haftung = document.getElementById('register-haftung').checked;
  if (!ds || !foto || !haftung) {
    document.getElementById('status-msg').innerText = "⚠️ Bitte alle Einverständnisse bestätigen.";
    return;
  }
  const { data: signUpData, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    document.getElementById('status-msg').innerText = "❌ Registrierung fehlgeschlagen: " + error.message;
  } else {
    const user_id = signUpData?.user?.id;
    const { error: insertError } = await supabase.from('user_profiles').insert([{
      user_id,
      email,
      vorname: name,
      geburtsjahr: birthyear,
      rolle: 'wartend',
      datenschutz: ds,
      foto_ok: foto,
      haftung_ok: haftung
    }]);
    if (insertError) {
      document.getElementById('status-msg').innerText = "⚠️ Profil konnte nicht gespeichert werden: " + insertError.message;
    } else {
      document.getElementById('status-msg').innerText = "✅ Registrierung erfolgreich. Bitte E-Mail bestätigen.";
      toggleRegisterForm();
    }
  }
}

async function passwordReset() {
  const email = prompt("Bitte gib deine E-Mail-Adresse ein:");
  if (email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/modules/einstellungen.html"
    });
    if (error) {
      document.getElementById('status-msg').innerText = "❌ Fehler beim Senden: " + error.message;
    } else {
      document.getElementById('status-msg').innerText = "📧 Passwort-Reset-Link gesendet.";
    }
  }
}

async function logout() {
  await supabase.auth.signOut();
  document.getElementById('status-msg').innerText = "🔓 Erfolgreich ausgeloggt.";
  document.getElementById('after-login').classList.add('hidden');
  document.getElementById('login-form').classList.remove('hidden');
}
