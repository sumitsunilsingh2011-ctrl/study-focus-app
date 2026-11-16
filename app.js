// app.js - Student Focus SIM Cross-Platform Engine

document.addEventListener("DOMContentLoaded", () => {
  // Service Worker Registration for PWA installation
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch((err) => {
      console.warn("ServiceWorker registration failed:", err);
    });
  }

  // DOM Elements - Navigation
  const navItems = document.querySelectorAll(".nav-item");
  const viewPanels = document.querySelectorAll(".view-panel");

  // DOM Elements - Setup & Active Views
  const focusSetupCard = document.getElementById("focus-setup-card");
  const focusActiveCard = document.getElementById("focus-active-card");
  const targetSubjectInput = document.getElementById("target-subject");
  const customMinsInput = document.getElementById("custom-mins");
  const durationBtns = document.querySelectorAll(".btn-duration");
  const btnStartSession = document.getElementById("btn-start-session");

  // Active View Elements
  const headerStatus = document.getElementById("header-status");
  const headerStatusText = document.getElementById("header-status-text");
  const activeSubjectDisplay = document.getElementById("active-subject-display");
  const timerDisplay = document.getElementById("timer-display");
  const progressBar = document.getElementById("progress-bar");
  const distractionBreachCountDisplay = document.getElementById("distraction-breach-count");
  const btnFullscreenToggle = document.getElementById("btn-fullscreen-toggle");

  // Analytics Elements
  const totalSessionsVal = document.getElementById("total-sessions-val");
  const totalFocusMinsVal = document.getElementById("total-focus-mins");
  const totalBreachesVal = document.getElementById("total-breaches-val");

  // Breach Overlay Elements
  const breachOverlay = document.getElementById("breach-overlay");
  const btnBreachReturn = document.getElementById("btn-breach-return");

  // Constants
  const CIRCLE_CIRCUMFERENCE = 722; // 2 * PI * 115

  // Runtime State
  let selectedDurationMins = 15;
  let timerInterval = null;
  let wakeLock = null;
  let sessionState = {
    isLocked: false,
    endTime: 0,
    durationMins: 15,
    subject: "Deep Study Session",
    breachCount: 0
  };

  // 1. Navigation Controller
  navItems.forEach((item) => {
    item.addEventListener("click", () => {
      navItems.forEach((n) => n.classList.remove("active"));
      viewPanels.forEach((p) => p.classList.remove("active"));

      item.classList.add("active");
      const targetId = item.dataset.target;
      document.getElementById(targetId).classList.add("active");
    });
  });

  // 2. Duration Selector
  durationBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      durationBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      selectedDurationMins = parseInt(btn.dataset.mins, 10);
      customMinsInput.value = "";
    });
  });

  customMinsInput.addEventListener("input", (e) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val > 0) {
      durationBtns.forEach((b) => b.classList.remove("active"));
      selectedDurationMins = val;
    }
  });

  // 3. Load Persistent State & Analytics
  loadAnalytics();
  loadSessionState();

  function loadAnalytics() {
    const sessions = parseInt(localStorage.getItem("focus_total_sessions") || "0", 10);
    const mins = parseInt(localStorage.getItem("focus_total_mins") || "0", 10);
    const breaches = parseInt(localStorage.getItem("focus_total_breaches") || "0", 10);

    totalSessionsVal.textContent = sessions;
    totalFocusMinsVal.textContent = `${mins}m`;
    totalBreachesVal.textContent = breaches;
  }

  function saveAnalyticsIncrement(completedMins, breaches) {
    const prevSessions = parseInt(localStorage.getItem("focus_total_sessions") || "0", 10);
    const prevMins = parseInt(localStorage.getItem("focus_total_mins") || "0", 10);
    const prevBreaches = parseInt(localStorage.getItem("focus_total_breaches") || "0", 10);

    localStorage.setItem("focus_total_sessions", prevSessions + 1);
    localStorage.setItem("focus_total_mins", prevMins + completedMins);
    localStorage.setItem("focus_total_breaches", prevBreaches + breaches);
    loadAnalytics();
  }

  function loadSessionState() {
    const raw = localStorage.getItem("focus_sim_active_session");
    if (raw) {
      try {
        const saved = JSON.parse(raw);
        const now = Date.now();
        if (saved.isLocked && now < saved.endTime) {
          sessionState = saved;
          engageSessionUI(sessionState.subject, sessionState.durationMins, sessionState.endTime - now);
        } else {
          localStorage.removeItem("focus_sim_active_session");
        }
      } catch (e) {}
    }
  }

  // 4. Start Hardcore Session
  btnStartSession.addEventListener("click", () => {
    const subject = targetSubjectInput.value.trim() || "Deep Study Session";
    const now = Date.now();
    const durationMs = selectedDurationMins * 60 * 1000;
    const endTime = now + durationMs;

    sessionState = {
      isLocked: true,
      endTime: endTime,
      durationMins: selectedDurationMins,
      subject: subject,
      breachCount: 0
    };

    localStorage.setItem("focus_sim_active_session", JSON.stringify(sessionState));

    // Request Screen Wake Lock (Keeps mobile phone screen awake)
    requestScreenWakeLock();

    // Auto request fullscreen for immersive kiosk
    requestImmersiveFullscreen();

    engageSessionUI(subject, selectedDurationMins, durationMs);
  });

  function engageSessionUI(subject, durationMins, remainingMs) {
    focusSetupCard.style.display = "none";
    focusActiveCard.style.display = "block";
    activeSubjectDisplay.textContent = subject;
    distractionBreachCountDisplay.textContent = sessionState.breachCount;

    headerStatus.querySelector(".status-dot").classList.add("active");
    headerStatusText.textContent = "LOCKED";
    headerStatusText.style.color = "#ef4444";

    const totalMs = durationMins * 60 * 1000;
    let currentRemainingMs = remainingMs;

    if (timerInterval) clearInterval(timerInterval);

    renderTimer(currentRemainingMs, totalMs);

    timerInterval = setInterval(() => {
      currentRemainingMs -= 1000;
      if (currentRemainingMs <= 0) {
        clearInterval(timerInterval);
        handleSessionCompleted();
      } else {
        renderTimer(currentRemainingMs, totalMs);
      }
    }, 1000);
  }

  function renderTimer(ms, totalMs) {
    const totalSecs = Math.max(0, Math.floor(ms / 1000));
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    timerDisplay.textContent = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

    const fraction = ms / totalMs;
    const offset = CIRCLE_CIRCUMFERENCE - (fraction * CIRCLE_CIRCUMFERENCE);
    progressBar.style.strokeDashoffset = offset;
  }

  function handleSessionCompleted() {
    timerDisplay.textContent = "00:00";
    progressBar.style.strokeDashoffset = CIRCLE_CIRCUMFERENCE;

    saveAnalyticsIncrement(sessionState.durationMins, sessionState.breachCount);
    sessionState.isLocked = false;
    localStorage.removeItem("focus_sim_active_session");

    if (wakeLock) {
      wakeLock.release().catch(() => {});
      wakeLock = null;
    }

    playVictoryFanfare();
    alert("🎉 SUCCESS! You conquered your study session. Hardcore Kiosk lock disengaged.");

    focusActiveCard.style.display = "none";
    focusSetupCard.style.display = "block";
    headerStatus.querySelector(".status-dot").classList.remove("active");
    headerStatusText.textContent = "IDLE";
    headerStatusText.style.color = "#10b981";
  }

  // 5. Hardware Screen Wake Lock (Prevents Mobile phone sleep)
  async function requestScreenWakeLock() {
    if ("wakeLock" in navigator) {
      try {
        wakeLock = await navigator.wakeLock.request("screen");
        document.getElementById("session-wake-status").textContent = "Active";
      } catch (err) {
        document.getElementById("session-wake-status").textContent = "Standard";
      }
    }
  }

  // 6. Immersive Fullscreen Mode
  function requestImmersiveFullscreen() {
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  }

  btnFullscreenToggle.addEventListener("click", () => {
    if (!document.fullscreenElement) {
      requestImmersiveFullscreen();
      btnFullscreenToggle.textContent = "⏹️ Exit Fullscreen";
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        btnFullscreenToggle.textContent = "🖥️ Immersive Fullscreen";
      }
    }
  });

  // 7. Distraction Interceptor (Tab-switch / App-minimization / Mind-switch)
  document.addEventListener("visibilitychange", () => {
    if (sessionState.isLocked && document.hidden) {
      triggerFocusBreachAlert("App minimized or switched to another window!");
    }
  });

  window.addEventListener("blur", () => {
    if (sessionState.isLocked) {
      triggerFocusBreachAlert("Window lost focus!");
    }
  });

  function triggerFocusBreachAlert(reason) {
    sessionState.breachCount++;
    distractionBreachCountDisplay.textContent = sessionState.breachCount;
    localStorage.setItem("focus_sim_active_session", JSON.stringify(sessionState));

    // Play warning sound
    playSensoryAlarm();

    // Show breach popup
    breachOverlay.style.display = "flex";
  }

  btnBreachReturn.addEventListener("click", () => {
    breachOverlay.style.display = "none";
    requestImmersiveFullscreen();
  });

  // 8. Web Audio API Sound Synthesizer (Zero MP3 files needed)
  function playSensoryAlarm() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(650, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(250, ctx.currentTime + 0.35);

      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {}
  }

  function playVictoryFanfare() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const notes = [261.63, 329.63, 392.00, 523.25];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);
        gain.gain.setValueAtTime(0.2, ctx.currentTime + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + idx * 0.12 + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.12);
        osc.stop(ctx.currentTime + idx * 0.12 + 0.3);
      });
    } catch (e) {}
  }
});
