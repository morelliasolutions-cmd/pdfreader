/**
 * Script pour ajouter/exposer le port Studio dans docker-compose.yml
 * 
 * Usage: node config/add-studio-port.js
 */

const SSHClient = require('./ssh-client');

const SUPABASE_DEPLOY_PATH = '/opt/supabase/docker';
const NEW_STUDIO_PORT = 3001;

async function addStudioPort() {
  console.log('🔧 Ajout de l\'exposition du port Studio dans docker-compose.yml...\n');

  const client = new SSHClient();

  try {
    await client.connect();

    // Lire la section studio complète pour voir sa structure
    console.log('📋 Lecture de la configuration Studio actuelle...');
    const readStudio = await client.executeCommand(`cd ${SUPABASE_DEPLOY_PATH} && sed -n '/^  studio:/,/^  [a-z]/p' docker-compose.yml | head -30`);
    console.log('Configuration Studio:');
    console.log(readStudio.stdout.substring(0, 1000));
    console.log('\n');

    // Vérifier si la section ports existe déjà
    const checkPorts = await client.executeCommand(`cd ${SUPABASE_DEPLOY_PATH} && sed -n '/^  studio:/,/^  [a-z]/p' docker-compose.yml | grep -E "ports:" || echo "notfound"`);
    
    if (checkPorts.stdout.includes('notfound')) {
      console.log('📝 Ajout de la section ports pour Studio...');
      
      // Ajouter la section ports après healthcheck ou depends_on
      const addPorts = `cd ${SUPABASE_DEPLOY_PATH} && sed -i '/^  studio:/,/^  [a-z]/ { /healthcheck:/a\    ports:\n      - "${NEW_STUDIO_PORT}:3000"\n    ; }' docker-compose.yml`;
      
      // Approche alternative : utiliser Python ou awk pour une insertion plus précise
      // Insérer après la ligne "restart:" ou "healthcheck:" dans la section studio
      const pythonScript = `
import sys
import re

with open('docker-compose.yml', 'r') as f:
    lines = f.readlines()

in_studio = False
ports_added = False
result = []

for i, line in enumerate(lines):
    if 'studio:' in line:
        in_studio = True
        ports_added = False
    elif in_studio and line.strip() and not line.startswith(' ') and not line.startswith('#'):
        in_studio = False
    
    result.append(line)
    
    if in_studio and not ports_added and ('restart:' in line or 'healthcheck:' in lines[i+1] if i+1 < len(lines) else False):
        # Ajouter ports après restart
        if 'restart:' in line:
            indent = len(line) - len(line.lstrip())
            result.append(' ' * indent + 'ports:\\n')
            result.append(' ' * (indent + 2) + f'- "{NEW_STUDIO_PORT}:3000"\\n')
            ports_added = True

with open('docker-compose.yml', 'w') as f:
    f.writelines(result)
`;

      // Méthode plus simple : utiliser sed pour insérer après restart
      const insertPorts = `cd ${SUPABASE_DEPLOY_PATH} && python3 << 'PYTHON_EOF'
import re

with open('docker-compose.yml', 'r') as f:
    content = f.read()

# Pattern pour trouver la section studio
studio_pattern = r'(  studio:.*?)(    restart:.*?\\n)(    environment:)'
replacement = r'\\1\\2    ports:\\n      - "${NEW_STUDIO_PORT}:3000"\\n\\3'

content = re.sub(studio_pattern, replacement, content, flags=re.DOTALL)

with open('docker-compose.yml', 'w') as f:
    f.write(content)
PYTHON_EOF`;

      const result = await client.executeCommand(insertPorts);
      
      if (result.code === 0) {
        console.log('✅ Ports ajoutés');
      } else {
        // Méthode manuelle avec sed
        console.log('⚠️  Tentative avec sed...');
        const manualAdd = `cd ${SUPABASE_DEPLOY_PATH} && awk '/^  studio:/ {print; getline; while (/^    / || /^$/) {print; getline} if (/restart:/) {print; print "    ports:"; print "      - \\"${NEW_STUDIO_PORT}:3000\\""; print; next} } 1' docker-compose.yml > docker-compose.yml.tmp && mv docker-compose.yml.tmp docker-compose.yml`;
        await client.executeCommand(manualAdd);
        console.log('✅ Ports ajoutés (méthode manuelle)');
      }
    } else {
      console.log('✅ Section ports existe déjà, modification du port...');
      // Modifier le port existant
      const modifyPort = `cd ${SUPABASE_DEPLOY_PATH} && sed -i '/^  studio:/,/^  [a-z]/ s/- "3000:3000"/- "${NEW_STUDIO_PORT}:3000"/' docker-compose.yml`;
      await client.executeCommand(modifyPort);
      console.log('✅ Port modifié');
    }

    // Vérifier la configuration finale
    console.log('\n📋 Vérification de la configuration finale...');
    const verify = await client.executeCommand(`cd ${SUPABASE_DEPLOY_PATH} && sed -n '/^  studio:/,/^  [a-z]/p' docker-compose.yml | grep -A 5 -E "(ports:|${NEW_STUDIO_PORT})" || echo "check"`);
    console.log('Configuration ports:');
    console.log(verify.stdout);

    // Redémarrer le service
    console.log('\n🔄 Redémarrage du service Studio...');
    const restart = await client.executeCommand(`cd ${SUPABASE_DEPLOY_PATH} && docker compose stop studio && docker compose up -d studio`);
    
    if (restart.code === 0) {
      console.log('✅ Service Studio redémarré');
    }

    // Vérifier le port exposé
    const finalCheck = await client.executeCommand(`docker ps --filter "name=supabase-studio" --format "{{.Ports}}"`);
    console.log('\n📊 Port finalement exposé:');
    console.log(finalCheck.stdout);

    console.log(`\n✅ Supabase Studio devrait être accessible sur: http://78.47.97.137:${NEW_STUDIO_PORT}\n`);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    throw error;
  } finally {
    client.disconnect();
  }
}

// Exécution
async function main() {
  try {
    await addStudioPort();
  } catch (error) {
    console.error('\n❌ Erreur fatale:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
