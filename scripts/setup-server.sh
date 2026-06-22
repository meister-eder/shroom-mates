#!/bin/sh
# Server setup for shroom-mates
# Run as root on the server
set -eu

echo "=== Step 1: Update system ==="
apt update && apt upgrade -y

echo ""
echo "=== Step 2: Install Docker ==="
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
else
  echo "Docker already installed"
fi

echo ""
echo "=== Step 3: Install tools ==="
apt install -y jq git

echo ""
echo "=== Step 4: Create deploy user ==="
if ! id deploy >/dev/null 2>&1; then
  adduser --disabled-password --gecos "" deploy
fi
usermod -aG docker deploy

# Add your public key manually:
# echo 'ssh-ed25519 AAAA...' > /home/deploy/.ssh/authorized_keys

echo ""
echo "=== Step 5: Create app directory ==="
mkdir -p /opt/shroom-mates
chown deploy:deploy /opt/shroom-mates

echo ""
echo "=== Done! ==="
