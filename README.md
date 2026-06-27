# BGMI Friends Vault (Vanilla HTML/CSS/JS Edition)

Welcome to the **BGMI Friends Vault**, converted from React/TypeScript into a fully optimized, lightweight, and modern **pure HTML, CSS, and Vanilla JavaScript** website.

This edition features no complex bundlers, no build steps, and zero dependencies, making it extremely fast, portable, and ready for deployment directly to static hosts such as **GitHub Pages**, **Vercel**, **Netlify**, or **Firebase Hosting**.

---

## 🎨 Visual Identity & Architecture

- **Theme & Typography**: Customized tactical combat dark mode, featuring a dark canvas, gold/amber accents, high-contrast statuses, paired custom fonts (`Space Grotesk` and `JetBrains Mono`), and fluid layout spacing.
- **Tailwind CSS CDN**: Powered by standard Tailwind CSS loaded on-the-fly via CDN, customized with theme colors matching Battlegrounds Mobile India styling.
- **Firebase Web v10 Modular SDK**: Core features connect directly to Firebase services using official modular ES module CDN imports.

---

## 📁 Project File Map

The folder contains the following clean, standard, modular static files:

- `index.html`: Tactical Command Dashboard, aggregating real-time stats and Spotlight MVP selections.
- `login.html`: Secured Admin login portal with visual credential panels.
- `admin.html`: High-fidelity player registrations, edit forms, and image uploads.
- `friends.html`: Interactive squad roster list with responsive real-time filters and detailed dossiers.
- `leaderboard.html`: Live combat rankings organized by K/D ratio, wins, or match throughput.
- `style.css`: Custom tactical grid textures, glassmorphic styles, custom scrollbars, and micro-pulse indicators.
- `firebase.js`: Service initialization and database connections mapping.
- `script.js`: Global session handlers and landing statistics hydrator.
- `login.js`: Authentication state evaluator and login forms.
- `admin.js`: Administrative panel route protectors, edit controllers, and media upload tasks.
- `friends.js`: Real-time list syncing, search indexes, status updates, and detail modal hydrators.
- `leaderboard.js`: Ranking sorter, live pod indicators, and Win Rate math.

---

## 🔐 Demo Credentials

To access the secure **Admin Control Center**:
- **Email**: `admin@squad.com`
- **Password**: `squadpassword`

---

## ⚙️ Running Locally

Because ES Modules require a valid origins context for cross-origin security, **you must open the project via a local web server** instead of double-clicking the raw HTML file:

### Option A: VS Code Live Server (Recommended)
1. Open the project folder in VS Code.
2. Install the **Live Server** extension.
3. Click **Go Live** in the status bar.

### Option B: Python SimpleHTTPServer
Run this command inside your terminal at the project root directory:
```bash
python -m http.server 3000
```
Open `http://localhost:3000` in your web browser.

### Option C: Node.js (Vite / Static Server)
Run `npm run dev` in this directory to spin up the local server instantly.
