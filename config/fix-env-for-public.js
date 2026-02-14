/**
 * Script pour corriger les URLs localhost dans le .env pour un accès public
 * Remplace localhost par l'IP publique du serveur
 * 
 * Usage: node config/fix-env-for-public.js [IP_OU_DOMAINE]
 */

const SSHClient = require('./ssh-client');
const fs = require('fs');
const path = require('path');

const LOCAL_ENV_FILE = path.join(__dirname, 'supabase.env.local');
const VPS_IP = '78.47.97.137'; // IP par défaut depuis ssh.json

// Ports Supabase standards
const PORTS = {
  studio: 3001,
  kongHttp: 8000,
  kongHttps: 8443
};

async function fixEnvForPublic(publicUrl) {
  console.log('🔧 Correction des URLs localhost pour accès public...\n');

  if (!fs.existsSync(LOCAL_ENV_FILE)) {
    console.error(`❌ Le fichier ${LOCAL_ENV_FILE} n'existe pas`);
    console.error('💡 Exécutez d\'abord: node config/pull-supabase-env.js\n');
    process.exit(1);
  }

  // Déterminer l'URL publique (IP ou domaine)
  const publicHost = publicUrl || VPS_IP;
  const protocol = publicUrl && publicUrl.includes('://') ? '' : 'http://';
  const baseUrl = publicUrl || `${protocol}${VPS_IP}`;

  console.log(`🌐 URL publique configurée: ${baseUrl}\n`);

  // Lire le fichier .env
  let envContent = fs.readFileSync(LOCAL_ENV_FILE, 'utf8');
  const lines = envContent.split('\n');
  const replacements = [];

  // Variables à corriger (mapping: variable => [port, description])
  const varsToFix = {
    'SITE_URL': [PORTS.studio, 'Supabase Studio'],
    'API_EXTERNAL_URL': [PORTS.kongHttp, 'Kong API Gateway'],
    'SUPABASE_PUBLIC_URL': [PORTS.kongHttp, 'API Publique Supabase'],
    'KONG_HTTP_URL': [PORTS.kongHttp, 'Kong HTTP'],
    'KONG_HTTPS_URL': [PORTS.kongHttps, 'Kong HTTPS']
  };

  // Rechercher et remplacer les localhost
  const updatedLines = lines.map((line, index) => {
    // Ignorer les commentaires et lignes vides
    if (line.trim().startsWith('#') || !line.trim()) {
      return line;
    }

    const match = line.match(/^([A-Z_]+)=(.+)$/);
    if (!match) {
      return line;
    }

    const key = match[1];
    const value = match[2].trim().replace(/^["']|["']$/g, ''); // Enlever les guillemets

    // Vérifier si cette variable doit être corrigée
    if (varsToFix.hasOwnProperty(key)) {
      const [port, description] = varsToFix[key];
      
      // Si contient localhost, le remplacer
      if (value.includes('localhost') || value.includes('127.0.0.1')) {
        const newUrl = `${baseUrl}:${port}`;
        replacements.push({ key, old: value, new: newUrl, description, line: index + 1 });
        return `${key}=${newUrl}`;
      }
    }

    return line;
  });

  // Si des modifications ont été faites, sauvegarder
  if (replacements.length > 0) {
    const updatedContent = updatedLines.join('\n');
    fs.writeFileSync(LOCAL_ENV_FILE, updatedContent);

    console.log('✅ Modifications effectuées:\n');
    replacements.forEach(({ key, old, new: newValue, description, line }) => {
      console.log(`   ${key} (ligne ${line}):`);
      console.log(`      Avant: ${old}`);
      console.log(`      Après: ${newValue}`);
      console.log(`      → ${description}\n`);
    });

    console.log(`\n📝 Fichier mis à jour: ${LOCAL_ENV_FILE}`);
    console.log('\n💡 Prochaines étapes:');
    console.log('   1. Vérifiez les modifications dans le fichier');
    console.log('   2. Envoyez sur le serveur: node config/push-supabase-env.js');
    console.log('   3. Redémarrez Supabase: node config/restart-supabase.js');
    console.log(`   4. Configurez votre frontend avec:`);
    console.log(`      SUPABASE_URL=${baseUrl}:${PORTS.kongHttp}`);
    console.log(`      SUPABASE_ANON_KEY=<récupéré depuis Supabase Studio>\n`);

  } else {
    console.log('✅ Aucune variable localhost trouvée - le fichier est déjà configuré pour un accès public\n');
  }
}

// Exécution
async function main() {
  try {
    const publicUrl = process.argv[2]; // Optionnel: domaine ou IP personnalisée
    await fixEnvForPublic(publicUrl);
  } catch (error) {
    console.error('\n❌ Erreur fatale:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { fixEnvForPublic };
