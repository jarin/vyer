# Deployment Guide - Hetzner Cloud

This guide walks you through deploying the Transit Delay Visualizer to Hetzner Cloud.

---

## 📋 Prerequisites

1. **Hetzner Cloud Account**
2. **GitHub Repository** with this code
3. **Docker** installed on Hetzner server
4. **SSH Access** to your Hetzner server

---

## 🚀 Quick Deployment Steps

### 1. Set Up Hetzner Server

#### Create a Server
```bash
# Via Hetzner Cloud Console or CLI
# Recommended: Ubuntu 22.04 LTS, CX11 or better
```

#### Install Docker on Server
```bash
# SSH into your server
ssh root@YOUR_SERVER_IP

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Start Docker
systemctl enable docker
systemctl start docker

# Verify installation
docker --version
```

### 2. Configure GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add the following secrets:

| Secret Name | Description | Example |
|------------|-------------|---------|
| `HETZNER_SSH_PRIVATE_KEY` | SSH private key for server access | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `HETZNER_SERVER_IP` | Your Hetzner server IP | `123.45.67.89` |
| `HETZNER_SERVER_USER` | SSH user (default: root) | `root` |
| `ALLOWED_ORIGINS` | Comma-separated allowed CORS origins | `https://yourdomain.com` |
| `APP_PORT` | Port to expose (default: 3001) | `3001` |
| `PRODUCTION_URL` | Your production URL | `https://transit.yourdomain.com` |

#### Generate SSH Key for Deployment
```bash
# On your local machine
ssh-keygen -t ed25519 -C "github-deploy" -f ~/.ssh/github_deploy

# Copy public key to Hetzner server
ssh-copy-id -i ~/.ssh/github_deploy.pub root@YOUR_SERVER_IP

# Copy private key content to GitHub secret HETZNER_SSH_PRIVATE_KEY
cat ~/.ssh/github_deploy
```

### 3. Configure Server Firewall

```bash
# On Hetzner server
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow 3001/tcp  # Application (if needed)
ufw enable
```

### 4. Set Up Reverse Proxy (Optional but Recommended)

#### Install Nginx
```bash
apt update
apt install nginx certbot python3-certbot-nginx -y
```

#### Configure Nginx
```bash
cat > /etc/nginx/sites-available/transit-delay <<'EOF'
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /health {
        proxy_pass http://localhost:3001/health;
        access_log off;
    }
}
EOF

# Enable site
ln -s /etc/nginx/sites-available/transit-delay /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

#### Set Up SSL with Let's Encrypt
```bash
certbot --nginx -d yourdomain.com
```

### 5. Deploy via GitHub Actions

The deployment will automatically trigger when you push to `main` or `master` branch.

**Manual Trigger:**
```bash
# Go to GitHub → Actions → "Build, Security Scan & Deploy to Hetzner" → Run workflow
```

Or push your changes:
```bash
git add .
git commit -m "Configure deployment"
git push origin main
```

---

## 🐳 Manual Docker Deployment (Alternative)

If you prefer manual deployment without CI/CD:

### Build and Run Locally
```bash
# Clone repository on server
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO

# Create .env file
cat > .env <<EOF
NODE_ENV=production
PORT=3001
ALLOWED_ORIGINS=https://yourdomain.com
API_BASE_URL=https://api.kaveland.no/forsinka/stop/
EOF

# Build and run with Docker Compose
docker-compose up -d

# Check logs
docker-compose logs -f
```

### Or use Docker directly
```bash
# Build image
docker build -t transit-delay-app .

# Run container
docker run -d \
  --name transit-delay-app \
  --restart unless-stopped \
  -p 3001:3001 \
  -e NODE_ENV=production \
  -e ALLOWED_ORIGINS=https://yourdomain.com \
  transit-delay-app

# Check logs
docker logs -f transit-delay-app
```

---

## 🔧 Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | Yes | `development` | Environment (production/development) |
| `PORT` | No | `3001` | Server port |
| `API_BASE_URL` | No | `https://api.kaveland.no/forsinka/stop/` | External API URL |
| `ALLOWED_ORIGINS` | Yes | `http://localhost:5173` | Comma-separated CORS origins |

---

## 🔍 Monitoring & Health Checks

