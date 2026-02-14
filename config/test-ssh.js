/**
 * Script de test de connexion SSH au VPS Easypanel
 * 
 * Usage: node config/test-ssh.js
 */

const SSHClient = require('./ssh-client');

async function testSSH() {
  console.log('🔌 Test de connexion SSH au VPS Easypanel...\n');

  try {
    const client = new SSHClient();
    
    // Test de connexion
    const connectionTest = await client.testConnection();
    
    if (connectionTest.success) {
      console.log('✅ Connexion SSH réussie !');
      console.log('Résultat:', connectionTest.result);
    } else {
      console.log('❌ Échec de la connexion SSH');
      console.log('Erreur:', connectionTest.error);
      console.log('\n💡 Vérifiez:');
      console.log('  1. Que votre hostname est correct dans config/ssh.json');
      console.log('  2. Que votre utilisateur SSH est correct');
      console.log('  3. Que votre clé privée SSH est accessible ou que le mot de passe est correct');
      console.log('  4. Que le serveur est accessible depuis votre machine');
      process.exit(1);
    }

    // Vérifier Docker
    console.log('\n🐳 Vérification de Docker...');
    await client.connect();
    const dockerCheck = await client.checkDocker();
    
    if (dockerCheck.installed) {
      console.log('✅ Docker installé:', dockerCheck.version);
    } else {
      console.log('⚠️  Docker non installé ou non accessible');
    }

    // Lister les conteneurs
    console.log('\n📦 Liste des conteneurs Docker:');
    const containers = await client.listDockerContainers();
    if (containers.success) {
      console.log(containers.containers);
    } else {
      console.log('❌ Erreur:', containers.error);
    }

    // Vérifier Supabase
    console.log('\n🔍 Vérification des services Supabase:');
    const supabaseServices = await client.checkSupabaseServices();
    if (supabaseServices.success) {
      console.log(supabaseServices.services || 'Aucun service Supabase trouvé');
    } else {
      console.log('ℹ️  Aucun service Supabase trouvé ou erreur:', supabaseServices.error);
    }

    client.disconnect();
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    
    if (error.message.includes('manquant')) {
      console.log('\n💡 Créez le fichier config/ssh.json à partir de config/ssh.example.json');
      console.log('   et remplissez vos informations SSH');
    }
    
    process.exit(1);
  }
}

// Exécuter le test
testSSH();
