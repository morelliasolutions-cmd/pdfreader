/**
 * Client API Supabase - Veloxnumeric
 * Backend complet sur Supabase
 */

class VeloxAPI {
    constructor() {
        // ✅ Utiliser le client global créé dans config.js
        this.supabase = window.supabase;
        this.currentUser = null;
    }

    // ========== AUTHENTIFICATION ==========
    async signIn(email, password) {
        const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        this.currentUser = data.user;
        return data;
    }

    async signOut() {
        const { error } = await this.supabase.auth.signOut();
        if (error) throw error;
        this.currentUser = null;
        // Réinitialiser aussi currentUser dans role-access-control.js
        if (typeof window !== 'undefined' && window.RoleAccessControl && typeof window.RoleAccessControl.resetUser === 'function') {
            window.RoleAccessControl.resetUser();
        }
    }

    async getCurrentUser() {
        const { data: { user } } = await this.supabase.auth.getUser();
        this.currentUser = user;
        return user;
    }

    async getSession() {
        const { data, error } = await this.supabase.auth.getSession();
        if (error) throw error;
        return data.session;
    }

    // ========== EMPLOYEES ==========
    async getEmployees(filters = {}) {
        let query = this.supabase.from('employees').select('*').order('last_name');
        if (filters.status) query = query.eq('status', filters.status);
        if (filters.type) query = query.eq('type', filters.type);
        const { data, error } = await query;
        if (error) throw error;
        return data;
    }

    async getEmployee(id) {
        const { data, error } = await this.supabase.from('employees').select('*').eq('id', id).single();
        if (error) throw error;
        return data;
    }

    async createEmployee(employeeData) {
        const { data, error} = await this.supabase.from('employees').insert([employeeData]).select().single();
        if (error) throw error;
        return data;
    }

    async updateEmployee(id, updates) {
        console.log('API updateEmployee appelé avec:', { id, updates });
        console.log('Updates JSON:', JSON.stringify(updates, null, 2));
        const { data, error } = await this.supabase.from('employees').update(updates).eq('id', id).select().single();
        if (error) {
            console.error('Erreur Supabase updateEmployee:', error);
            console.error('Erreur complète:', JSON.stringify(error, null, 2));
            console.error('Message:', error.message);
            console.error('Details:', error.details);
            console.error('Hint:', error.hint);
            console.error('Code:', error.code);
            throw error;
        }
        console.log('Mise à jour réussie:', data);
        return data;
    }

    async deleteEmployee(id) {
        const { error } = await this.supabase.from('employees').delete().eq('id', id);
        if (error) throw error;
    }

    // ========== EVENTS ==========
    async getEmployeeEvents(employeeId, startDate = null, endDate = null) {
        let query = this.supabase.from('events').select('*').eq('employee_id', employeeId).order('date');
        if (startDate) query = query.gte('date', startDate);
        if (endDate) query = query.lte('date', endDate);
        const { data, error } = await query;
        if (error) throw error;
        return data;
    }

    async createEvent(eventData) {
        const { data, error } = await this.supabase.from('events').insert([eventData]).select().single();
        if (error) throw error;
        return data;
    }

