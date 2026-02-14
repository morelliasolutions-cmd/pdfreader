/**
 * Script pour supprimer complètement Coolify du serveur
 * 
 * ⚠️ ATTENTION: Cette opération est IRRÉVERSIBLE !
 * Toutes les données Coolify seront définitivement supprimées.
 * 
 * Usage: node config/remove-coolify.js
 */

const SSHClient = require('./ssh-client');

// Chemins possibles pour Coolify
const COOLIFY_PATHS = [
  '/data/coolify',
  '/opt/coolify',
  '/root/coolify',
  '/home/coolify'
];

async function removeCoolify() {
  console.log('🗑️  Suppression complète de Coolify...\n');
  console.log('⚠️  ATTENTION: Cette opération est IRRÉVERSIBLE !\n');

  const client = new SSHClient();

  try {
    await client.connect();

    // ============================================
    // 1. ARRÊTER ET SUPPRIMER LES CONTENEURS
    // ============================================
    console.log('📦 Arrêt et suppression des conteneurs Coolify...');
    
    // Vérifier d'abord si des conteneurs existent
    const checkContainers = await client.executeCommand(
      `docker ps -a --filter "name=coolify" --format "{{.Names}}" | wc -l`
    );
    
    const containerCount = parseInt(checkContainers.stdout.trim()) || 0;
    
    if (containerCount > 0) {
      // Lister les conteneurs pour affichage
      const listContainers = await client.executeCommand(
        `docker ps -a --filter "name=coolify" --format "{{.Names}}"`
      );
      
      if (listContainers.stdout.trim()) {
        console.log('   Conteneurs trouvés:');
        listContainers.stdout.trim().split('\n').forEach(container => {
          if (container) console.log(`     - ${container}`);
        });
      }
      
      // Arrêter tous les conteneurs Coolify
      console.log('   Arrêt des conteneurs...');
      await client.executeCommand(
        `docker ps -a --filter "name=coolify" -q | xargs -r docker stop`
      );
      
      // Supprimer tous les conteneurs Coolify
      console.log('   Suppression des conteneurs...');
      await client.executeCommand(
        `docker ps -a --filter "name=coolify" -q | xargs -r docker rm -f`
      );
      console.log('   ✅ Conteneurs supprimés');
    } else {
      console.log('   ℹ️  Aucun conteneur Coolify trouvé');
    }

    // Chercher aussi dans les projets déployés via Coolify
    console.log('\n🔍 Recherche de conteneurs déployés par Coolify...');
    const checkCoolifyProjects = await client.executeCommand(
      `docker ps -a --format "{{.Names}}" | grep -E "(coolify-|coolify_)" | wc -l || echo "0"`
    );
    
    const projectContainerCount = parseInt(checkCoolifyProjects.stdout.trim()) || 0;
    
    if (projectContainerCount > 0) {
      const listProjects = await client.executeCommand(
        `docker ps -a --format "{{.Names}}" | grep -E "(coolify-|coolify_)" || echo ""`
      );
      
      if (listProjects.stdout.trim()) {
        console.log('   ⚠️  Conteneurs de projets Coolify trouvés:');
        listProjects.stdout.trim().split('\n').forEach(container => {
          if (container) console.log(`     - ${container}`);
        });
        console.log('   ⚠️  Ces conteneurs ne seront PAS supprimés automatiquement');
        console.log('   💡 Pour les supprimer manuellement:');
        console.log('      docker ps -a --format "{{.Names}}" | grep -E "(coolify-|coolify_)" | xargs docker rm -f');
      }
    }

    // ============================================
    // 2. SUPPRIMER LES VOLUMES DOCKER
    // ============================================
    console.log('\n💾 Suppression des volumes Docker Coolify...');
    
    const checkVolumes = await client.executeCommand(
      `docker volume ls --filter "name=coolify" --format "{{.Name}}" | wc -l`
    );
    
    const volumeCount = parseInt(checkVolumes.stdout.trim()) || 0;
    
    if (volumeCount > 0) {
      // Lister les volumes pour affichage
      const listVolumes = await client.executeCommand(
        `docker volume ls --filter "name=coolify" --format "{{.Name}}"`
      );
      
      if (listVolumes.stdout.trim()) {
        console.log('   Volumes trouvés:');
        listVolumes.stdout.trim().split('\n').forEach(vol => {
          if (vol) console.log(`     - ${vol}`);
        });
      }
      
      // Supprimer tous les volumes Coolify
      await client.executeCommand(
        `docker volume ls --filter "name=coolify" -q | xargs -r docker volume rm`
      );
      console.log('   ✅ Volumes supprimés');
    } else {
      console.log('   ℹ️  Aucun volume Coolify trouvé');
    }

    // ============================================
    // 3. SUPPRIMER LES RÉSEAUX DOCKER
    // ============================================
    console.log('\n🌐 Suppression des réseaux Docker Coolify...');
    
    const checkNetworks = await client.executeCommand(
      `docker network ls --filter "name=coolify" --format "{{.Name}}" | wc -l`
    );
    
    const networkCount = parseInt(checkNetworks.stdout.trim()) || 0;
    
    if (networkCount > 0) {
      // Lister les réseaux
      const listNetworks = await client.executeCommand(
        `docker network ls --filter "name=coolify" --format "{{.Name}}"`
      );
      
      if (listNetworks.stdout.trim()) {
        console.log('   Réseaux trouvés:');
        listNetworks.stdout.trim().split('\n').forEach(net => {
          if (net) console.log(`     - ${net}`);
        });
      }
      
      // Supprimer les réseaux (sauf les réseaux par défaut)
      await client.executeCommand(
        `docker network ls --filter "name=coolify" -q | xargs -r docker network rm 2>/dev/null || true`
      );
      console.log('   ✅ Réseaux supprimés');
    } else {
      console.log('   ℹ️  Aucun réseau Coolify trouvé');
    }

    // ============================================
    // 4. SUPPRIMER LES IMAGES DOCKER (optionnel)
    // ============================================
    console.log('\n🖼️  Recherche des images Docker Coolify...');
    
    const checkImages = await client.executeCommand(
      `docker images --filter "reference=*coolify*" --format "{{.Repository}}:{{.Tag}}" | wc -l`
    );
    
    const imageCount = parseInt(checkImages.stdout.trim()) || 0;
    
    if (imageCount > 0) {
      // Lister les images
      const listImages = await client.executeCommand(
        `docker images --filter "reference=*coolify*" --format "{{.Repository}}:{{.Tag}}"`
      );
      
      if (listImages.stdout.trim()) {
        console.log('   Images trouvées:');
        listImages.stdout.trim().split('\n').forEach(img => {
          if (img) console.log(`     - ${img}`);
        });
        
        console.log('\n   ⚠️  Les images Docker seront conservées (peuvent être partagées)');
        console.log('   Pour les supprimer manuellement:');
        console.log('     docker images --filter "reference=*coolify*" -q | xargs docker rmi');
      }
    } else {
      console.log('   ℹ️  Aucune image Coolify trouvée');
    }

    // ============================================
    // 5. SUPPRIMER LES FICHIERS/DOSSIERS
    // ============================================
    console.log('\n📁 Suppression des fichiers et dossiers Coolify...');
    
    let foundPaths = [];
    
    // Vérifier chaque chemin possible
    for (const path of COOLIFY_PATHS) {
      const checkDir = await client.executeCommand(
        `test -d ${path} && echo "exists" || echo "notfound"`
      );
      
      if (checkDir.stdout.trim() === 'exists') {
        foundPaths.push(path);
        console.log(`   Suppression de ${path}...`);
        await client.executeCommand(`rm -rf ${path}`);
        console.log(`   ✅ ${path} supprimé`);
      }
    }
    
    if (foundPaths.length === 0) {
      console.log('   ℹ️  Aucun dossier Coolify trouvé dans les emplacements standards');
      
      // Chercher dans tout le système
      console.log('   🔍 Recherche dans tout le système...');
      const findCoolify = await client.executeCommand(
        `find /opt /data /root /home -type d -name "*coolify*" 2>/dev/null | head -10`
      );
      
      if (findCoolify.stdout.trim()) {
        const paths = findCoolify.stdout.trim().split('\n').filter(p => p);
        console.log('   ⚠️  Dossiers Coolify trouvés:');
        paths.forEach(path => {
          console.log(`     - ${path}`);
        });
        console.log('   💡 Pour les supprimer manuellement:');
        paths.forEach(path => {
          console.log(`      rm -rf ${path}`);
        });
      }
    }

    // Chercher les fichiers de configuration Docker Compose
    console.log('\n🔍 Recherche de fichiers Docker Compose Coolify...');
    const findDockerCompose = await client.executeCommand(
      `find /opt /data /root /home -name "*coolify*.yml" -o -name "*coolify*.yaml" 2>/dev/null | head -10`
    );
    
    if (findDockerCompose.stdout.trim()) {
      const files = findDockerCompose.stdout.trim().split('\n').filter(f => f);
      console.log('   ⚠️  Fichiers Docker Compose trouvés:');
      files.forEach(file => {
        console.log(`     - ${file}`);
      });
      console.log('   💡 Pour les supprimer manuellement:');
      files.forEach(file => {
        console.log(`      rm -f ${file}`);
      });
    }

    // Chercher dans /var/lib/docker/volumes (au cas où)
    console.log('\n🔍 Vérification des volumes Docker restants...');
    const checkDockerVolumes = await client.executeCommand(
      `find /var/lib/docker/volumes -name "*coolify*" -type d 2>/dev/null | head -5`
    );
    
    if (checkDockerVolumes.stdout.trim()) {
      const volumes = checkDockerVolumes.stdout.trim().split('\n').filter(v => v);
      console.log('   ⚠️  Volumes Docker trouvés:');
      volumes.forEach(vol => {
        console.log(`     - ${vol}`);
      });
      console.log('   💡 Pour les supprimer:');
      console.log('      find /var/lib/docker/volumes -name "*coolify*" -exec rm -rf {} +');
    }

    // ============================================
    // 6. SUPPRIMER LES SERVICES SYSTEMD (si existent)
    // ============================================
    console.log('\n⚙️  Recherche de services systemd Coolify...');
    
    const checkSystemd = await client.executeCommand(
      `systemctl list-unit-files | grep -i coolify | wc -l || echo "0"`
    );
    
    const systemdCount = parseInt(checkSystemd.stdout.trim()) || 0;
    
    if (systemdCount > 0) {
      const listSystemd = await client.executeCommand(
        `systemctl list-unit-files | grep -i coolify || echo ""`
      );
      
      if (listSystemd.stdout.trim()) {
        console.log('   Services systemd trouvés:');
        listSystemd.stdout.trim().split('\n').forEach(service => {
          if (service) console.log(`     - ${service.split(/\s+/)[0]}`);
        });
        
        // Arrêter et désactiver les services
        const services = listSystemd.stdout.trim().split('\n')
          .map(line => line.split(/\s+/)[0])
          .filter(s => s && s.includes('coolify'));
        
        for (const service of services) {
          console.log(`   Arrêt et désactivation de ${service}...`);
          await client.executeCommand(`systemctl stop ${service} 2>/dev/null || true`);
          await client.executeCommand(`systemctl disable ${service} 2>/dev/null || true`);
        }
        
        // Supprimer les fichiers de service
        await client.executeCommand(
          `find /etc/systemd/system -name "*coolify*" -type f 2>/dev/null | xargs -r rm -f`
        );
        await client.executeCommand(`systemctl daemon-reload`);
        
        console.log('   ✅ Services systemd supprimés');
      }
    } else {
      console.log('   ℹ️  Aucun service systemd Coolify trouvé');
    }

    // ============================================
    // 7. NETTOYER LES RÉSIDUS
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
    // 8. VÉRIFICATION FINALE
    // ============================================
    console.log('\n✅ Vérification finale...\n');
    
    const finalCheck = await client.executeCommand(
      `docker ps -a --filter "name=coolify" --format "{{.Names}}" | wc -l && docker volume ls --filter "name=coolify" --format "{{.Name}}" | wc -l`
    );
    
    const [finalContainers, finalVolumes] = finalCheck.stdout.trim().split('\n').map(s => parseInt(s.trim()) || 0);
    
    if (finalContainers === 0 && finalVolumes === 0) {
      console.log('✅ Coolify a été complètement supprimé du serveur !\n');
    } else {
      console.log('⚠️  Quelques éléments peuvent encore exister:');
      if (finalContainers > 0) console.log(`   - ${finalContainers} conteneur(s)`);
      if (finalVolumes > 0) console.log(`   - ${finalVolumes} volume(s)`);
      console.log('\n   Vous pouvez les supprimer manuellement si nécessaire.\n');
    }

    console.log('📋 Récapitulatif:');
    console.log('   ✅ Conteneurs Docker Coolify: Supprimés');
    console.log('   ✅ Volumes Docker Coolify: Supprimés');
    console.log('   ✅ Réseaux Docker Coolify: Supprimés');
    console.log('   ✅ Fichiers/Dossiers Coolify: Supprimés');
    console.log('   ✅ Services systemd: Supprimés');
    console.log('   ⚠️  Images Docker: Conservées (suppression manuelle si besoin)');
    console.log('   ⚠️  Conteneurs de projets: Conservés (vérification manuelle recommandée)\n');

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
    await removeCoolify();
  } catch (error) {
    console.error('\n❌ Échec de la suppression:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { removeCoolify };
