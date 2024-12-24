# What is this?

It's a project that wraps [Online Mis PENS](https://online.mis.pens.ac.id) with an improved UI and UX. How does it work? First, you'll log in with your account. Once your account is validated, you'll receive a cookie, which is then encrypted and stored securely in your browser. With the cookie, we can make requests to any page on Online MIS PENS, extract the HTML response, and present it with a cleaner, more user-friendly interface.

### Why did I build this?

This project was created purely for fun and as a way to improve my skills. It’s not meant to replace Online MIS PENS but to explore better design possibilities and learn new tech. For instance, this project uses the latest React Router v7 Framework Mode.

### What’s next?

My ambition is to rewrite the backend in Golang and Rust to compare the two and figure out which one works better.

## Run this project locally

### Installation on your machine

Install the dependencies:

```bash
npm install
```

### Start Development Server

Start the development server with npm:

```bash
npm run dev
```

Open the website at `http://localhost:5173`.

## Selfhost this project

### Docker Compose Deployment

To build and run using Docker Compose:

```bash
docker compose up -d
```

### Docker Deployment

This template includes three Dockerfiles optimized for different package managers:

- `Dockerfile` - for npm
- `Dockerfile.pnpm` - for pnpm
- `Dockerfile.bun` - for bun

To build and run using Docker:

```bash
# For npm
docker build -t my-app .

# For pnpm
docker build -f Dockerfile.pnpm -t my-app .

# For bun
docker build -f Dockerfile.bun -t my-app .

# Run the container
docker run -p 3000:3000 my-app
```

The containerized application can be deployed to any platform that supports Docker, including:

- Your Own VPS
- AWS ECS
- Google Cloud Run
- Azure Container Apps
- Digital Ocean App Platform
- Fly.io
- Railway

### DIY Deployment

If you're familiar with deploying Node applications, the built-in app server is production-ready.

Make sure to deploy the output of `npm run build`

```
├── package.json
├── package-lock.json (or pnpm-lock.yaml, or bun.lockb)
├── build/
│   ├── client/    # Static assets
│   └── server/    # Server-side code
```

---

Built by Jhiven with ❤️.
