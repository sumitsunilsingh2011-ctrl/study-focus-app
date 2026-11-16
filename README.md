# Focus SIM - Cross-Platform Study Kiosk (Mobile & Laptop)

A unified, installable **Progressive Web App (PWA)** engineered for students to eliminate digital distractions across both **Laptops** and **Mobile Phones (Android / iOS)**.

---

## 📱 How to Run & Install on Mobile Phone (Android / iPhone)

1. Connect your phone and laptop to the **same Wi-Fi network**.
2. On your laptop, double-click:
   📁 `launch_app.bat`
3. The terminal will display your mobile link, for example:
   ```text
   http://192.168.1.X:8080
   ```
4. On your phone's browser (Chrome on Android, or Safari on iPhone), open that URL.
5. Tap **Install App**:
   * **Android (Chrome)**: Tap the **"Install"** prompt at the bottom, or tap the three dots **⋮** > **"Add to Home screen"** / **"Install app"**.
   * **iPhone (Safari)**: Tap the **Share** button (box with arrow) > **"Add to Home Screen"**.
6. The app now lives on your phone's home screen with its custom **SIM icon**, running in fullscreen with no browser address bars!

---

## 💻 How to Run & Install on Laptop (Windows / Mac)

1. Double-click `launch_app.bat`.
2. Chrome will open `http://localhost:8080`.
3. In Chrome's URL address bar on the right side, click the **"Install App"** button (looks like a computer screen or `(+)` icon).
4. Click **Install**.
5. Focus SIM is now an independent desktop application pinned to your Windows Taskbar/Start menu with its own dedicated window.

---

## 🛡️ Built-in Hardcore Mobile & Laptop Features

* **Hardware Screen Wake Lock API**: When a study session starts on mobile, it holds the display awake. The phone functions as a dedicated study desk terminal without turning off.
* **Mind-Switch & Distraction Interceptor**:
  If the student tries to minimize the app on their phone, swipe up to go home, switch tabs, or open Instagram:
  - The app catches the `visibilitychange` / `blur` event immediately.
  - Sounds a loud sensory warning alarm directly through the speakers.
  - Increments the "Distraction Breaches" counter.
  - Pops the **🚨 FOCUS BREACH INTERCEPTED** warning screen: *"Ruk jao! Mind switch hua aur Instagram kholne lage?"*
* **Persistent Study State**: Sessions survive app reloads and browser refreshes using persistent local storage.
* **Completely Offline**: Powered by `sw.js` (Service Worker), so it works anywhere even without active internet.
