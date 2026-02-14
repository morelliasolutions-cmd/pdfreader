/**
 * Script pour supprimer les volumes Supabase restants
 */

const SSHClient = require('./ssh-client');

async function removeSupabaseVolumes() {
  const client = new SSHClient();
  
  try {
    await client.connect();
    
    console.log('🗑️  Suppression des volumes Supabase...');
    
    // Lister d'abord
    const listResult = await client.executeCommand(
      'docker volume ls --filter "name=supabase" --format "{{.Name}}"'
    );
    
    if (listResult.stdout.trim()) {
      const volumes = listResult.stdout.trim().split('\n').filter(v => v);
      console.log(`   ${volumes.length} volume(s) trouvé(s):`);
      volumes.forEach(v => console.log(`     - ${v}`));
      
      // Supprimer
      const removeResult = await client.executeCommand(
        'docker volume ls --filter "name=supabase" -q | xargs -r docker volume rm 2>&1'
      );
      
      if (removeResult.stdout.trim()) {
        console.log('\n   ✅ Volumes supprimés:');
        console.log(removeResult.stdout);
      }
      
      // Vérifier
      const verifyResult = await client.executeCommand(
        'docker volume ls --filter "name=supabase" --format "{{.Name}}"'
      );
      
      if (!verifyResult.stdout.trim()) {
        console.log('\n   ✅ Tous les volumes Supabase ont été supprimés');
      } else {
        console.log('\n   ⚠️  Quelques volumes restent encore');
      }
    } else {
      console.log('   ✅ Aucun volume Supabase trouvé');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    throw error;
  } finally {
    client.disconnect();
  }
}

removeSupabaseVolumes().catch(console.error);
