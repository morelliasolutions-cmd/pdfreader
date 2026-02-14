/**
 * Script pour supprimer complètement Supabase du serveur
 * 
 * ⚠️ ATTENTION: Cette opération est IRRÉVERSIBLE !
 * Toutes les données Supabase seront définitivement supprimées.
 * 
 * Usage: node config/remove-supabase.js
 */

const SSHClient = require('./ssh-client');

const SUPABASE_DEPLOY_PATH = '/opt/supabase/docker';

async function removeSupabase() {
  console.log('🗑️  Suppression complète de Supabase...\n');
  console.log('⚠️  ATTENTION: Cette opération est IRRÉVERSIBLE !\n');

  const client = new SSHClient();

  try {
    await client.connect();

    // ============================================
    // 1. ARRÊTER ET SUPPRIMER LES CONTENEURS
    // ============================================
    console.log('📦 Arrêt et suppression des conteneurs Supabase...');
    
    // Vérifier d'abord si des conteneurs existent
    const checkContainers = await client.executeCommand(
      `docker ps -a --filter "name=supabase" --format "{{.Names}}" | wc -l`
    );
    
    const containerCount = parseInt(checkContainers.stdout.trim()) || 0;
    
    if (containerCount > 0) {
      // Arrêter tous les conteneurs Supabase
      console.log('   Arrêt des conteneurs...');
      await client.executeCommand(
        `cd ${SUPABASE_DEPLOY_PATH} 2>/dev/null && docker compose down -v || docker ps -a --filter "name=supabase" -q | xargs -r docker stop`
      );
      
      // Supprimer tous les conteneurs Supabase
      console.log('   Suppression des conteneurs...');
      await client.executeCommand(
        `docker ps -a --filter "name=supabase" -q | xargs -r docker rm -f`
      );
      console.log('   ✅ Conteneurs supprimés');
    } else {
      console.log('   ℹ️  Aucun conteneur Supabase trouvé');
    }

    // ============================================
    // 2. SUPPRIMER LES VOLUMES DOCKER
    // ============================================
    console.log('\n💾 Suppression des volumes Docker Supabase...');
    
    const checkVolumes = await client.executeCommand(
      `docker volume ls --filter "name=supabase" --format "{{.Name}}" | wc -l`
    );
    
    const volumeCount = parseInt(checkVolumes.stdout.trim()) || 0;
    
    if (volumeCount > 0) {
      // Lister les volumes pour affichage
      const listVolumes = await client.executeCommand(
        `docker volume ls --filter "name=supabase" --format "{{.Name}}"`
      );
      
      if (listVolumes.stdout.trim()) {
        console.log('   Volumes trouvés:');
        listVolumes.stdout.trim().split('\n').forEach(vol => {
          if (vol) console.log(`     - ${vol}`);
        });
      }
      
      // Supprimer tous les volumes Supabase
      await client.executeCommand(
        `docker volume ls --filter "name=supabase" -q | xargs -r docker volume rm`
      );
      console.log('   ✅ Volumes supprimés');
    } else {
      console.log('   ℹ️  Aucun volume Supabase trouvé');
    }

    // ============================================
    // 3. SUPPRIMER LES RÉSEAUX DOCKER
    // ============================================
    console.log('\n🌐 Suppression des réseaux Docker Supabase...');
    
    const checkNetworks = await client.executeCommand(
      `docker network ls --filter "name=supabase" --format "{{.Name}}" | wc -l`
    );
    
    const networkCount = parseInt(checkNetworks.stdout.trim()) || 0;
    
    if (networkCount > 0) {
      // Lister les réseaux
      const listNetworks = await client.executeCommand(
        `docker network ls --filter "name=supabase" --format "{{.Name}}"`
      );
      
      if (listNetworks.stdout.trim()) {
        console.log('   Réseaux trouvés:');
        listNetworks.stdout.trim().split('\n').forEach(net => {
          if (net) console.log(`     - ${net}`);
        });
      }
      
      // Supprimer les réseaux (sauf les réseaux par défaut)
      await client.executeCommand(
        `docker network ls --filter "name=supabase" -q | xargs -r docker network rm 2>/dev/null || true`
      );
      console.log('   ✅ Réseaux supprimés');
    } else {
      console.log('   ℹ️  Aucun réseau Supabase trouvé');
    }

    // ============================================
    // 4. SUPPRIMER LES IMAGES DOCKER (optionnel)
    // ============================================
    console.log('\n🖼️  Recherche des images Docker Supabase...');
    
    const checkImages = await client.executeCommand(
      `docker images --filter "reference=*supabase*" --format "{{.Repository}}:{{.Tag}}" | wc -l`
    );
    
    const imageCount = parseInt(checkImages.stdout.trim()) || 0;
    
    if (imageCount > 0) {
      // Lister les images
      const listImages = await client.executeCommand(
        `docker images --filter "reference=*supabase*" --format "{{.Repository}}:{{.Tag}}"`
      );
      
      if (listImages.stdout.trim()) {
        console.log('   Images trouvées:');
        listImages.stdout.trim().split('\n').forEach(img => {
          if (img) console.log(`     - ${img}`);
        });
        
        // Demander confirmation pour les images (elles peuvent être partagées)
        console.log('\n   ⚠️  Les images Docker seront conservées (peuvent être partagées)');
        console.log('   Pour les supprimer manuellement:');
        console.log('     docker images --filter "reference=*supabase*" -q | xargs docker rmi');
      }
    } else {
      console.log('   ℹ️  Aucune image Supabase trouvée');
    }

    // ============================================
    // 5. SUPPRIMER LES FICHIERS/DOSSIERS
    // ============================================
    console.log('\n📁 Suppression des fichiers et dossiers Supabase...');
    
    // Vérifier si le dossier existe
    const checkDir = await client.executeCommand(
      `test -d ${SUPABASE_DEPLOY_PATH} && echo "exists" || echo "notfound"`
    );
    
    if (checkDir.stdout.trim() === 'exists') {
      console.log(`   Suppression de ${SUPABASE_DEPLOY_PATH}...`);
      await client.executeCommand(`rm -rf ${SUPABASE_DEPLOY_PATH}`);
      console.log('   ✅ Dossier supprimé');
    } else {
      console.log(`   ℹ️  Le dossier ${SUPABASE_DEPLOY_PATH} n'existe pas`);
    }

    // Vérifier /opt/supabase (parent directory)
    const checkParentDir = await client.executeCommand(
      `test -d /opt/supabase && ls -la /opt/supabase 2>/dev/null | grep -v "^total" | grep -v "^d\\.\\." | wc -l || echo "0"`
    );
    
    const parentDirCount = parseInt(checkParentDir.stdout.trim()) || 0;
    
    if (parentDirCount === 0) {
      console.log('   Suppression du dossier parent /opt/supabase...');
      await client.executeCommand(`rm -rf /opt/supabase`);
      console.log('   ✅ Dossier parent supprimé');
    }

    // Vérifier d'autres emplacements possibles
    const otherPaths = [
      '/var/lib/docker/volumes',
      '/home/supabase',
      '/root/supabase'
    ];

    for (const path of otherPaths) {
      const checkPath = await client.executeCommand(
        `test -d ${path} && echo "exists" || echo "notfound"`
      );
      
      if (checkPath.stdout.trim() === 'exists') {
        const checkSupabase = await client.executeCommand(
          `find ${path} -name "*supabase*" -type d 2>/dev/null | head -1`
        );
        
        if (checkSupabase.stdout.trim()) {
          console.log(`   ⚠️  Des éléments Supabase trouvés dans ${path}`);
          console.log(`      Pour supprimer: find ${path} -name "*supabase*" -exec rm -rf {} +`);
        }
      }
    }

    // ============================================
    // 6. NETTOYER LES RÉSIDUS
    // ============================================
    console.log('\n🧹 Nettoyage des résidus Docker...');
    
    // Nettoyer les conteneurs arrêtés
    await client.executeCommand(`docker container prune -f`);
    
    // Nettoyer les volumes non utilisés
    await client.executeCommand(`docker volume prune -f`);
    
    // Nettoyer les réseaux non utilisés
    await client.executeCommand(`docker network prune -f`);
    
    console.log('   ✅ Nettoyage terminé');

    // ============================================
    // 7. VÉRIFICATION FINALE
    // ============================================
    console.log('\n✅ Vérification finale...\n');
    
    const finalCheck = await client.executeCommand(
      `docker ps -a --filter "name=supabase" --format "{{.Names}}" | wc -l && docker volume ls --filter "name=supabase" --format "{{.Name}}" | wc -l`
    );
    
    const [finalContainers, finalVolumes] = finalCheck.stdout.trim().split('\n').map(s => parseInt(s.trim()) || 0);
    
    if (finalContainers === 0 && finalVolumes === 0) {
      console.log('✅ Supabase a été complètement supprimé du serveur !\n');
    } else {
      console.log('⚠️  Quelques éléments peuvent encore exister:');
      if (finalContainers > 0) console.log(`   - ${finalContainers} conteneur(s)`);
      if (finalVolumes > 0) console.log(`   - ${finalVolumes} volume(s)`);
      console.log('\n   Vous pouvez les supprimer manuellement si nécessaire.\n');
    }

    console.log('📋 Récapitulatif:');
    console.log('   ✅ Conteneurs Docker: Supprimés');
    console.log('   ✅ Volumes Docker: Supprimés');
    console.log('   ✅ Réseaux Docker: Supprimés');
    console.log('   ✅ Fichiers/Dossiers: Supprimés');
    console.log('   ⚠️  Images Docker: Conservées (suppression manuelle si besoin)\n');

  } catch (error) {
    console.error('\n❌ Erreur lors de la suppression:', error.message);
    throw error;
  } finally {
    client.disconnect();
  }
}

// Exécution
async function main() {
  try {
    await removeSupabase();
  } catch (error) {
    console.error('\n❌ Échec de la suppression:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { removeSupabase };
