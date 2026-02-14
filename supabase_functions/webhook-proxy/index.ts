// Supabase Edge Function (Deno) - webhook-proxy
// Template: lit un JSON de configuration via variable d'environnement WEBHOOKS_CONFIG
// et proxy les appels client vers les webhooks externes en ajoutant les headers configurés.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response('Method Not Allowed', { 
        status: 405, 
        headers: corsHeaders 
      });
    }

    // Lire la config des webhooks depuis une variable d'environnement sécurisée
    const cfgRaw = Deno.env.get('WEBHOOKS_CONFIG');
    if (!cfgRaw) {
      return new Response('Webhooks config not set', { 
        status: 500, 
        headers: corsHeaders 
      });
    }

    let cfg: Record<string, any>;
    try { 
      cfg = JSON.parse(cfgRaw); 
    } catch (e) { 
      return new Response('Invalid WEBHOOKS_CONFIG JSON', { 
        status: 500, 
        headers: corsHeaders 
      });
    }

    const body = await req.json().catch(() => null);
    if (!body || !body.type) {
      return new Response('Invalid body (expected { type, payload })', { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    const entry = cfg[body.type];
    if (!entry || !entry.url) {
      return new Response(JSON.stringify({ error: 'Webhook not configured for type: ' + body.type }), { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Build headers for external webhook
    const webhookHeaders = new Headers();
    webhookHeaders.set('Content-Type', 'application/json');
    if (entry.headers) {
      for (const k of Object.keys(entry.headers)) {
        webhookHeaders.set(k, entry.headers[k]);
      }
    }

    // Forward payload (wrap with metadata) - labels en français
    const payload = {
      date_envoi: new Date().toISOString(),
      source: 'velox-mobile',
      type_webhook: body.type,
      utilisateur: body.utilisateur || { nom_complet: 'Inconnu', email: 'non.defini@velox.com' },
      donnees: body.donnees || body.payload || {}
    };

    console.log('Forwarding to:', entry.url);
    console.log('Payload:', JSON.stringify(payload, null, 2));

    const resp = await fetch(entry.url, { 
      method: 'POST', 
      headers: webhookHeaders, 
      body: JSON.stringify(payload) 
    });

    const text = await resp.text().catch(() => '');
    
    return new Response(
      JSON.stringify({ 
        success: true,
        status: resp.status, 
        response: text 
      }), 
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (err) {
    console.error('Error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal Error', details: String(err) }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
