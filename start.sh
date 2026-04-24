#!/bin/bash

# AI Knowledge Base/Wiki Generator - Start Script
# This script cleans used ports, initializes the database, seeds data, and starts the application

set -e

echo ""
echo "=============================================="
echo "     AI Knowledge Base / Wiki Generator"
echo "        Starting Application..."
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration - Not using port 5000
BACKEND_PORT=5001
FRONTEND_PORT=3000
DB_NAME="knowledge_base"
DB_USER="postgres"
DB_PASSWORD="postgres"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${PURPLE}  $1${NC}"
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Function to kill process on a port
kill_port() {
    local port=$1
    local pids=$(lsof -ti:$port 2>/dev/null || true)
    if [ -n "$pids" ]; then
        print_warning "Killing processes on port $port (PIDs: $pids)"
        for pid in $pids; do
            kill -9 $pid 2>/dev/null || true
        done
        sleep 1
    fi
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check PostgreSQL
check_postgres() {
    if command_exists psql; then
        if pg_isready -q 2>/dev/null; then
            return 0
        fi
    fi
    return 1
}

# Cleanup function
cleanup() {
    echo ""
    print_header "Shutting Down"
    print_status "Stopping services..."

    # Kill backend and frontend
    if [ -n "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    if [ -n "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi

    # Extra cleanup of ports
    kill_port $BACKEND_PORT
    kill_port $FRONTEND_PORT

    print_success "Application stopped gracefully"
    echo ""
    exit 0
}

# Set trap for cleanup
trap cleanup INT TERM

# Step 1: Clean up ports
print_header "Step 1: Cleaning Up Ports"
kill_port $BACKEND_PORT
kill_port $FRONTEND_PORT
# Also kill common conflicting ports
kill_port 5000
print_success "Ports cleaned (${BACKEND_PORT}, ${FRONTEND_PORT})"
echo ""

# Step 2: Check dependencies
print_header "Step 2: Checking Dependencies"

if ! command_exists node; then
    print_error "Node.js is not installed. Please install Node.js first."
    echo "Visit: https://nodejs.org/"
    exit 1
fi

if ! command_exists npm; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
print_success "Node.js $NODE_VERSION found"
print_success "npm v$NPM_VERSION found"
echo ""

# Step 3: Check PostgreSQL
print_header "Step 3: Checking PostgreSQL"

if ! check_postgres; then
    print_warning "PostgreSQL is not running. Attempting to start..."

    # Try to start PostgreSQL based on OS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command_exists brew; then
            brew services start postgresql@16 2>/dev/null || \
            brew services start postgresql@15 2>/dev/null || \
            brew services start postgresql@14 2>/dev/null || \
            brew services start postgresql 2>/dev/null || true
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        sudo systemctl start postgresql 2>/dev/null || \
        sudo service postgresql start 2>/dev/null || true
    fi

    sleep 3

    if ! check_postgres; then
        print_error "PostgreSQL is not running and could not be started."
        print_error "Please start PostgreSQL manually and try again."
        echo ""
        echo "macOS: brew services start postgresql"
        echo "Linux: sudo systemctl start postgresql"
        exit 1
    fi
fi
print_success "PostgreSQL is running"
echo ""

# Step 4: Create database
print_header "Step 4: Setting Up Database"

# Create database if it doesn't exist
psql -U $DB_USER -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" 2>/dev/null | grep -q 1 || \
    psql -U $DB_USER -c "CREATE DATABASE $DB_NAME" 2>/dev/null || \
    createdb -U $DB_USER $DB_NAME 2>/dev/null || \
    print_warning "Database may already exist"

print_success "Database '$DB_NAME' is ready"
echo ""

# Step 5: Create .env file if it doesn't exist
print_header "Step 5: Checking Environment Configuration"

if [ ! -f .env ]; then
    print_warning ".env file not found, creating default configuration..."
    cat > .env << 'EOF'
# Database Configuration
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/knowledge_base
DB_HOST=localhost
DB_PORT=5432
DB_NAME=knowledge_base
DB_USER=postgres
DB_PASSWORD=postgres

# Server Configuration
PORT=5001
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# OpenRouter AI Configuration
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_API_KEY=your-openrouter-api-key-here
OPENROUTER_MODEL=anthropic/claude-haiku-4.5

# Frontend URL
FRONTEND_URL=http://localhost:3000
EOF
    print_success "Created .env file with default settings"
    print_warning "Please update OPENROUTER_API_KEY in .env with your actual key"
else
    print_success ".env file exists"
fi
echo ""

# Step 6: Install backend dependencies
print_header "Step 6: Installing Backend Dependencies"
cd backend
npm install 2>/dev/null || npm install --legacy-peer-deps
print_success "Backend dependencies installed"
cd ..
echo ""

# Step 7: Seed the database
print_header "Step 7: Seeding Database"
print_status "Populating database with sample data..."
cd backend
npm run seed 2>&1 || {
    print_error "Database seeding failed. Check your PostgreSQL connection."
    print_warning "Continuing anyway..."
}
cd ..
echo ""

# Step 8: Install frontend dependencies
print_header "Step 8: Installing Frontend Dependencies"
cd frontend
npm install 2>/dev/null || npm install --legacy-peer-deps
print_success "Frontend dependencies installed"
cd ..
echo ""

# Step 9: Start backend with hot-reload
print_header "Step 9: Starting Backend Server"
print_status "Starting backend on port $BACKEND_PORT with hot-reload (nodemon)..."
cd backend
npx nodemon src/index.js 2>&1 | sed "s/^/[BACKEND] /" &
BACKEND_PID=$!
cd ..

# Wait for backend to start
print_status "Waiting for backend to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:$BACKEND_PORT/health > /dev/null 2>&1; then
        print_success "Backend is running on port $BACKEND_PORT"
        break
    fi
    sleep 1
done

if ! curl -s http://localhost:$BACKEND_PORT/health > /dev/null 2>&1; then
    print_warning "Backend may still be starting..."
fi
echo ""

# Step 10: Start frontend with hot-reload
print_header "Step 10: Starting Frontend Server"
print_status "Starting frontend on port $FRONTEND_PORT with hot-reload..."
cd frontend
BROWSER=none PORT=$FRONTEND_PORT npx react-scripts start 2>&1 | sed "s/^/[FRONTEND] /" &
FRONTEND_PID=$!
cd ..

# Wait for frontend to start
print_status "Waiting for frontend to be ready..."
sleep 5
echo ""

# Display final information
echo ""
echo -e "${GREEN}=============================================="
echo "     Application Started Successfully!"
echo "==============================================${NC}"
echo ""
echo -e "${CYAN}Access URLs:${NC}"
echo -e "  Frontend:    ${GREEN}http://localhost:$FRONTEND_PORT${NC}"
echo -e "  Backend API: ${GREEN}http://localhost:$BACKEND_PORT/api${NC}"
echo ""
echo -e "${CYAN}Demo Credentials:${NC}"
echo -e "  ${YELLOW}Demo User:${NC}"
echo -e "    Email:    demo@example.com"
echo -e "    Password: password123"
echo ""
echo -e "  ${YELLOW}Admin User:${NC}"
echo -e "    Email:    admin@knowledgebase.com"
echo -e "    Password: password123"
echo ""
echo -e "${CYAN}Hot-Reload Enabled:${NC}"
echo -e "  ${BLUE}Backend:${NC}  nodemon watches for file changes"
echo -e "  ${BLUE}Frontend:${NC} React development server with HMR"
echo ""
echo -e "${CYAN}AI Features Available:${NC}"
echo -e "  - AI Article Suggester"
echo -e "  - AI API Documentation Generator"
echo -e "  - AI Search Optimizer"
echo -e "  - AI Outdated Content Detector"
echo -e "  - AI Translation Engine"
echo -e "  - AI FAQ Generator"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop the application${NC}"
echo ""

# Keep the script running
wait $BACKEND_PID $FRONTEND_PID
