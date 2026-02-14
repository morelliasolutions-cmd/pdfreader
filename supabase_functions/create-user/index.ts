// Edge Function Supabase pour créer un utilisateur complet
// Cette fonction nécessite la SERVICE_ROLE_KEY pour créer des utilisateurs

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Gérer les requêtes OPTIONS (CORS)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Récupérer la SERVICE_ROLE_KEY depuis les variables d'environnement
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Vérifier que l'utilisateur qui fait la requête est admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Authorization header manquant')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
    
    if (userError || !user) {
      throw new Error('Utilisateur non authentifié')
    }

    // Vérifier que l'utilisateur est admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (roleError || !roleData || roleData.role !== 'admin') {
      throw new Error('Accès refusé: Admin requis')
    }

    // Récupérer les données de la requête
    const {
      email,
      password,
      first_name,
      last_name,
      type,
      role_employee,
      status,
      start_date,
      vacation_days,
      role_system
    } = await req.json()

    // Validation
    if (!email || !password || !first_name || !last_name || !type || !role_employee || !status || !role_system) {
      throw new Error('Données manquantes')
    }

    // 1. Créer l'utilisateur dans auth.users
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirmer l'email
    })

    if (authError) {
      throw new Error(`Erreur création utilisateur: ${authError.message}`)
    }

    const userId = authData.user.id

    // 2. Créer l'employé dans employees
    const { data: employeeData, error: employeeError } = await supabaseAdmin
      .from('employees')
      .insert({
        id: userId, // Utiliser le même UUID que l'utilisateur auth
        email,
        first_name,
        last_name,
        type,
        role: role_employee,
        status,
        start_date: start_date || new Date().toISOString().split('T')[0],
        vacation_days: vacation_days || 25,
      })
      .select()
      .single()

    if (employeeError) {
      // Si l'employé existe déjà, le mettre à jour
      if (employeeError.code === '23505') { // Violation de contrainte unique
        const { data: updatedEmployee, error: updateError } = await supabaseAdmin
          .from('employees')
          .update({
            email,
            first_name,
            last_name,
            type,
            role: role_employee,
            status,
            start_date: start_date || new Date().toISOString().split('T')[0],
            vacation_days: vacation_days || 25,
          })
          .eq('id', userId)
          .select()
          .single()

        if (updateError) {
          throw new Error(`Erreur mise à jour employé: ${updateError.message}`)
        }
      } else {
        throw new Error(`Erreur création employé: ${employeeError.message}`)
      }
    }

    // 3. Créer le rôle dans user_roles
    const { data: roleInsertData, error: roleInsertError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: userId,
        employee_id: userId,
        role: role_system,
      })
      .select()
      .single()

    if (roleInsertError) {
      // Si le rôle existe déjà, le mettre à jour
      if (roleInsertError.code === '23505') {
        const { data: updatedRole, error: updateRoleError } = await supabaseAdmin
          .from('user_roles')
          .update({
            role: role_system,
          })
          .eq('user_id', userId)
          .select()
          .single()

        if (updateRoleError) {
          throw new Error(`Erreur mise à jour rôle: ${updateRoleError.message}`)
        }
      } else {
        throw new Error(`Erreur création rôle: ${roleInsertError.message}`)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Utilisateur créé avec succès',
        data: {
          user_id: userId,
          email,
          employee: employeeData || updatedEmployee,
          role: roleInsertData || updatedRole
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
