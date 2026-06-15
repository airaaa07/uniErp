#!/bin/bash

# Port definitions
FRONTEND_PORT=5173
BACKEND_PORT=8080

kill_port() {
  PORT=$1
  echo "Checking port $PORT..."
  # Try using lsof
  if command -v lsof >/dev/null 2>&1; then
    PIDS=$(lsof -t -i:$PORT)
    if [ ! -z "$PIDS" ]; then
      echo "Killing process(es) $PIDS listening on port $PORT..."
      kill -9 $PIDS 2>/dev/null
    fi
  # Try using fuser
  elif command -v fuser >/dev/null 2>&1; then
    echo "Killing processes on port $PORT/tcp using fuser..."
    fuser -k $PORT/tcp >/dev/null 2>&1
  # Fallback parsing ss
  else
    PID=$(ss -lptn "sport = :$PORT" 2>/dev/null | grep -o -E 'pid=[0-9]+' | cut -d= -f2)
    if [ ! -z "$PID" ]; then
      echo "Killing process $PID listening on port $PORT..."
      kill -9 $PID 2>/dev/null
    fi
  fi
}

show_status() {
  echo "========================================="
  echo "            SERVICE STATUS"
  echo "========================================="
  
  # Host services status
  VITE_PID=$(ss -lptn "sport = :$FRONTEND_PORT" 2>/dev/null | grep -o -E 'pid=[0-9]+' | cut -d= -f2)
  if [ ! -z "$VITE_PID" ]; then
    echo "● Frontend (Host): RUNNING on port $FRONTEND_PORT (PID $VITE_PID)"
  else
    echo "○ Frontend (Host): STOPPED"
  fi

  BACKEND_PID=$(ss -lptn "sport = :$BACKEND_PORT" 2>/dev/null | grep -o -E 'pid=[0-9]+' | cut -d= -f2)
  if [ ! -z "$BACKEND_PID" ]; then
    echo "● Backend (Host) : RUNNING on port $BACKEND_PORT (PID $BACKEND_PID)"
  else
    echo "○ Backend (Host) : STOPPED"
  fi

  # Docker status
  echo ""
  echo "--- Docker Containers ---"
  if command -v docker >/dev/null 2>&1; then
    docker compose ps
  else
    echo "Docker is not installed or running."
  fi
  echo "========================================="
}

stop_all() {
  echo "Stopping all services..."
  
  # 1. Stop Docker Compose
  if command -v docker >/dev/null 2>&1; then
    echo "Stopping Docker containers..."
    docker compose down 2>/dev/null
  fi

  # 2. Kill local port listeners
  kill_port $FRONTEND_PORT
  kill_port $BACKEND_PORT

  # 3. Clean up lingering Go binaries / Vite processes by name
  pkill -f "go run server/main.go" 2>/dev/null
  pkill -f "vite" 2>/dev/null
  
  echo "All services stopped successfully."
}

start_host() {
  echo "Starting services in HOST mode..."
  
  # Ensure no Docker containers are running that conflict
  stop_all

  # Verify .env exists in backend
  if [ ! -f "backend/.env" ]; then
    echo "Warning: backend/.env not found. Copying .env.example..."
    cp backend/.env.example backend/.env
  fi

  # Verify .env exists in frontend
  if [ ! -f "frontend/.env" ]; then
    echo "Warning: frontend/.env not found. Copying .env.example..."
    cp frontend/.env.example frontend/.env
  fi

  # Load database configuration from backend/.env if available
  export $(grep -v '^#' backend/.env | xargs) 2>/dev/null

  echo "Starting Backend (Go)..."
  cd backend || exit
  nohup go run server/main.go > ../backend.log 2>&1 &
  cd ..

  echo "Starting Frontend (Vite)..."
  cd frontend || exit
  nohup npm run dev -- --host 0.0.0.0 --port $FRONTEND_PORT > ../frontend.log 2>&1 &
  cd ..

  # Wait a bit and show status
  sleep 3
  show_status
  echo "Backend logs are written to: backend.log"
  echo "Frontend logs are written to: frontend.log"
  echo "Access the frontend at: http://localhost:$FRONTEND_PORT or http://192.168.1.14:$FRONTEND_PORT"
}

start_docker() {
  echo "Starting services in DOCKER mode..."

  # Stop host processes to release ports
  echo "Releasing host ports..."
  kill_port $FRONTEND_PORT
  kill_port $BACKEND_PORT

  # Build and start Docker compose using backend .env for connection settings
  if [ -f "backend/.env" ]; then
    echo "Using configuration from backend/.env..."
    docker compose --env-file backend/.env up --build
  else
    echo "Warning: backend/.env not found, starting with defaults..."
    docker compose up --build
  fi
}

# Command dispatcher
case "$1" in
  host)
    start_host
    ;;
  docker)
    start_docker
    ;;
  stop)
    stop_all
    ;;
  status)
    show_status
    ;;
  *)
    echo "Usage: $0 {host|docker|stop|status}"
    echo "  host   : Runs frontend and backend locally in background"
    echo "  docker : Runs frontend, backend, and db inside Docker containers"
    echo "  stop   : Stops all host processes and Docker containers"
    echo "  status : Shows status of running host processes and Docker containers"
    exit 1
    ;;
esac
