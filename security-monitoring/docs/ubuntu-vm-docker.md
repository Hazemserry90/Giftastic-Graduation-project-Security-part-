# Ubuntu VM + Docker Engine

A step-by-step guide to running the lab on an Ubuntu virtual machine. This is
the recommended deployment: the containers are Linux-native, there is no Windows
bind-mount friction, and `scripts/init.sh` works unchanged.

## 1. Size the VM

| Resource | Minimum | Recommended |
| --- | --- | --- |
| vCPU | 2 | 4 |
| RAM | 6 GB | 8 GB |
| Disk | 30 GB | 40 GB |
| Network | NAT + port forward, or bridged | Bridged |

The Wazuh indexer is the memory consumer. Under 6 GB the dashboard becomes slow
and the indexer may refuse to start.

## 2. Create the VM and install Ubuntu

Any hypervisor works.

**VirtualBox / VMware**

1. Create a new VM with the resources above.
2. Attach an **Ubuntu Server 26.04 LTS**, **24.04 LTS**, or **22.04 LTS** ISO.
   (Docker publishes packages for all three; see the note below.)
3. During install, enable **OpenSSH server** and note the username.
4. Finish the install and reboot.

**Hyper-V (Windows built-in)**

1. Enable Hyper-V and create a **Generation 2** VM with the same resources.
2. Disable Secure Boot or use the Microsoft UEFI template.
3. Install Ubuntu Server and enable OpenSSH.

### Networking

- **Bridged adapter** (simplest for lab access): the VM gets its own LAN IP, and
  you browse to `https://<vm-ip>` from your host.
- **NAT**: forward a host port to guest port `443` (and optionally `9200`) in the
  hypervisor's network settings, then browse to `https://localhost`.

Keep a snapshot after the OS install and after Docker is installed, so you can
roll back between demos.

### SSH access to the VM

There are **two separate SSH services** in this lab. Keep them straight:

| Purpose | Port | Where |
| --- | --- | --- |
| Administrating the Ubuntu VM | `22` | The VM's own OpenSSH server |
| Cowrie honeypot decoy | `2222` (compose mapping) | A container, never real access |

Never map Cowrie onto port `22` on a host that also runs a real SSH server - it
would collide with the VM's sshd. The default mapping (`2222:2222`) keeps them
separate. Only expose port `22` to your LAN or host; the decoy is for controlled
demonstrations.

From Windows (the OpenSSH client is built in):

```powershell
ssh <user>@<vm-ip>          # bridged networking
ssh -p <forwarded-port> <user>@<host-ip>   # NAT with a forwarded 22
```

Find the VM's address from its console with:

```bash
hostname -I
```

#### Key-based login (recommended)

On Windows:

```powershell
ssh-keygen -t ed25519 -C "giftastic-lab"
# Copy the public key to the VM (path shown after ssh-copy-id equivalent):
type $env:USERPROFILE\.ssh\id_ed25519.pub
```

Then paste that line into `~/.ssh/authorized_keys` on the VM (create the file
with mode `600`). On Linux/macOS the shortcut is `ssh-copy-id <user>@<vm-ip>`.
After confirming key login works, you can disable password auth in
`/etc/ssh/sshd_config` (`PasswordAuthentication no`) and restart `ssh`.

#### Copy the project to the VM

```powershell
scp -r "C:\Users\HAZEM\Giftastic-Graduation-Project" <user>@<vm-ip>:~/
```

`rsync -av --exclude target --exclude node_modules` is faster for repeat copies
from a Linux/macOS host.

#### Using SSH against the honeypot (demo only)

`scripts/simulate-cowrie.sh` uses `sshpass` plus the `ssh` client to log into the
**decoy** on port `2222`. Install it only for the demo:

```bash
sudo apt-get install -y sshpass
./scripts/simulate-cowrie.sh
```

Without `sshpass`, the script falls back to writing equivalent Cowrie JSON
events, so the Wazuh rules still fire.

## 3. Update the VM

```bash
sudo apt-get update && sudo apt-get -y upgrade
sudo reboot
```

## 4. Install Docker Engine and the Compose plugin

