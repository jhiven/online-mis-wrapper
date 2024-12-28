# What is this?

It's a project that wraps [Online Mis PENS](https://online.mis.pens.ac.id) with an improved UI and UX. How does it work? First, you'll log in with your account. Once your account is validated, you'll receive a cookie, which is then encrypted and stored securely in your browser. With the cookie, we can make requests to any page on Online MIS PENS, extract the HTML response, and present it with a cleaner, more user-friendly interface.

### Why did I build this?

This project was created purely for fun and as a way to improve my skills. It’s not meant to replace Online MIS PENS but to explore better design possibilities and learn new tech. For instance, this project uses the latest [React Router v7 Framework Mode](https://reactrouter.com/home#react-router-as-a-framework).

### What’s next?

My ambition is to rewrite the backend in Golang and Rust to compare the two and figure out which one works better.

### Progress

- [x] [**React Router Framework v7**](https://github.com/jhiven/online-mis-wrapper/tree/RRv7-framework)
  - [x] UI with shadcn
  - [x] Online Mis Extractor (frs, absen, jadwal, nilai)
- [x] [**Golang Backend**](https://github.com/jhiven/online-mis-wrapper/tree/go-backend)
  - [x] Redis cache
  - [x] Online Mis Extractor (frs, absen, jadwal, nilai)
- [ ] **Rust Backend** _(Work In Progress)_
  - [ ] Redis cache
  - [ ] Online Mis Extractor (frs, absen, jadwal, nilai)

## Run this project locally

### Run backend server

First, you have to run redis. Make sure you already have docker installed.

```bash
sudo docker compose -f compose.redis.yml up -d
```

And then, you can run the Golang server. Make sure you already have go v1.23 installed on you system.

```bash
cd backend && go run cmd/server/main.go
```

### Run frontend

Copy file `frontend/.env.example` to `frontend/.env` and set this value:

```
VITE_BACKEND_URL=http://localhost:8080
```

Install the dependencies:

```bash
cd frontend && npm install
```

Start the development server with npm:

```bash
cd frontend && npm run dev
```

Open the website at `http://localhost:5173`.

---

Built by Jhiven with ❤️.
