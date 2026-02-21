# How to start Duix-Avatar (for Novate Persona)

Duix-Avatar provides the **TTS (text-to-speech)** that makes the AI avatar speak in Novate Persona. Follow these steps to get it running.

---

## Requirements

- **Windows 10** (build 19042.1526 or higher) or **Ubuntu 22.04**
- **NVIDIA GPU** with drivers installed ([download](https://www.nvidia.com/drivers))
- **Docker** (see below)
- **Disk:** C: (or Docker data drive) **100GB+** free; **D: 30GB+** for Duix data (Windows)
- **RAM:** 32GB recommended; **GPU:** e.g. RTX 4070

---

## Step 1: Install WSL (Windows only)

1. Open PowerShell and run:
   ```powershell
   wsl --list --verbose
   ```
2. If WSL is not installed, install it. Then run:
   ```powershell
   wsl --update
   ```

---

## Step 2: Install Docker

**Windows**

1. Download [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/) (choose your CPU type).
2. Install and run Docker Desktop.
3. Accept the agreement and skip login if you prefer.
4. Ensure Docker is running (whale icon in the system tray).

**Ubuntu**

```bash
sudo apt update
sudo apt install docker.io docker-compose
# Install NVIDIA Container Toolkit so Docker can use the GPU (see Duix-Avatar README).
```

---

## Step 3: Get the Duix-Avatar project

1. Clone or download [Duix-Avatar](https://github.com/duixcom/Duix-Avatar):
   ```bash
   git clone https://github.com/duixcom/Duix-Avatar.git
   cd Duix-Avatar
   ```
2. Or download the ZIP from GitHub and extract it, then open a terminal in the `Duix-Avatar` folder.

---

## Step 4: Pull Docker images

In the **Duix-Avatar** project folder, pull the required images (this will use a lot of bandwidth and disk):

```bash
docker pull guiji2025/fun-asr
docker pull guiji2025/fish-speech-ziming
docker pull guiji2025/duix.avatar
```

Or let Step 5 pull them when you start the stack.

---

## Step 5: Start the Duix-Avatar services

1. Go to the **deploy** folder inside Duix-Avatar:
   ```bash
   cd deploy
   ```
2. Start all services:
   - **Windows (full):**
     ```bash
     docker-compose up -d
     ```
   - **Windows (lite, fewer services):**
     ```bash
     docker-compose -f docker-compose-lite.yml up -d
     ```
   - **Ubuntu:**
     ```bash
     docker-compose -f docker-compose-linux.yml up -d
     ```
3. Wait for the first run (can take ~30 minutes and ~70GB download). Use Wi‑Fi if possible.
4. In Docker Desktop (or `docker ps`), check that the containers are **Running**. You should see at least:
   - **TTS (Fish-Speech)** — port **18180** (this is what Novate Persona uses for voice).
   - Full setup also includes ASR and video services.

---

## Step 6: Verify TTS is reachable

- Open: [http://127.0.0.1:18180](http://127.0.0.1:18180) (you may get an error page or “method not allowed” — that’s OK; the port being open means the service is up).
- Or start **Novate Persona** (`npm run dev`) and open a partner (e.g. Novatutor). If Duix is running, the status will show **“Duix-Avatar: Connected — set voice in Avatar”** or **“✓ Connected”** once a voice is configured.

---

## Step 7: (Optional) Train a voice so the avatar can speak

1. Put your training audio in the folder Duix expects (see [Duix-Avatar – Model Training](https://github.com/duixcom/Duix-Avatar#open-apis)), e.g.  
   `D:\duix_avatar_data\voice\data` (path can be configured in docker-compose).
2. Call the Duix **model training API** (see Duix-Avatar docs). From the response, copy:
   - **reference_audio** (or `asr_format_audio_url`)
   - **reference_text**
3. In Novate Persona, click **Avatar** in the header, paste those two values, and click **Save**.  
   Status should change to **“Duix-Avatar: ✓ Connected”** and assistant replies will be spoken by the avatar.

---

## Troubleshooting

| Issue | What to do |
|--------|-------------|
| **“Not running (start Docker)”** in Novate Persona | Start Docker Desktop; run `docker-compose up -d` (or the lite/linux variant) in Duix-Avatar’s `deploy` folder. |
| **ECONNREFUSED 127.0.0.1:18180** in terminal | TTS service isn’t up. Check Docker: all Duix containers running? Restart the stack: `docker-compose down` then `docker-compose up -d` in `deploy`. |
| **“Connected — set voice in Avatar”** but no voice | Add Reference audio URL and Reference text from Duix model training in **Avatar** settings and Save. |
| No NVIDIA / GPU errors | Duix needs an NVIDIA GPU and correct drivers. Install [NVIDIA drivers](https://www.nvidia.com/drivers) and, on Linux, the NVIDIA Container Toolkit. |

---

## Quick reference

- **Duix-Avatar repo:** [github.com/duixcom/Duix-Avatar](https://github.com/duixcom/Duix-Avatar)
- **Installation video:** [YouTube – installation setup](https://www.youtube.com/watch?v=gRmluaGkeYg)
- **TTS port for Novate Persona:** **18180**
- **Start services:** `cd Duix-Avatar/deploy` → `docker-compose up -d` (or lite/linux variant)