    async createEventRange(employeeId, startDate, endDate, type, note = '') {
        const events = [];
        const start = new Date(startDate);
        const end = new Date(endDate);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            if (type === 'vacation' || type === 'paid_leave') {
                const dayOfWeek = d.getDay();
                if (dayOfWeek === 0 || dayOfWeek === 6) continue;
            }
            events.push({
                employee_id: employeeId,
                date: d.toISOString().split('T')[0],
                type: type,
                note: note
            });
        }
        const { data, error } = await this.supabase.from('events').insert(events).select();
        if (error) throw error;
        return data;
    }

    // ========== TIME ENTRIES ==========
    async getTimeEntries(date, employeeId = null) {
        let query = this.supabase.from('time_entries').select('*, employee:employees(*)').eq('date', date);
        if (employeeId) query = query.eq('employee_id', employeeId);
        const { data, error } = await query;
        if (error) throw error;
        return data;
    }

    async saveTimeEntry(timeEntryData) {
        if (timeEntryData.start_time && timeEntryData.end_time) {
            const start = new Date(`2000-01-01T${timeEntryData.start_time}`);
            const end = new Date(`2000-01-01T${timeEntryData.end_time}`);
            let hours = (end - start) / (1000 * 60 * 60);
            const noon = new Date(`2000-01-01T12:00:00`);
            const onePm = new Date(`2000-01-01T13:00:00`);
            if (start < onePm && end > noon) hours -= 1;
            timeEntryData.total_hours = Math.max(0, hours.toFixed(2));
        }
        const { data: existing } = await this.supabase.from('time_entries').select('id').eq('employee_id', timeEntryData.employee_id).eq('date', timeEntryData.date).single();
        let result;
        if (existing) {
            result = await this.supabase.from('time_entries').update(timeEntryData).eq('id', existing.id).select().single();
        } else {
            result = await this.supabase.from('time_entries').insert([timeEntryData]).select().single();
        }
        if (result.error) throw result.error;
        return result.data;
    }

    // ========== INTERVENTIONS ==========
    async getInterventions(date, employeeId = null) {
        let query = this.supabase.from('interventions').select('*, employee:employees(*)').eq('date', date);
        if (employeeId) query = query.eq('employee_id', employeeId);
        const { data, error } = await query;
        if (error) throw error;
        return data;
    }

    async getInterventionsRange(startDate, endDate, employeeId = null) {
        let query = this.supabase.from('interventions').select('*').gte('date', startDate).lte('date', endDate);
        if (employeeId) query = query.eq('employee_id', employeeId);
        const { data, error } = await query;
        if (error) throw error;
        return data;
    }

    async createIntervention(interventionData) {
        const { data, error } = await this.supabase.from('interventions').insert([interventionData]).select().single();
        if (error) throw error;
        return data;
    }

    async updateIntervention(id, updates) {
        const { data, error } = await this.supabase.from('interventions').update(updates).eq('id', id).select().single();
        if (error) throw error;
        return data;
    }

    async deleteIntervention(id) {
        const { error } = await this.supabase.from('interventions').delete().eq('id', id);
        if (error) throw error;
    }

    // ========== STATISTICS ==========
    async getDashboardStats() {
        const today = new Date().toISOString().split('T')[0];
        const { count: totalEmployees } = await this.supabase.from('employees').select('*', { count: 'exact', head: true }).eq('status', 'Actif');
        const { data: absences } = await this.supabase.from('events').select('employee_id, type').eq('date', today).in('type', ['absent', 'vacation', 'sickness', 'paid_leave']);
        const vacationToday = absences?.filter(a => ['vacation', 'paid_leave'].includes(a.type)).length || 0;
        const sicknessToday = absences?.filter(a => ['absent', 'sickness'].includes(a.type)).length || 0;
        const absentToday = vacationToday + sicknessToday;
        const presentToday = Math.max(0, totalEmployees - absentToday);
        const { data: hoursData } = await this.supabase.from('time_entries').select('total_hours').eq('date', today);
        const totalHoursToday = hoursData?.reduce((sum, entry) => sum + (parseFloat(entry.total_hours) || 0), 0) || 0;
        const targetHours = presentToday * 8.4;
        const productivityScore = targetHours > 0 ? Math.min(10, (totalHoursToday / targetHours) * 10) : 0;
        const presentPct = totalEmployees > 0 ? Math.round((presentToday / totalEmployees) * 100) : 0;
        const vacationPct = totalEmployees > 0 ? Math.round((vacationToday / totalEmployees) * 100) : 0;
        const sicknessPct = totalEmployees > 0 ? Math.round((sicknessToday / totalEmployees) * 100) : 0;
        const absenteeismRate = totalEmployees > 0 ? ((sicknessToday / totalEmployees) * 100).toFixed(1) : 0;
        return {
            total_employees: totalEmployees,
            present_today: presentToday,
            vacation_today: vacationToday,
            sickness_today: sicknessToday,
            present_pct: presentPct,
            vacation_pct: vacationPct,
            sickness_pct: sicknessPct,
            absenteeism_rate: absenteeismRate,
            productivity_score: productivityScore.toFixed(1)
        };
    }

    async getEmployeeStats(employeeId) {
        const now = new Date();
        const yearStart = `${now.getFullYear()}-01-01`;
        const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
        const { data: monthHours } = await this.supabase.from('time_entries').select('total_hours').eq('employee_id', employeeId).gte('date', monthStart);
        const totalHoursMonth = monthHours?.reduce((sum, e) => sum + (parseFloat(e.total_hours) || 0), 0) || 0;
        const { count: vacationDaysUsed } = await this.supabase.from('events').select('*', { count: 'exact', head: true }).eq('employee_id', employeeId).gte('date', yearStart).in('type', ['vacation', 'paid_leave']);
        const { count: absencesYear } = await this.supabase.from('events').select('*', { count: 'exact', head: true }).eq('employee_id', employeeId).gte('date', yearStart).in('type', ['absent', 'sickness']);
        const { data: nextVacationData } = await this.supabase.from('events').select('date').eq('employee_id', employeeId).gte('date', now.toISOString().split('T')[0]).in('type', ['vacation', 'paid_leave']).order('date', { ascending: true }).limit(1);
        const nextVacation = nextVacationData?.[0]?.date ? new Date(nextVacationData[0].date).toLocaleDateString('fr-FR') : null;
        const monthlyHours = [];
        for (let month = 1; month <= 12; month++) {
            const monthStartDate = `${now.getFullYear()}-${String(month).padStart(2, '0')}-01`;
            const monthEndDate = month === 12 ? `${now.getFullYear() + 1}-01-01` : `${now.getFullYear()}-${String(month + 1).padStart(2, '0')}-01`;
            const { data: monthData } = await this.supabase.from('time_entries').select('total_hours').eq('employee_id', employeeId).gte('date', monthStartDate).lt('date', monthEndDate);
            const hours = monthData?.reduce((sum, e) => sum + (parseFloat(e.total_hours) || 0), 0) || 0;
            monthlyHours.push({ month, hours: Math.round(hours) });
        }
        const { data: employee } = await this.supabase.from('employees').select('vacation_days, start_date').eq('id', employeeId).single();
        let vacationDaysTotal = employee?.vacation_days || 25;
        
        // Calculer les heures travaillées dans l'année
        const { data: yearHours } = await this.supabase.from('time_entries').select('total_hours').eq('employee_id', employeeId).gte('date', yearStart);
        const totalHoursYear = yearHours?.reduce((sum, e) => sum + (parseFloat(e.total_hours) || 0), 0) || 0;
        
        // Système de cotisation : calcul au prorata des heures travaillées
        // Base : 2050 heures par an pour avoir 100% des jours de vacances contractuels
        const ANNUAL_HOURS_BASE = 2050;
        const hoursWorkedRatio = Math.min(totalHoursYear / ANNUAL_HOURS_BASE, 1); // Max 100%
        const vacationDaysAccrued = Math.round((employee?.vacation_days || 25) * hoursWorkedRatio * 10) / 10;
        const vacationDaysContract = employee?.vacation_days || 25;

        console.log(`📊 Calcul vacances pour employé ${employeeId}:`);
        console.log(`  Heures travaillées: ${totalHoursYear.toFixed(2)}h / ${ANNUAL_HOURS_BASE}h`);
        console.log(`  Ratio: ${(hoursWorkedRatio * 100).toFixed(1)}%`);
        console.log(`  Jours contractuels: ${vacationDaysContract}`);
        console.log(`  Jours acquis: ${vacationDaysAccrued}`);
        
        return {
            total_hours_month: Math.round(totalHoursMonth),
            vacation_days_used: vacationDaysUsed || 0,
            vacation_days_total: vacationDaysAccrued, // Revert: This must be the Accrued amount for personnel.html compatibility
            vacation_days_contract: vacationDaysContract, // Extra info if needed
            absences_year: absencesYear || 0,
            next_vacation: nextVacation,
            monthly_hours: monthlyHours
        };
    }

    async getDashboardStatsRange(startDate, endDate) {
        // Calculate days in period
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        
        // Count active employees
        const { count: totalEmployees } = await this.supabase.from('employees').select('*', { count: 'exact', head: true }).eq('status', 'Actif');
        
        // Get absences in range
        const { data: absences } = await this.supabase.from('events')
            .select('type')
            .gte('date', startDate)
            .lte('date', endDate)
            .in('type', ['absent', 'sickness', 'vacation', 'paid_leave', 'unpaid']);

        const totalAbsenceDays = absences?.length || 0;
        
        // Get hours in range
        const { data: hoursData } = await this.supabase.from('time_entries')
            .select('total_hours')
            .gte('date', startDate)
            .lte('date', endDate);
            
        const totalHours = hoursData?.reduce((sum, entry) => sum + (parseFloat(entry.total_hours) || 0), 0) || 0;
        
        // Calculations
        // Target: 8.4h per day per employee (assuming 5 days/week but used diffDays for simplicity for now or adjust)
        // If Period is "Today" (1 day), Target = Emp * 8.4.
        // If Period is "Week" (7 days), we assume 5 working days?
        let workDays = diffDays;
        if (diffDays > 2) {
            // Rough approximation for workdays: 5/7 of total days
            workDays = Math.round(diffDays * 5 / 7);
            if (workDays < 1) workDays = 1;
        }

        const totalCapacityHours = totalEmployees * workDays * 8.4;
        const totalCapacityDays = totalEmployees * workDays;
        
        const productivityScore = totalCapacityHours > 0 ? Math.min(10, (totalHours / totalCapacityHours) * 10) : 0;
        const absenteeismRate = totalCapacityDays > 0 ? ((totalAbsenceDays / totalCapacityDays) * 100).toFixed(1) : 0;
        
        // For "Present Today", if range > 1 day, we return "Average Present"
        // Avg Present = Total Employees - (Avg Absent per day)
        const avgAbsent = totalAbsenceDays / workDays;
        const avgPresent = Math.round(Math.max(0, totalEmployees - avgAbsent));
        
        const presentPct = Math.round(100 - absenteeismRate);

        return {
            total_employees: totalEmployees,
            present_today: avgPresent, // Re-used field name for UI compatibility
            absenteeism_rate: absenteeismRate,
            productivity_score: productivityScore.toFixed(1),
            present_pct: presentPct,
            total_hours: totalHours.toFixed(0)
        };
    }

    async getAbsenceStats(startDate = null, endDate = null) {
        let query = this.supabase.from('events').select('type');
        
        if (startDate && endDate) {
            query = query.gte('date', startDate).lte('date', endDate);
        } else {
            // Default to current year if no range? Or all time?
            // Existing dashboard likely expects all time or Year To Date.
            // Let's stick to range if provided, else Year To Date.
            const yearStart = `${new Date().getFullYear()}-01-01`;
            query = query.gte('date', yearStart);
        }
        
        const { data: events, error } = await query;
        if (error) throw error;
        
        const stats = {
            'sick': 0,
            'vacation': 0,
            'remote': 0,
            'unpaid': 0
        };
        
        events.forEach(e => {
            if (e.type === 'sickness' || e.type === 'absent') stats['sick']++;
            else if (e.type === 'vacation' || e.type === 'paid_leave') stats['vacation']++;
            else if (e.type === 'remote') stats['remote']++;
            else if (e.type === 'unpaid') stats['unpaid']++;
        });
        
        return stats;
    }

    async getProductivityHistory(startDate, endDate) {
        // Fetch daily interventions
        const { data: interventions } = await this.supabase.from('interventions')
            .select('date')
            .gte('date', startDate)
            .lte('date', endDate)
            .order('date');

        // Group by date
        const history = {};
        
        // Initialize all days in range with 0
        let current = new Date(startDate);
        const end = new Date(endDate);
        while (current <= end) {
            const dateStr = current.toISOString().split('T')[0];
            history[dateStr] = 0;
            current.setDate(current.getDate() + 1);
        }

        interventions?.forEach(i => {
            // Assume date is YYYY-MM-DD string as per table usage
            // If it's a full timestamp, we might need to split it
            // Based on getInterventions(date), it seems to be a date type or string YYYY-MM-DD
            const dateKey = i.date && i.date.includes('T') ? i.date.split('T')[0] : i.date;
            
            if (history[dateKey] !== undefined) {
                history[dateKey]++;
            }
        });

        const labels = [];
        const data = [];

        Object.keys(history).sort().forEach(date => {
            const d = new Date(date);
            const dayName = d.toLocaleDateString('fr-FR', { weekday: 'short' });
            const dayNum = d.getDate();
            labels.push(`${dayName} ${dayNum}`);
            data.push(history[date]);
        });

        return { labels, data };
    }
}

window.VeloxAPI = new VeloxAPI();

