const SSHClient = require('./ssh-client');

async function check() {
  const client = new SSHClient();
  try {
    await client.connect();
    console.log('=== CONTENEURS DOCKER ===');
    const containers = await client.executeCommand('docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Ports}}"');
    console.log(containers.stdout);
    
    console.log('\n=== SERVICES SWARM ===');
    const services = await client.executeCommand('docker service ls');
    console.log(services.stdout);
    
    console.log('\n=== PORTS EN ECOUTE ===');
    const ports = await client.executeCommand('ss -tuln 2>/dev/null | grep -E ":(8000|3001|3000|5432)" || netstat -tuln 2>/dev/null | grep -E ":(8000|3001|3000|5432)" || echo "Aucun port trouvé"');
    console.log(ports.stdout);
  } catch (e) {
    console.error('Erreur:', e.message);
  } finally {
    client.disconnect();
  }
}

check();
