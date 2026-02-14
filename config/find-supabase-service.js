/**
 * Script pour trouver le service Supabase dans Easypanel
 */

const SSHClient = require('./ssh-client');

async function findSupabaseService() {
  console.log('🔍 Recherche du service Supabase...\n');

  const client = new SSHClient();

  try {
    await client.connect();

    // 1. Lister tous les services Docker Swarm
    console.log('📋 Services Docker Swarm:');
    const swarmServices = await client.executeCommand('docker service ls');
    console.log(swarmServices.stdout || swarmServices.stderr);

    // 2. Lister tous les conteneurs
    console.log('\n📦 Tous les conteneurs:');
    const allContainers = await client.executeCommand('docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Ports}}"');
    console.log(allContainers.stdout || allContainers.stderr);

    // 3. Chercher des services avec "supabase" dans le nom
    console.log('\n🔍 Services contenant "supabase":');
    const supabaseServices = await client.executeCommand('docker service ls | grep -i supabase || docker ps | grep -i supabase || echo "Aucun service/conteneur Supabase trouvé"');
    console.log(supabaseServices.stdout || supabaseServices.stderr);

    // 4. Vérifier les ports exposés
    console.log('\n🔌 Ports exposés par les conteneurs:');
    const exposedPorts = await client.executeCommand('docker ps --format "{{.Names}}: {{.Ports}}"');
    console.log(exposedPorts.stdout || exposedPorts.stderr);

    // 5. Vérifier si Easypanel a des services déployés
    console.log('\n🎯 Services Easypanel (recherche dans /data):');
    const easypanelData = await client.executeCommand('ls -la /data 2>/dev/null | head -10 || echo "Dossier /data non accessible"');
    console.log(easypanelData.stdout || easypanelData.stderr);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error.stack);
  } finally {
    client.disconnect();
  }
}

findSupabaseService().catch(console.error);
