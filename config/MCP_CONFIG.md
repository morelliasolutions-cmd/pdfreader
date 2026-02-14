# Configuration MCP Server pour Supabase Self-Hosted

## 📋 Résumé

Pour que Cursor/Claude puisse accéder à votre Supabase self-hosted via MCP, vous avez **2 options** :

### ❌ Option 1 : URL directe (ne fonctionne probablement pas)

Supabase ne expose **pas** d'endpoint `/mcp` par défaut. Si vous avez vu cette configuration :

```json
{
  "mcpServers": {
    "supabase": {
      "url": "http://78.47.97.137:8000/mcp"
    }
  }
}
```

Cette URL ne fonctionnera **pas** car Supabase n'a pas d'endpoint MCP natif.

### ✅ Option 2 : Serveur MCP personnalisé (recommandé)

Créer un serveur MCP local qui se connecte à Supabase via PostgreSQL.

## 🚀 Installation du serveur MCP personnalisé

### Étape 1 : Installer les dépendances

```bash
cd "c:\Users\etien\OneDrive\Morellia\Veloxnumeric\veloxnumeric-web Final"
npm install @modelcontextprotocol/sdk pg
```

### Étape 2 : Configurer les credentials

Éditez `config/mcp-supabase-server.js` et mettez à jour :

```javascript
const SUPABASE_CONFIG = {
  postgres: {
    host: '78.47.97.137',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: 'q7PVChcIAu8bOrGK', // Depuis votre .env
  }
};
```

### Étape 3 : Tester le serveur

```bash
node config/mcp-supabase-server.js
```

Le serveur devrait démarrer et afficher `MCP Supabase Server started` dans stderr.

### Étape 4 : Configurer dans Cursor

Dans Cursor, allez dans **Settings** → **MCP Servers** et ajoutez :

```json
{
  "mcpServers": {
    "supabase-self-hosted": {
      "command": "node",
      "args": [
        "C:\\Users\\etien\\OneDrive\\Morellia\\Veloxnumeric\\veloxnumeric-web Final\\config\\mcp-supabase-server.js"
      ],
      "env": {}
    }
  }
}
```

**Note** : Utilisez le chemin **absolu** vers le script.

## 🛠️ Outils disponibles

Une fois configuré, vous pourrez utiliser ces commandes dans Cursor :

- **`execute_sql`** : Exécuter n'importe quelle requête SQL
- **`list_tables`** : Lister toutes les tables
- **`get_table_schema`** : Voir le schéma d'une table
- **`get_table_data`** : Récupérer les données d'une table
- **`get_rls_policies`** : Voir les politiques RLS
- **`create_rls_policy`** : Créer une politique RLS

## 🔒 Sécurité

⚠️ **ATTENTION** : Le serveur MCP se connecte directement à PostgreSQL avec la clé **Service Role**, ce qui **bypass RLS**.

- Utilisez uniquement sur votre machine locale
- Ne partagez jamais les credentials
- Limitez les permissions PostgreSQL si possible

## 🔧 Alternative : Tunnel SSH

Pour plus de sécurité, utilisez un tunnel SSH :

```bash
ssh -L 5432:localhost:5432 root@78.47.97.137
```

Puis configurez le serveur MCP avec `host: 'localhost'` au lieu de `'78.47.97.137'`.

## 📝 Fichier de configuration Cursor (exemple complet)

```json
{
  "mcpServers": {
    "supabase-self-hosted": {
      "command": "node",
      "args": [
        "C:\\Users\\etien\\OneDrive\\Morellia\\Veloxnumeric\\veloxnumeric-web Final\\config\\mcp-supabase-server.js"
      ],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

## 🐛 Dépannage

### Le serveur ne démarre pas

1. Vérifiez que Node.js est installé : `node --version`
2. Vérifiez que les dépendances sont installées : `npm list @modelcontextprotocol/sdk pg`
3. Vérifiez les credentials dans le fichier

### Erreur de connexion PostgreSQL

1. Vérifiez que Supabase est démarré : `ssh root@78.47.97.137 "cd /opt/supabase/docker && docker compose ps"`
2. Vérifiez que le port 5432 est accessible (ou utilisez un tunnel SSH)
3. Vérifiez le mot de passe PostgreSQL dans `.env`

### Les outils ne fonctionnent pas dans Cursor

1. Redémarrez Cursor après avoir ajouté le serveur MCP
2. Vérifiez les logs dans la console Cursor
3. Vérifiez que le chemin vers le script est correct (absolu)

## 📚 Ressources

- [Documentation MCP](https://modelcontextprotocol.io)
- [Documentation Supabase](https://supabase.com/docs)
- Serveur MCP : `config/mcp-supabase-server.js`
