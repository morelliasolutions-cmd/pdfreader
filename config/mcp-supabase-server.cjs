/**
 * Serveur MCP (Model Context Protocol) pour Supabase Self-Hosted
 * Version CommonJS pour compatibilité maximale
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { 
  CallToolRequestSchema,
  ListToolsRequestSchema 
} = require('@modelcontextprotocol/sdk/types.js');
const { Client } = require('pg');

// Configuration Supabase (depuis .env ou direct)
const SUPABASE_CONFIG = {
  postgres: {
    host: '78.47.97.137',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: 'q7PVChcIAu8bOrGK',
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
    console.error('✅ PostgreSQL connected');
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
            description: 'La requête SQL à exécuter'
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
      description: 'Récupère le schéma complet d\'une table',
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
          }
        },
        required: ['tableName']
      }
    },
    {
      name: 'get_rls_policies',
      description: 'Récupère les politiques RLS d\'une table',
      inputSchema: {
        type: 'object',
        properties: {
          tableName: {
            type: 'string',
            description: 'Le nom de la table'
          }
        },
        required: ['tableName']
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
          const schema = args?.schema || 'public';
          const result = await client.query(`
            SELECT table_name, table_type
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
          const schema = args?.schema || 'public';
          const result = await client.query(`
            SELECT 
              column_name,
              data_type,
              is_nullable,
              column_default
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
          const schema = args?.schema || 'public';
          const limit = args?.limit || 10;
          const offset = args?.offset || 0;
          
          const result = await client.query(`
            SELECT * 
            FROM ${client.escapeIdentifier(schema)}.${client.escapeIdentifier(args.tableName)}
            LIMIT $1 OFFSET $2
          `, [limit, offset]);
          
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
          const schema = args?.schema || 'public';
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
          text: `Error: ${error.message}`
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
async function start() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('🚀 MCP Supabase Server started');
  } catch (error) {
    console.error('❌ Error starting MCP server:', error);
    process.exit(1);
  }
}

start();
