/**
 * Serveur MCP (Model Context Protocol) pour Supabase Self-Hosted
 * 
 * Ce serveur permet à Cursor/Claude d'interagir directement avec Supabase
 * via des outils structurés plutôt que via SSH ou API REST manuelle.
 * 
 * Usage:
 *   1. Installer: npm install @modelcontextprotocol/sdk pg
 *   2. Configurer les credentials dans ce fichier
 *   3. Démarrer: node config/mcp-supabase-server.js
 *   4. Configurer dans Cursor MCP settings
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  CallToolRequestSchema,
  ListToolsRequestSchema 
} from '@modelcontextprotocol/sdk/types.js';
import { Client } from 'pg';

// Configuration Supabase (à adapter selon votre installation)
const SUPABASE_CONFIG = {
  // Connexion PostgreSQL directe
  postgres: {
    host: '78.47.97.137',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: 'q7PVChcIAu8bOrGK', // À récupérer depuis .env
  },
  // API REST Supabase
  api: {
    url: 'http://78.47.97.137:8000',
    serviceRoleKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q'
  }
};

// Créer le serveur MCP
const server = new Server(
  {
    name: 'supabase-self-hosted',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Client PostgreSQL (lazy connection)
let pgClient = null;

async function getPgClient() {
  if (!pgClient) {
    pgClient = new Client(SUPABASE_CONFIG.postgres);
    await pgClient.connect();
  }
  return pgClient;
}

// Liste des outils disponibles
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'execute_sql',
      description: 'Exécute une requête SQL sur Supabase PostgreSQL',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'La requête SQL à exécuter (SELECT, INSERT, UPDATE, DELETE, etc.)'
          }
        },
        required: ['query']
      }
    },
    {
      name: 'list_tables',
      description: 'Liste toutes les tables de la base de données publique',
      inputSchema: {
        type: 'object',
        properties: {
          schema: {
            type: 'string',
            description: 'Le schéma à lister (défaut: public)',
            default: 'public'
          }
        }
      }
    },
    {
      name: 'get_table_schema',
      description: 'Récupère le schéma complet d\'une table (colonnes, types, contraintes)',
      inputSchema: {
        type: 'object',
        properties: {
          tableName: {
            type: 'string',
            description: 'Le nom de la table'
          },
          schema: {
            type: 'string',
            description: 'Le schéma de la table (défaut: public)',
            default: 'public'
          }
        },
        required: ['tableName']
      }
    },
    {
      name: 'get_table_data',
      description: 'Récupère les données d\'une table avec pagination',
      inputSchema: {
        type: 'object',
        properties: {
          tableName: {
            type: 'string',
            description: 'Le nom de la table'
          },
          limit: {
            type: 'number',
            description: 'Nombre de lignes à récupérer (défaut: 10)',
            default: 10
          },
          offset: {
            type: 'number',
            description: 'Offset pour la pagination (défaut: 0)',
            default: 0
          },
          schema: {
            type: 'string',
            description: 'Le schéma de la table (défaut: public)',
            default: 'public'
          }
        },
        required: ['tableName']
      }
    },
    {
      name: 'get_rls_policies',
      description: 'Récupère les politiques RLS (Row Level Security) d\'une table',
      inputSchema: {
        type: 'object',
        properties: {
          tableName: {
            type: 'string',
            description: 'Le nom de la table'
          },
          schema: {
            type: 'string',
            description: 'Le schéma de la table (défaut: public)',
            default: 'public'
          }
        },
        required: ['tableName']
      }
    },
    {
      name: 'create_rls_policy',
      description: 'Crée une politique RLS pour une table',
      inputSchema: {
        type: 'object',
        properties: {
          tableName: {
            type: 'string',
            description: 'Le nom de la table'
          },
          policyName: {
            type: 'string',
            description: 'Le nom de la politique'
          },
          operation: {
            type: 'string',
            description: 'L\'opération (SELECT, INSERT, UPDATE, DELETE)',
            enum: ['SELECT', 'INSERT', 'UPDATE', 'DELETE']
          },
          definition: {
            type: 'string',
            description: 'La condition USING (pour SELECT/DELETE) ou WITH CHECK (pour INSERT/UPDATE)'
          },
          roles: {
            type: 'array',
            items: { type: 'string' },
            description: 'Les rôles concernés (authenticated, anon, etc.)',
            default: ['authenticated']
          },
          schema: {
            type: 'string',
            description: 'Le schéma de la table (défaut: public)',
            default: 'public'
          }
        },
        required: ['tableName', 'policyName', 'operation', 'definition']
      }
    }
  ]
}));

// Gestion des appels d'outils
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const client = await getPgClient();

  try {
    switch (name) {
      case 'execute_sql':
        {
          const result = await client.query(args.query);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  rows: result.rows,
                  rowCount: result.rowCount,
                  command: result.command
                }, null, 2)
              }
            ]
          };
        }

      case 'list_tables':
        {
          const schema = args.schema || 'public';
          const result = await client.query(`
            SELECT 
              table_name,
              table_type
            FROM information_schema.tables 
            WHERE table_schema = $1
            ORDER BY table_name
          `, [schema]);
          
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result.rows, null, 2)
              }
            ]
          };
        }

      case 'get_table_schema':
        {
          const schema = args.schema || 'public';
          const result = await client.query(`
            SELECT 
              column_name,
              data_type,
              is_nullable,
              column_default,
              character_maximum_length
            FROM information_schema.columns
            WHERE table_schema = $1 AND table_name = $2
            ORDER BY ordinal_position
          `, [schema, args.tableName]);
          
          if (result.rows.length === 0) {
            return {
              content: [
                {
                  type: 'text',
                  text: `Table ${schema}.${args.tableName} not found`
                }
              ],
              isError: true
            };
          }
          
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result.rows, null, 2)
              }
            ]
          };
        }

      case 'get_table_data':
        {
          const schema = args.schema || 'public';
          const limit = args.limit || 10;
          const offset = args.offset || 0;
          
          // Vérifier que la table existe
          const tableCheck = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = $1 AND table_name = $2
          `, [schema, args.tableName]);
          
          if (tableCheck.rows.length === 0) {
            return {
              content: [
                {
                  type: 'text',
                  text: `Table ${schema}.${args.tableName} not found`
                }
              ],
              isError: true
            };
          }
          
          // Récupérer les données
          const result = await client.query(`
            SELECT * 
            FROM ${client.escapeIdentifier(schema)}.${client.escapeIdentifier(args.tableName)}
            LIMIT $1 OFFSET $2
          `, [limit, offset]);
          
          // Compter le total
          const countResult = await client.query(`
            SELECT COUNT(*) as total
            FROM ${client.escapeIdentifier(schema)}.${client.escapeIdentifier(args.tableName)}
          `);
          
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  rows: result.rows,
                  total: parseInt(countResult.rows[0].total),
                  limit,
                  offset
                }, null, 2)
              }
            ]
          };
        }

      case 'get_rls_policies':
        {
          const schema = args.schema || 'public';
          const result = await client.query(`
            SELECT 
              policyname,
              permissive,
              roles,
              cmd,
              qual,
              with_check
            FROM pg_policies
            WHERE schemaname = $1 AND tablename = $2
            ORDER BY policyname
          `, [schema, args.tableName]);
          
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result.rows, null, 2)
              }
            ]
          };
        }

      case 'create_rls_policy':
        {
          const schema = args.schema || 'public';
          const roles = args.roles || ['authenticated'];
          const rolesStr = roles.map(r => `'${r}'`).join(', ');
          
          // Construire la requête CREATE POLICY
          let policySQL = `
            CREATE POLICY "${args.policyName}"
            ON ${client.escapeIdentifier(schema)}.${client.escapeIdentifier(args.tableName)}
            FOR ${args.operation}
            TO ${rolesStr}
          `;
          
          if (args.operation === 'SELECT' || args.operation === 'DELETE') {
            policySQL += `\nUSING (${args.definition})`;
          } else {
            policySQL += `\nWITH CHECK (${args.definition})`;
          }
          
          await client.query(policySQL);
          
          return {
            content: [
              {
                type: 'text',
                text: `Policy "${args.policyName}" created successfully on ${schema}.${args.tableName}`
              }
            ]
          };
        }

      default:
        return {
          content: [
            {
              type: 'text',
              text: `Unknown tool: ${name}`
            }
          ],
          isError: true
        };
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}\n${error.stack}`
        }
      ],
      isError: true
    };
  }
});

// Nettoyage à la fermeture
process.on('SIGINT', async () => {
  if (pgClient) {
    await pgClient.end();
  }
  process.exit(0);
});

// Démarrer le serveur
const transport = new StdioServerTransport();
await server.connect(transport);

console.error('MCP Supabase Server started');