Use Docker's official repository (not the distribution's `docker.io` package).
The repository publishes `noble` (24.04), `plucky`/`questing` (25.x), and
`resolute` (26.04 LTS), so the codename line below resolves correctly on any of
them. Check the supported suites at
<https://download.docker.com/linux/ubuntu/dists/> if in doubt.

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg

sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
  sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io \
  docker-buildx-plugin docker-compose-plugin

sudo usermod -aG docker "$USER"
newgrp docker
```

Verify:

```bash
docker run --rm hello-world
docker compose version
```

## 5. Kernel tuning (required for the Wazuh indexer)

OpenSearch-based components need a high `vm.max_map_count`. On Docker Desktop
this is set for you; on a bare VM you must set it or the indexer will crash with
`max virtual memory areas vm.max_map_count [65530] is too low`.

```bash
sudo sysctl -w vm.max_map_count=262144

# Persist across reboots
echo "vm.max_map_count=262144" | sudo tee /etc/sysctl.d/99-wazuh.conf
```

If `ufw` is enabled and you use bridged networking, allow the dashboard:

```bash
sudo ufw allow 443/tcp
sudo ufw allow from <your-host-subnet> to any port 1514 proto tcp
```

## 6. Get the repository into the VM

Preferred: push the repository to GitHub and clone it inside the VM.

```bash
git clone <your-repo-url> ~/Giftastic-Graduation-Project
cd ~/Giftastic-Graduation-Project/security-monitoring
```

Alternatives:

- From Windows PowerShell, copy the project over SSH:

  ```powershell
  scp -r "C:\Users\HAZEM\Giftastic-Graduation-Project" user@<vm-ip>:~/
  ```

- Shared folders work but are slower and can break file permissions. If you use
  one, copy the project onto the VM's ext4 filesystem first, for example
  `cp -r /media/sf_share/Giftastic-Graduation-Project ~/`.

## 7. Configure and start the lab

```bash
cd security-monitoring
cp .env.example .env
nano .env            # change INDEXER_PASSWORD, DASHBOARD_PASSWORD, API_PASSWORD
./scripts/init.sh
```

`init.sh` creates the log directories, fixes Cowrie's log permissions, generates
the TLS certificates, and starts Wazuh plus the Cowrie honeypot.

The first start takes 2-5 minutes. Check progress with:

```bash
docker compose ps
docker compose logs -f wazuh.indexer
```

## 8. Access the dashboard

- Bridged: `https://<vm-ip>`
- NAT with port forward: `https://localhost`

Accept the self-signed certificate and log in with the credentials from `.env`.

## 9. Run the demonstration

```bash
./scripts/simulate-giftastic.sh
./scripts/simulate-cowrie.sh
```

Filter the dashboard on `rule.groups: giftastic` and `rule.groups: cowrie`. See
[demonstration.md](demonstration.md) for the full walkthrough.

## 10. Operate

```bash
docker compose ps
docker compose logs -f wazuh.manager
docker compose down          # stop, keep data
docker compose down -v       # stop and delete data volumes and certs
```

Validate a rule interactively:

```bash
docker compose exec wazuh.manager /var/ossec/bin/wazuh-logtest
```

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| `Unit ssh.service could not be found` | `openssh-server` not installed | `sudo apt-get install -y openssh-server && sudo systemctl enable --now ssh` |
| Indexer exits / restarts | `vm.max_map_count` too low | Set it (step 5) |
| Indexer OOM-killed | VM RAM too small | Increase to 8 GB or lower `OPENSEARCH_JAVA_OPTS` |
| Dashboard unreachable | NAT port forward missing or `ufw` blocking | Forward/allow port 443 |
| Cowrie log empty | UID 999 cannot write `logs/cowrie` | `chmod -R a+rwX logs/cowrie` |
| Manager log shows `Could not open file 'etc/rules/...'` | Bind-mounted rules not readable by the manager user (files copied from Windows can be `600`) | `chmod -R a+rX wazuh logs` then `docker compose restart wazuh.manager` |
| Old alerts persist | Volumes retained between runs | `docker compose down -v` then start again |
| Port 443 already in use | Another service on the VM | Change the `443:5601` mapping in `docker-compose.yml` |
