# Castles and Cannons

This repo includes a static website (`index.html`, `style.css`, `script.js`).

If `http://localhost:8080` says **"This site can't be reached"**, it usually means one of these:
- the server is not running,
- it is running on a different port,
- or you're in a cloud/remote environment where `localhost` is not your local computer.

## Fastest way to run it (no Docker)

From this repo root:

```bash
npm run serve:static
```

This starts a static server on `0.0.0.0:5000`.

Open:
- On the same machine: `http://localhost:5000`
- On another machine in your network: `http://<YOUR_COMPUTER_IP>:5000`

## Verify it is running

In a second terminal:

```bash
curl -I http://127.0.0.1:5000
```

If it works, you should see `HTTP/1.0 200 OK`.

## If localhost still does not work

### 1) Check server process is still running
If the terminal where you started the server was closed, the server stops.

### 2) Try a different port
```bash
python3 -m http.server 8080 --bind 0.0.0.0
```
Then open `http://localhost:8080`.

### 3) If you are on a remote VM / cloud IDE / Replit-like environment
Use the platform's forwarded URL instead of localhost.

### 4) Firewall/network check (for other devices)
Allow inbound TCP on the port you're using (`5000` or `8080`).

## Docker option (if Docker is installed)

### Build image
```bash
docker build -t castles-and-cannons .
```

### Run container
```bash
docker run --rm -p 8080:80 --name castles-and-cannons castles-and-cannons
```

### Open site
- Same machine: `http://localhost:8080`
- Another device: `http://<YOUR_COMPUTER_IP>:8080`

## Cloud deployment options (public URL)

Because this is static, you can publish with:
- GitHub Pages
- Netlify
- Vercel (static)
- Cloudflare Pages

Publish these files:
- `index.html`
- `style.css`
- `script.js`

## Note about the Node/Express scaffold

The TypeScript/Express scaffold in this repo is currently incomplete at runtime (`server/vite` and `server/storage` modules are missing), so the static serving path above is the reliable way to run the site now.
