# 🚀 SSH Command Studio

**SSH Command Studio** adalah aplikasi desktop modern berbasis Electron & SQLite yang dirancang khusus untuk mempermudah eksekusi perintah remote SSH secara instan melalui **Custom Action Buttons**, **CLI Prompt Bar**, dan **Stateful Interactive PTY Shell Session**.

---

## ✨ Fitur Utama

- ⚡ **Stateful Interactive SSH PTY Shell**:
  Sesi SSH terus terbuka secara persisten. Perintah seperti `cd`, `export VAR=val`, maupun script interaktif akan mempertahankan *state* direktori dan lingkungan remote secara sempurna.
- 🎯 **Single Dedicated Target Server**:
  Manajemen kredensial SSH Host tunggal yang terdedikasi. Mudah disimpan dan diperbarui melalui modal pengaturan.
- 🎨 **Custom SSH Action Buttons**:
  Buat tombol perintah pintas (misal: `systemctl restart nginx`, `docker ps`, `git pull`) dengan ikon, warna, dan deskripsi kustom.
- 💻 **Interactive CLI Command Bar**:
  Bar prompt internal yang dapat dibuka via tombol `/` untuk mengeksekusi perintah langsung atau membuat tombol baru secara cepat via perintah `/add "Nama Button" --cmd "perintah"`.
- 💾 **SQLite Persistence (`sql.js`)**:
  Semua konfigurasi target server dan daftar tombol action disimpan secara permanen di database lokal SQLite `%APPDATA%\command-button-studio\app_data.sqlite`.
- 🪟 **Silent Background Launcher**:
  Disediakan `run_app.bat` dan `run_app.vbs` untuk meluncurkan aplikasi desktop secara *100% silent* tanpa menyisakan jendela hitam Command Prompt.

---

## 📦 Persyaratan Sistem & Perangkat Lunak Wajib

Di laptop baru / kosongan, pastikan perangkat lunak berikut sudah terinstall terlebih dahulu:

1. **Node.js (LTS Version - v18 atau v20)**:
   - Download installer `.msi` dari website resmi [https://nodejs.org](https://nodejs.org).
   - Saat proses install, centang checkbox **"Automatically install the necessary tools"** jika ada.
2. **Git**:
   - Download dari [https://git-scm.com](https://git-scm.com) untuk melakukan clone repository.

---

## 🛠️ Panduan Instalasi di Laptop Baru / Kosong

### 1. Clone Repository & Masuk Folder
```bash
git clone https://github.com/HiragiIsMe/remote-ssh.git
cd remote-ssh
```

### 2. Install Dependensi
Jalankan perintah berikut di Command Prompt / Terminal:
```bash
npm install
```

> 💡 **Troubleshooting: Jika `npm install` Error di Windows Kosong (gyp ERR / Python / MSB4019)**:
> Error ini terjadi karena beberapa sub-library SSH/Electron mencoba mengkompilasi file C++ namun laptop belum memiliki Build Tools. Gunakan salah satu perintah berikut:
>
> **Solusi A (Tanpa C++ Build Tools - Paling Cepat & Aman)**:
> ```bash
> npm install --no-optional
> ```
>
> **Solusi B (Jika butuh C++ Build Tools)**:
> Jalankan PowerShell sebagai Administrator, lalu ketik:
> ```bash
> npm install --global --production windows-build-tools
> ```

---

## 🚀 Menjalankan Aplikasi

- **Menggunakan NPM (Development Mode)**:
  ```bash
  npm start
  ```

- **Menggunakan Batch / VBS Script (Windows Silent Launcher)**:
  Double-click file **`run_app.bat`** atau **`run_app.vbs`** di folder utama project.

---

## 📁 Struktur File Project

```
├── main.js         # Backend Electron, IPC handlers & SSH2 PTY Shell Orchestrator
├── database.js     # Engine SQLite (sql.js) & Abstraksi CRUD Data
├── preload.js      # Jembatan ContextBridge API antara Electron Main & Renderer
├── renderer.js     # Frontend Logic, Event Handlers & Line-Buffered Terminal Renderer
├── index.html      # Struktur UI Dashboard Modern Glassmorphism
├── styles.css      # Styling Dark Mode, Glassmorphism, & Visual Tokens
├── run_app.bat     # Windows Batch Launcher Script
└── run_app.vbs     # Silent VBScript Launcher (Tanpa Jendela CMD)
```

---

## 📄 Lisensi
[MIT License](LICENSE)
