# 🚀 Démarrage Rapide MCP Supabase

## ✅ Ce qui est fait

- ✅ Serveur MCP créé : `config/mcp-supabase-server.cjs`
- ✅ Dépendances installées : `@modelcontextprotocol/sdk` et `pg`
- ✅ Configuration Cursor créée : `config/cursor-mcp-config.json`

## 📋 Configuration dans Cursor (3 étapes)

### 1. Trouver le fichier de config MCP de Cursor

Sur Windows, le fichier se trouve généralement dans :
```
%APPDATA%\Cursor\User\globalStorage\rooveterinaryinc.roo-cline\settings\cline_mcp_settings.json
```

OU dans les Settings de Cursor :
- Ouvrez Cursor
- Allez dans **Settings** (Ctrl+,)
- Cherchez **"MCP"** ou **"Model Context Protocol"**
- Copiez le contenu de `config/cursor-mcp-config.json`

### 2. Ajouter la configuration

Copiez cette configuration dans votre fichier MCP Cursor :

```json
{
  "mcpServers": {
    "supabase-self-hosted": {
      "command": "node",
      "args": [
        "C:\\Users\\etien\\OneDrive\\Morellia\\Veloxnumeric\\veloxnumeric-web Final\\config\\mcp-supabase-server.cjs"
      ],
      "env": {}
    }
  }
}
```

### 3. Redémarrer Cursor

⚠️ **Important** : Redémarrez Cursor complètement pour que les changements prennent effet.

## 🧪 Tester la connexion

Une fois Cursor redémarré, vous pouvez tester en me demandant :
- "Liste les tables de Supabase"
- "Montre-moi le schéma de la table X"
- "Exécute cette requête SQL : SELECT * FROM ma_table"

## 🔧 Si ça ne marche pas

1. **Vérifier que le script démarre** :
   ```bash
   node config/mcp-supabase-server.cjs
   ```
   (Il devrait rester ouvert, ne pas retourner d'erreur)

2. **Vérifier la connexion PostgreSQL** :
   - Le port 5432 doit être accessible depuis votre machine
   - OU utilisez un tunnel SSH : `ssh -L 5432:localhost:5432 root@78.47.97.137`

3. **Vérifier les logs Cursor** :
   - Regardez la console Cursor pour les erreurs MCP
   - Vérifiez que le chemin vers le script est correct

## 📝 Note sur la sécurité

Le serveur MCP se connecte directement à PostgreSQL avec les credentials admin. 
C'est normal pour un serveur MCP local, mais ne partagez jamais ces credentials.
