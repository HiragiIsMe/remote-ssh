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

## 📦 Persyaratan Sistem

- **Node.js**: v18.0.0 atau yang lebih baru
- **NPM**: v8.0.0 atau yang lebih baru
- **Sistem Operasi**: Windows 10/11, macOS, atau Linux

---

## 🛠️ Panduan Instalasi & Jalankan

### 1. Clone Repository & Install Dependensi
```bash
git clone https://github.com/username/ssh-command-studio.git
cd ssh-command-studio
npm install
```

### 2. Menjalankan Aplikasi
Anda dapat menjalankan aplikasi menggunakan salah satu cara berikut:

- **Menggunakan NPM (Development Mode)**:
  ```bash
  npm start
  ```

- **Menggunakan Batch / VBS Script (Windows Instant Launcher)**:
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

## 🔒 Otentikasi & Keamanan

Aplikasi ini menggunakan otentikasi password murni untuk SSH host target. Semua data disimpan secara lokal pada komputer pengguna dan tidak dikirimkan ke server eksternal manapun.

---

## 📄 Lisensi
[MIT License](LICENSE)
