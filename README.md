# Apartment Management System

A comprehensive apartment management system with backend API, frontend dashboard, and database management.

## Prerequisites

- Docker and Docker Compose
- Git
- For GKE deployment: Google Cloud SDK (gcloud)
- For local K8s: kubectl and local Kubernetes cluster

## Getting Started

Follow these steps to get your development environment set up and running.

### 1. Clone the Repository

```bash
git clone https://github.com/f-midterm/GKE-Project-ffinal.git
cd GKE-Project-ffinal
```

### 2. Environment Configuration

Copy the example environment file and configure your credentials:

```bash
cp .env.example .env
```

Edit `.env` and replace all example values with your actual configuration.

## Development Mode

### Start Development Services

```bash
docker compose -f docker-compose.dev.yml up --build -d
```

### View Logs

```bash
docker compose -f docker-compose.dev.yml logs -f
```

### Stop Development Services

```bash
docker compose -f docker-compose.dev.yml down
```

Once the services are running, access:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8080
- MySQL: localhost:3307

## Production Mode (Local)

### Start Production Services

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

### View Logs

```bash
docker compose -f docker-compose.prod.yml logs -f
```

### Stop Production Services

```bash
docker compose -f docker-compose.prod.yml down
```

Once the services are running, access:
- Application: http://localhost
- Backend API: http://localhost:8080
- MySQL: localhost:3307

## Deployment

### Google Cloud Platform (GKE)

Deploy to Google Kubernetes Engine:

```bash
cd k8s-gcp
.\deploy.ps1
```

The application will be deployed to your configured GKE cluster.

### Local Kubernetes with Monitoring

Deploy to local Kubernetes cluster with Prometheus and Grafana:

#### Step 1: Deploy Monitoring Stack

```bash
cd monitor
.\deploy-monitoring.ps1
```

This installs Prometheus Operator CRDs and monitoring components.

#### Step 2: Deploy Application

```bash
cd ..\k8s
.\deploy.ps1
```

This will automatically apply ServiceMonitor resources for metrics collection.

Access points:
- Application: http://localhost (via ingress)
- Prometheus:  http://grafana.localhost
- Grafana: http://prometheus.localhost

## Project Structure

```
.
├── backend/                 # Spring Boot backend application
├── frontend/                # React frontend application
├── k8s/                     # Local Kubernetes manifests
├── k8s-gcp/                 # GKE deployment manifests
├── monitor/                 # Prometheus/Grafana monitoring stack
├── docker-compose.dev.yml   # Development environment
├── docker-compose.prod.yml  # Production environment (local)
└── .env.example             # Environment variables template
```

## Additional Commands

### Kubernetes Utilities

```bash
# Update deployment
cd k8s
.\update.ps1

# Delete deployment
cd k8s
.\delete_deploy.ps1

# Build images
cd k8s
.\build-images.ps1
```

### Monitoring

```bash
# Deploy monitoring
cd monitor
.\deploy-monitoring.ps1

# Delete monitoring
cd monitor
.\delete-monitoring.ps1
```

## Important Notes

- Never commit `.env` file to version control
- Always change default credentials before production deployment
- Use proper secrets management for production (GitHub Secrets for GKE)
- Keep `.env.example` updated with new variables (use placeholder values only)