### Health Check Endpoint
```bash
curl http://YOUR_SERVER_IP:3001/health
```

Expected response:
```json
{
  "status": "ok",
  "message": "Transit Delay Proxy Server is running"
}
```

### View Logs
```bash
# Docker logs
docker logs -f transit-delay-app

# Or with docker-compose
docker-compose logs -f
```

### Monitor Resources
```bash
# Check container stats
docker stats transit-delay-app

# Check disk usage
df -h

# Check memory
free -h
```

---

## 🔄 Updates and Rollbacks

### Update Application
```bash
# Pull latest code
cd /path/to/repo
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose up -d --build
```

### Rollback to Previous Version
```bash
# Stop current container
docker stop transit-delay-app
docker rm transit-delay-app

# Run previous image (find tag with: docker images)
docker run -d \
  --name transit-delay-app \
  --restart unless-stopped \
  -p 3001:3001 \
  -e NODE_ENV=production \
  ghcr.io/YOUR_USERNAME/YOUR_REPO:PREVIOUS_SHA
```

---

## 🔒 Security Hardening

### 1. Enable Automatic Security Updates
```bash
apt install unattended-upgrades -y
dpkg-reconfigure --priority=low unattended-upgrades
```

### 2. Configure Fail2Ban
```bash
apt install fail2ban -y
systemctl enable fail2ban
systemctl start fail2ban
```

### 3. Limit SSH Access
```bash
# Edit SSH config
nano /etc/ssh/sshd_config

# Disable root login (after setting up sudo user)
PermitRootLogin no

# Disable password authentication (use keys only)
PasswordAuthentication no

# Restart SSH
systemctl restart sshd
```

### 4. Regular Updates
```bash
# Update system
apt update && apt upgrade -y

# Update Docker images
docker-compose pull
docker-compose up -d
```

---

## 🐛 Troubleshooting

### Container Won't Start
```bash
# Check logs
docker logs transit-delay-app

# Check if port is in use
netstat -tulpn | grep 3001

# Restart container
docker restart transit-delay-app
```

### CORS Issues
```bash
# Verify ALLOWED_ORIGINS is set correctly
docker exec transit-delay-app env | grep ALLOWED_ORIGINS

# Update and restart
docker stop transit-delay-app
docker rm transit-delay-app
# Run with correct ALLOWED_ORIGINS
```

### Health Check Failing
```bash
# Check if app is listening
docker exec transit-delay-app netstat -tulpn

# Check health endpoint directly
docker exec transit-delay-app curl http://localhost:3001/health
```

### Performance Issues
```bash
# Check resource usage
docker stats

# Increase container resources if needed
# Upgrade Hetzner server plan
```

---

## 📊 CI/CD Pipeline Overview

The GitHub Actions workflow includes:

1. **Security Scan**: npm audit, dependency scanning
2. **Build**: TypeScript compilation, Vite build
3. **Docker Build**: Multi-stage Docker image creation
4. **Trivy Scan**: Container vulnerability scanning
5. **Deploy**: SSH to Hetzner, pull image, restart container
6. **Health Check**: Verify deployment success

### Pipeline Stages

```mermaid
graph LR
    A[Push to main] --> B[Security Scan]
    B --> C[Build & Test]
    C --> D[Docker Build]
    D --> E[Trivy Scan]
    E --> F[Push to GHCR]
    F --> G[Deploy to Hetzner]
    G --> H[Health Check]
```

---

## 📞 Support

For issues:
1. Check GitHub Actions logs
2. Review server logs: `docker logs -f transit-delay-app`
3. Verify network connectivity
4. Check firewall rules
5. Review security scan reports

---

## 📝 Checklist

Before going to production:

- [ ] Hetzner server created and configured
- [ ] Docker installed on server
- [ ] SSH keys configured
- [ ] GitHub secrets added
- [ ] Firewall configured
- [ ] Nginx reverse proxy set up (optional)
- [ ] SSL certificate installed (recommended)
- [ ] Environment variables set
- [ ] Security audit passing
- [ ] Health checks working
- [ ] Monitoring configured
- [ ] Backup strategy in place

---

## 🎉 Success!

Your Transit Delay Visualizer should now be deployed and running on Hetzner Cloud!

Access your app at: `http://YOUR_SERVER_IP:3001` or `https://yourdomain.com`
