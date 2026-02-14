/**
 * Script pour vérifier et supprimer les conteneurs Supabase restants
 * 
 * Usage: node config/check-and-remove-supabase-containers.js
 */

const SSHClient = require('./ssh-client');

async function checkAndRemoveSupabaseContainers() {
  console.log('🔍 Vérification des conteneurs Supabase...\n');

  const client = new SSHClient();

  try {
    await client.connect();

    // Vérifier les conteneurs Supabase
    console.log('📦 Recherche des conteneurs Supabase...');
    const checkContainers = await client.executeCommand(
      `docker ps -a --filter "name=supabase" --format "{{.Names}}\t{{.Status}}"`
    );
    
    if (checkContainers.stdout.trim()) {
      const containers = checkContainers.stdout.trim().split('\n').filter(c => c);
      
      if (containers.length > 0) {
        console.log(`   ⚠️  ${containers.length} conteneur(s) Supabase trouvé(s):\n`);
        containers.forEach(container => {
          const [name, ...statusParts] = container.split('\t');
          const status = statusParts.join('\t');
          console.log(`     - ${name}: ${status}`);
        });
        
        console.log('\n🗑️  Suppression des conteneurs...');
        
        // Arrêter tous les conteneurs Supabase
        const stopResult = await client.executeCommand(
          `docker ps -a --filter "name=supabase" -q | xargs -r docker stop 2>/dev/null || true`
        );
        
        // Supprimer tous les conteneurs Supabase
        const removeResult = await client.executeCommand(
          `docker ps -a --filter "name=supabase" -q | xargs -r docker rm -f 2>/dev/null || true`
        );
        
        // Vérifier après suppression
        const verifyResult = await client.executeCommand(
          `docker ps -a --filter "name=supabase" --format "{{.Names}}" | wc -l`
        );
        
        const remainingCount = parseInt(verifyResult.stdout.trim()) || 0;
        
        if (remainingCount === 0) {
          console.log('   ✅ Tous les conteneurs Supabase ont été supprimés\n');
        } else {
          console.log(`   ⚠️  ${remainingCount} conteneur(s) reste(nt) encore\n`);
        }
      } else {
        console.log('   ✅ Aucun conteneur Supabase trouvé\n');
      }
    } else {
      console.log('   ✅ Aucun conteneur Supabase trouvé\n');
    }

    // Vérifier aussi les volumes
    console.log('💾 Vérification des volumes Supabase...');
    const checkVolumes = await client.executeCommand(
      `docker volume ls --filter "name=supabase" --format "{{.Name}}"`
    );
    
    if (checkVolumes.stdout.trim()) {
      const volumes = checkVolumes.stdout.trim().split('\n').filter(v => v);
      console.log(`   ⚠️  ${volumes.length} volume(s) Supabase trouvé(s):\n`);
      volumes.forEach(volume => {
        console.log(`     - ${volume}`);
      });
      
      console.log('\n   💡 Pour supprimer les volumes:');
      console.log('      docker volume ls --filter "name=supabase" -q | xargs docker volume rm\n');
    } else {
      console.log('   ✅ Aucun volume Supabase trouvé\n');
    }

    // Vérification finale
    console.log('✅ Vérification finale:\n');
    const finalCheck = await client.executeCommand(
      `echo "Conteneurs:" && docker ps -a --filter "name=supabase" --format "  - {{.Names}}" | head -5 && echo "Volumes:" && docker volume ls --filter "name=supabase" --format "  - {{.Name}}" | head -5`
    );
    
    if (finalCheck.stdout.trim()) {
      console.log(finalCheck.stdout);
    } else {
      console.log('   ✅ Aucun élément Supabase restant\n');
    }

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    throw error;
  } finally {
    client.disconnect();
  }
}

// Exécution
async function main() {
  try {
    await checkAndRemoveSupabaseContainers();
  } catch (error) {
    console.error('\n❌ Échec:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { checkAndRemoveSupabaseContainers };
