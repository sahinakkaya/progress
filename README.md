# Progress - Habit & Target Tracker

A full-stack web application for tracking habits and targets with flexible scheduling, progress visualization.

## Features

### 🎯 Two Types of Trackers
- **Habit Trackers** - Track boolean completion of daily routines (exercise, reading, etc.)
- **Target Trackers** - Track numeric progress toward goals (weight loss, savings, etc.)

### 📅 Flexible Scheduling
- **Specific Days** - Track habits on particular weekdays (Mon/Wed/Fri)
- **Interval-based** - Track every N days, weeks, or months
- **Due Date Tracking** - Visual indicators for when trackers are due

### 📊 Rich Analytics
- Progress charts and visualizations
- Streak tracking for habits
- Dashboard view with date selection

## Architecture

### Frontend
- **React + TypeScript** with Vite
- **Tailwind CSS v4** + Radix UI components
- **Recharts** for data visualization
- **React Router** for navigation

### Backend
- **Go** REST API with Gorilla Mux
- **SQLite** database with manual SQL queries
- **Swagger** documentation
- **CORS** enabled for frontend integration

### Deployment
- **Docker** containerization
- **Caddy** reverse proxy with automatic HTTPS
- **GitHub Actions** for CI/CD
- **Single frontend image** with environment-based configuration

## Quick Start

### Development

1. **Backend Setup**
```bash
cd backend
go mod tidy
go run main.go
```
Server runs on `http://localhost:8080` with Swagger docs at `/swagger/`

2. **Frontend Setup**
```bash
cd frontend
pnpm install
pnpm dev
```
Frontend runs on `http://localhost:5173`

### Production Deployment

1. **Build Images**
```bash
# Automatically built via GitHub Actions on push to main
# Images: ghcr.io/sahinakkaya/progress-frontend:main
#         ghcr.io/sahinakkaya/progress-backend:main
```

2. **Deploy with Docker Compose**
```yaml
services:
  progress-frontend:
    image: ghcr.io/sahinakkaya/progress-frontend:main
    restart: unless-stopped
  
  progress-backend:
    image: ghcr.io/sahinakkaya/progress-backend:main
    restart: unless-stopped
    volumes:
      - ./data.db:/app/tracker.db
```

3. **Configure Caddy**
```
your-domain.com {
  reverse_proxy /api/* progress-backend:8080
  reverse_proxy progress-frontend:3000
}

# For authenticated access
private.your-domain.com {
  import authenticate  # Your auth configuration
  reverse_proxy /api/* progress-backend:8080
  reverse_proxy progress-frontend:3000
}
```

## Configuration

### Environment Variables

- **Frontend** (build-time): `VITE_API_URL` - API endpoint (defaults to `/api`)
- **Backend**: No environment variables required

### Authentication Setup

For private deployments, configure your authentication provider (Authentik, Auth0, etc.) and import the auth configuration in Caddy:

```
(authenticate) {
    reverse_proxy /outpost.goauthentik.io/* authentik-server:9000
    forward_auth authentik-server:9000 {
        uri /outpost.goauthentik.io/auth/caddy
        copy_headers X-Authentik-Username X-Authentik-Groups
        trusted_proxies private_ranges
    }
}
```

## API Documentation

Interactive API documentation is available at `/swagger/` when running the backend.

Key endpoints:
- `GET /api/dashboard` - Dashboard data for a specific date
- `GET/POST /api/habit-trackers` - Habit tracker management
- `GET/POST /api/target-trackers` - Target tracker management
- `POST /api/{tracker-type}/{id}/entries` - Add progress entries

## Development Commands

### Frontend
```bash
pnpm dev      # Start development server
pnpm build    # Build for production
pnpm lint     # Run ESLint
pnpm preview  # Preview production build
```

### Backend
```bash
go run main.go        # Start development server
go test ./tests/      # Run tests
go build -o app main.go  # Build binary
swag init             # Generate Swagger docs
```

## Database Schema

- **habit_trackers** - Habit tracker configurations
- **target_trackers** - Target tracker configurations  
- **entries** - Progress entries for both tracker types

The application uses a unified entry system where both habit completions and target progress are stored in the same table with type discrimination.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `go test ./tests/`
5. Submit a pull request

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.
