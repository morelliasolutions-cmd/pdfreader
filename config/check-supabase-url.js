/**
 * Script pour vérifier l'URL Supabase accessible
 */

const SSHClient = require('./ssh-client');

async function checkSupabaseURL() {
  console.log('🔍 Vérification de l\'URL Supabase...\n');

  const client = new SSHClient();

  try {
    await client.connect();

    // 1. Vérifier les conteneurs Supabase
    console.log('📦 Conteneurs Supabase actifs:');
    const containers = await client.executeCommand('docker ps --filter "name=supabase" --format "table {{.Names}}\t{{.Ports}}\t{{.Status}}"');
    console.log(containers.stdout || containers.stderr || 'Aucun conteneur Supabase trouvé');

    // 2. Vérifier les services Easypanel
    console.log('\n🎯 Services Easypanel (Swarm):');
    const services = await client.executeCommand('docker service ls --format "table {{.Name}}\t{{.Ports}}" | grep -i supabase || echo "Aucun service Supabase trouvé"');
    console.log(services.stdout || services.stderr);

    // 3. Vérifier les ports ouverts
    console.log('\n🔌 Ports en écoute:');
    const ports = await client.executeCommand('netstat -tuln | grep -E ":(8000|3001|5432)" || ss -tuln | grep -E ":(8000|3001|5432)" || echo "Commande netstat/ss non disponible"');
    console.log(ports.stdout || ports.stderr);

    // 4. Vérifier les conteneurs Easypanel
    console.log('\n📋 Tous les conteneurs Docker:');
    const allContainers = await client.executeCommand('docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Ports}}"');
    console.log(allContainers.stdout || allContainers.stderr);

    // 5. Tester la connexion sur différents ports
    console.log('\n🧪 Test de connexion HTTP:');
    const testPorts = ['8000', '3001', '3000'];
    for (const port of testPorts) {
      const test = await client.executeCommand(`curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 http://localhost:${port} || echo "timeout"`);
      const status = test.stdout.trim();
      if (status && status !== 'timeout' && status !== '000') {
        console.log(`   Port ${port}: Accessible (HTTP ${status})`);
        
        // Essayer de récupérer des infos
        const info = await client.executeCommand(`curl -s --connect-timeout 2 http://localhost:${port}/rest/v1/ || echo ""`);
        if (info.stdout && info.stdout.includes('PostgREST')) {
          console.log(`   ✅ Port ${port} semble être Supabase API (PostgREST détecté)`);
        }
      } else {
        console.log(`   Port ${port}: Non accessible`);
      }
    }

    // 6. Vérifier les variables d'environnement Easypanel
    console.log('\n🔍 Recherche de configuration Easypanel:');
    const easypanelConfig = await client.executeCommand('find /data -name "*supabase*" -type f 2>/dev/null | head -5 || echo "Aucun fichier de config trouvé"');
    console.log(easypanelConfig.stdout || easypanelConfig.stderr);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    client.disconnect();
  }
}

checkSupabaseURL().catch(console.error);
