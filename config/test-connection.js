/**
 * Script de test de connexion à l'API Easypanel
 * 
 * Usage: node config/test-connection.js
 */

const EasypanelClient = require('./easypanel-client');

async function testConnection() {
  console.log('🔌 Test de connexion à Easypanel...\n');

  try {
    const client = new EasypanelClient();
    
    console.log(`📍 Hostname: ${client.baseURL}`);
    console.log(`🔑 API Key: ${client.apiKey.substring(0, 10)}...\n`);

    const result = await client.testConnection();
    
    if (result.success) {
      console.log('✅ Connexion réussie !');
      console.log('Réponse:', JSON.stringify(result.result, null, 2));
    } else {
      console.log('❌ Échec de la connexion');
      console.log('Erreur:', result.error);
      console.log('\n💡 Vérifiez:');
      console.log('  1. Que votre hostname est correct dans config/easypanel.json');
      console.log('  2. Que votre clé API est valide');
      console.log('  3. Que votre instance Easypanel est accessible');
    }
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    
    if (error.message.includes('manquant')) {
      console.log('\n💡 Créez le fichier config/easypanel.json à partir de config/easypanel.example.json');
    }
  }
}

// Exécuter le test
testConnection();
