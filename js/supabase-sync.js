const SUPABASE_URL = 'https://eisjruqyconbjhhrivue.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpc2pydXF5Y29uYmpoaHJpdnVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ2NDg1OTQsImV4cCI6MjExMDIyNDU5NH0.JnKA9fuUUA53p5O723O4gUao-Mf8vzmaEhkMHaG12G8';

const supabaseClient = window.supabase
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

function setAuthUI(user) {
  const outBox = document.getElementById("authLoggedOut");
  const inBox = document.getElementById("authLoggedIn");
  const emailEl = document.getElementById("authUserEmail");
  const openBtn = document.getElementById("openAuthBtn");

  if (outBox) outBox.hidden = !!user;
  if (inBox) inBox.hidden = !user;
  if (user && emailEl) emailEl.textContent = user.email;
  if (openBtn) {
    openBtn.textContent = user ? `Pass: ${user.email}` : "Field Trip Pass (Log in)";
  }
}

function setAuthStatus(msg, isErr = false) {
  const el = document.getElementById("authStatus");
  if (!el) return;
  el.textContent = msg;
  el.style.color = isErr ? "#c4472d" : "#2f6fb5";
}

async function loadCloudProgress(userId) {
  if (!supabaseClient) return null;
  const { data, error } = await supabaseClient
    .from("player_progress")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error && error.code === "PGRST116") {
    const initialRow = {
      user_id: userId,
      player: "",
      robot_name: "Echo",
      kid: { skin: "#d9a074", shirt: "#2f6fb5" },
      stars: 0,
      visits: {},
      owned: ["c-silver", "e-cyan", "h-none", "g-none"],
      look: { color: "#c9d3e6", eyes: "#5ef2ff", hat: "none", gear: "none" },
    };
    const { error: insertErr } = await supabaseClient.from("player_progress").insert(initialRow);
    if (insertErr) throw insertErr;
    return initialRow;
  }
  if (error) throw error;
  return data;
}

async function saveCloudProgress(S) {
  if (!supabaseClient) return;
  try {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return;

    const { error } = await supabaseClient
      .from("player_progress")
      .update({
        player: S.player,
        robot_name: S.robotName,
        kid: S.kid,
        stars: S.stars,
        visits: S.visits,
        owned: S.owned,
        look: S.look,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    if (error) console.error("Supabase save error:", error.message);
  } catch (err) {
    console.error("Supabase save exception:", err);
  }
}

window.handleSignUp = async function () {
  if (!supabaseClient) {
    return setAuthStatus("Error: Supabase library not loaded. Check your internet or CDN script.", true);
  }
  const email = (document.getElementById("authEmail")?.value || "").trim();
  const password = document.getElementById("authPassword")?.value || "";

  if (!email || password.length < 6) {
    return setAuthStatus("Enter a valid email and a password of at least 6 characters.", true);
  }

  setAuthStatus("Creating account…");
  try {
    const { data, error } = await supabaseClient.auth.signUp({ email, password });
    if (error) return setAuthStatus("Supabase error: " + error.message, true);

    if (data.user) {
      if (data.session) {
        const cloudData = await loadCloudProgress(data.user.id);
        if (window.applyCloudState) window.applyCloudState(cloudData);
        setAuthUI(data.user);
        setAuthStatus("Account created & synced!");
        setTimeout(() => document.getElementById("authDialog")?.close(), 600);
      } else {
        setAuthStatus("Created! Turn off 'Confirm email' in Supabase Auth → Providers → Email, then click Log in.");
      }
    }
  } catch (err) {
    setAuthStatus("Error: " + (err.message || err), true);
  }
};

window.handleSignIn = async function () {
  if (!supabaseClient) {
    return setAuthStatus("Error: Supabase library not loaded. Check your internet or CDN script.", true);
  }
  const email = (document.getElementById("authEmail")?.value || "").trim();
  const password = document.getElementById("authPassword")?.value || "";

  if (!email || !password) {
    return setAuthStatus("Enter both email and password.", true);
  }

  setAuthStatus("Logging in…");
  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) return setAuthStatus("Supabase error: " + error.message, true);

    const cloudData = await loadCloudProgress(data.user.id);
    if (window.applyCloudState) window.applyCloudState(cloudData);
    setAuthUI(data.user);
    setAuthStatus("Logged in!");
    setTimeout(() => document.getElementById("authDialog")?.close(), 500);
  } catch (err) {
    setAuthStatus("Error: " + (err.message || err), true);
  }
};

window.handleSignOut = async function () {
  if (supabaseClient) await supabaseClient.auth.signOut();
  localStorage.removeItem("silent-explorers-v2");
  location.reload();
};

if (supabaseClient) {
  supabaseClient.auth.getSession().then(({ data: { session } }) => {
    setAuthUI(session ? session.user : null);
  });
}