Start Order and Commands

This project runs three parts. Start them in this order:

1) Docker services (ComfyUI and A1111)
- Command: `docker compose up -d comfyui automatic1111`

2) Backend API (Node, port 3002)
- Command: `cd server && npm start`
- Health check: `http://localhost:3002/api/health`
- Comfy health via backend: `http://localhost:3002/api/comfyui/health`

3) Frontend (Vite, port 3001)
- Command: `npm run dev`
- Open: `http://localhost:3001`

Stop/Restart Order

1) Stop frontend (Ctrl+C in its terminal)
2) Stop backend (Ctrl+C in its terminal)
3) Stop Docker services: `docker compose stop comfyui automatic1111` or tear down with `docker compose down`

One‑liner scripts (optional)

- Start Docker only: `npm run stack:docker`
- Start backend only: `npm run stack:backend`
- Start frontend only: `npm run stack:frontend`
- Start backend + frontend together (after Docker): `npm run stack:all`

