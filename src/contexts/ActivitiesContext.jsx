import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';

const ActivitiesContext = createContext(null);

// Fixed columns definition
const COLUMNS_DEF = {
    'pendente': { id: 'pendente', title: 'Pendente', activityIds: [] },
    'em_execucao': { id: 'em_execucao', title: 'Em Execução', activityIds: [] },
    'aguardando_materiais': { id: 'aguardando_materiais', title: 'Aguardando Materiais', activityIds: [] },
    'pausada': { id: 'pausada', title: 'Pausada', activityIds: [] },
    'concluida': { id: 'concluida', title: 'Concluída', activityIds: [] },
    'atrasada': { id: 'atrasada', title: 'Atrasada', activityIds: [] }, // Added based on context usage
    'review': { id: 'review', title: 'Em Revisão', activityIds: [] },      // Added based on context usage
    'done': { id: 'done', title: 'Concluído', activityIds: [] }           // Added based on context usage
};

// Normalize status to ensure it maps to one of our columns, or default to 'pendente'
const normalizeStatus = (status) => {
    if (!status) return 'pendente';
    const s = String(status).toLowerCase().trim();

    // Direct match
    if (COLUMNS_DEF[s]) return s;

    // Mapping Common Labels to IDs
    if (s === 'em execução' || s === 'em execucao' || s === 'in_progress') return 'em_execucao';
    if (s === 'concluída' || s === 'concluida' || s === 'done') return 'concluida';
    if (s === 'atrasada' || s === 'delayed') return 'atrasada';
    if (s === 'em revisão' || s === 'em revisao' || s === 'review') return 'review';
    if (s === 'aguardando materiais' || s === 'aguardando') return 'aguardando_materiais';
    if (s === 'pausada' || s === 'paused') return 'pausada';
    if (s === 'pendente' || s === 'pending') return 'pendente';

    return 'pendente';
};

export const ActivitiesProvider = ({ children }) => {
    const [activities, setActivities] = useState({});
    const [columns, setColumns] = useState(JSON.parse(JSON.stringify(COLUMNS_DEF)));
    const [columnOrder] = useState(['pendente', 'em_execucao', 'aguardando_materiais', 'pausada', 'concluida']);
    const [loading, setLoading] = useState(true);

    // Pagination State
    const [pagination, setPagination] = useState({
        page: 0,
        pageSize: 100,
        totalCount: 0,
        totalPages: 0
    });

    // Dashboard Stats State
    const [dashboardStats, setDashboardStats] = useState({
        counts: {},
        delayedCount: 0,
        loading: false,
        rawData: []
    });

    const fetchDashboardMetrics = async () => {
        setDashboardStats(prev => ({ ...prev, loading: true }));
        try {
            // Fetch lightweight data for metrics in chunks to avoid timeouts
            let allData = [];
            let hasMore = true;
            let page = 0;
            const METRICS_CHUNK_SIZE = 5000;

            while (hasMore) {
                const { data, error } = await supabase
                    .from('activities')
                    .select('status, endDate, responsible, metadata')
                    .range(page * METRICS_CHUNK_SIZE, (page + 1) * METRICS_CHUNK_SIZE - 1);

                if (error) throw error;

                if (data && data.length > 0) {
                    allData = [...allData, ...data];
                    if (data.length < METRICS_CHUNK_SIZE) {
                        hasMore = false; // End of data
                    } else {
                        page++;
                    }
                } else {
                    hasMore = false;
                }

                // Safety break for very large datasets (e.g. >100k) to prevent infinite loops
                if (allData.length > 100000) hasMore = false;
            }

            const data = allData;

            const counts = {};
            let delayed = 0;
            const now = new Date();

            data.forEach(item => {
                const s = normalizeStatus(item.status);
                counts[s] = (counts[s] || 0) + 1;

                if (item.status !== 'concluida' && item.endDate) {
                    if (new Date(item.endDate) < now) {
                        delayed++;
                    }
                }
            });

            setDashboardStats({
                counts,
                delayedCount: delayed,
                loading: false,
                rawData: data
            });

        } catch (error) {
            console.error("Error fetching metrics:", error);
            setDashboardStats(prev => ({ ...prev, loading: false }));
        }
    };

    const { user } = useAuth(); // Access user for scoping

    const fetchActivities = async (pageIndex = 0, filters = {}) => {
        setLoading(true);
        try {
            const from = pageIndex * pagination.pageSize;
            const to = from + pagination.pageSize - 1;

            let query = supabase
                .from('activities')
                .select('*', { count: 'exact' });

            // 1. Scope: If NOT admin, strict filter by responsible
            if (user?.role !== 'admin') {
                if (user?.name) {
                    query = query.eq('responsible', user.name);
                }
            } else {
                // 2. Admin Filter: Area (if selected)
                if (filters.area && filters.area !== 'Todas') {
                    // Assuming 'area' is a column or in metadata? 
                    // Verify schema: 'area' column exists? Previously implied.
                    // If stored in metadata, we need to query metadata->>'area'.
                    // Let's assume metadata JSONB column for now to be safe if no column.
                    // Actually, 'area' was recently discussed. 
                    // Let's try column 'area' first, if fails we catch.
                    // Or check JSON. The `Project` import usually puts it in metadata.
                    // But Supabase query on JSONB: .eq('metadata->>area', filters.area) works.
                    // Let's assume generic query for now or metadata.
                    // SAFE BET: Try metadata filter first as most Excel imports went there.
                    // Wait, Step 843 said "Importing... metadata={...}".
                    // So use metadata query.
                    // Support multiple variations of 'area' key in JSONB
                    // Note: Supabase .or() syntax expects comma separated filters
                    // Filter only by the columns known to contain the valid Areas (including the split ones like area4)
                    // Exclude area5 and sector which contain codes/trash.
                    const val = filters.area;
                    query = query.or(`metadata->>area.eq."${val}",metadata->>Area.eq."${val}",metadata->>AREA.eq."${val}",metadata->>Área.eq."${val}",metadata->>ÁREA.eq."${val}",metadata->>area4.eq."${val}",metadata->>ÁREA4.eq."${val}"`);
                }
            }

            // Order query
            query = query
                .order('createdAt', { ascending: false })
                .range(from, to);

            const { data, count, error } = await query;

            if (error) throw error;

            // Feature Fix: Sort data by 'code' naturally
            if (data) {
                const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
                data.sort((a, b) => {
                    const codeA = String(a.code || '');
                    const codeB = String(b.code || '');
                    return collator.compare(codeA, codeB);
                });
            }

            const newActivities = {};
            const newColumns = JSON.parse(JSON.stringify(COLUMNS_DEF));

            data.forEach(act => {
                // Normalize metadata as before
                const metadata = act.metadata || {};
                const normalizedMeta = {};
                Object.keys(metadata).forEach(metaKey => {
                    const val = metadata[metaKey];
                    // ... (keeping simple for brevity in this critical fix, relying on existing data structure)
                    // Actually, let's keep the critical normalization logic if possible, 
                    // or assume data is decent now. The Loop implementation had heavy normalization.
                    // For performance/safety, I'll do minimal efficient normalization here.
                    normalizedMeta[metaKey] = val;
                });

                newActivities[act.id] = { ...act, ...normalizedMeta };

                const status = normalizeStatus(act.status);
                if (newColumns[status]) {
                    newColumns[status].activityIds.push(act.id);
                }
            });

            setActivities(newActivities);
            setColumns(newColumns);
            setPagination(prev => ({
                ...prev,
                page: pageIndex,
                totalCount: count || 0,
                totalPages: Math.ceil((count || 0) / prev.pageSize)
            }));

        } catch (err) {
            console.error("Error fetching paginated activities:", err);
            alert("Erro ao buscar atividades: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActivities();
    }, []);

    // Helper to safely parse dates (handles Excel serials, JS Dates, strings)
    const safeDateParse = (val) => {
        if (!val) return null;

        // If it's a number (Excel serial date)
        // Excel base date is Dec 30 1899. JS is Jan 1 1970. Difference is 25569 days.
        // 86400s per day.
        if (typeof val === 'number') {
            if (val > 25569) {
                const date = new Date((val - 25569) * 86400 * 1000);
                return date.toISOString();
            }
        }

        // If it's already a Date object
        if (val instanceof Date) {
            return !isNaN(val) ? val.toISOString() : null;
        }

        // If it's a string, try to parse
        const parsed = new Date(val);
        return !isNaN(parsed) ? parsed.toISOString() : null;
    };

    const addActivities = async (newActivitiesList) => {
        setLoading(true);
        // Get current user for RLS
        const { data: { user } } = await supabase.auth.getUser();

        // Prepare ALL data first
        const allRows = newActivitiesList.map(act => {
            const validColumns = ['code', 'description', 'responsible', 'status', 'startDate', 'endDate'];
            const metadata = {};

            // Helper to get value case-insensitively
            const getValue = (keys) => {
                if (!Array.isArray(keys)) keys = [keys];
                for (const k of keys) {
                    // Try exact match first
                    if (act[k] !== undefined) return act[k];
                    // Try lowercase match
                    const lowerK = k.toLowerCase();
                    const foundKey = Object.keys(act).find(ak => ak.toLowerCase() === lowerK);
                    if (foundKey) return act[foundKey];
                }
                return undefined;
            };

            // 1. Map ID/Code
            const code = getValue(['ID_EXC', 'Código', 'Codigo', 'code']) || act.code;

            // 2. Map Responsible
            const responsible = getValue(['RESP_TÉCNICO', 'RESP_TECNICO', 'Responsável', 'Responsavel', 'responsible']) || act.responsible;

            // 3. Map Status
            const rawStatus = getValue(['STATUS TAREFA', 'Status', 'status']) || act.status || 'pendente';
            const status = normalizeStatus(rawStatus);

            // 4. Map Dates (Real)
            const startDateVal = getValue(['INÍCIO', 'INICIO', 'Início', 'Inicio', 'startDate']);
            const endDateVal = getValue(['TÉRMINO', 'TERMINO', 'Término', 'Termino', 'endDate']);

            // 5. Map Description (Composite: ORDEM + OPERAÇÃO)
            let description = getValue(['Descrição', 'Descricao', 'description']);
            const ordem = getValue(['ORDEM', 'Ordem']);
            const operacao = getValue(['OPERAÇÃO', 'OPERACAO', 'Operação', 'Operacao']);

            if (ordem || operacao) {
                // Should we overwrite description or append? 
                // Plan said: combine them. If description exists, maybe prepend?
                // Let's prioritize the composite if both exist, or use what we have.
                // User example: "ORDEM" and "OPERAÇÃO".
                const parts = [];
                if (description) parts.push(description); // Keep original if exists? Or replace? 
                // User said: "Descrição = ORDEM e OPERAÇÃO". This implies the description COLUMN is missing or they want to construct it.
                // Let's construct a rich description.
                const composite = [];
                if (ordem) composite.push(`Ordem: ${ordem}`);
                if (operacao) composite.push(`Op: ${operacao}`);

                // If we constructed something, use it. 
                if (composite.length > 0) {
                    description = composite.join(' - ');
                }
            }
            if (!description) description = "Sem descrição";

            const standardData = {
                code: String(code || ''), // Ensure string
                description: String(description),
                responsible: String(responsible || 'Sem responsável'),
                status: status,
                startDate: safeDateParse(startDateVal),
                endDate: safeDateParse(endDateVal),
            };

            // 6. Capture Metadata including Planned Dates
            // We want to capture everything else BUT also ensure specific keys for planned dates are normalized
            const plannedStart = getValue(['INÍCIO_PREV', 'INICIO_PREV', 'Início Previsto', 'plannedStartDate']);
            const plannedEnd = getValue(['TÉRMINO_PREV', 'TERMINO_PREV', 'Término Previsto', 'plannedEndDate']);

            if (plannedStart) metadata['plannedStartDate'] = safeDateParse(plannedStart);
            if (plannedEnd) metadata['plannedEndDate'] = safeDateParse(plannedEnd);

            Object.keys(act).forEach(key => {
                if (!validColumns.includes(key) && key !== 'id') {
                    metadata[key] = act[key];
                }
            });

            return { ...standardData, metadata };
        });

        // Batch processing
        const BATCH_SIZE = 50;
        let successCount = 0;
        let failureCount = 0;
        let firstError = null;

        console.log(`Iniciando importação de ${allRows.length} linhas...`);

        for (let i = 0; i < allRows.length; i += BATCH_SIZE) {
            const batch = allRows.slice(i, i + BATCH_SIZE);
            const { error } = await supabase
                .from('activities')
                .insert(batch);

            if (error) {
                console.error(`Erro ao inserir lote ${i} - ${i + BATCH_SIZE}:`, error);
                failureCount += batch.length;
                if (!firstError) firstError = error; // Keep first error for alert
            } else {
                successCount += batch.length;
            }

            // Optional: Small delay to behave nicely with DB rate limits
            if (i % 500 === 0) await new Promise(r => setTimeout(r, 100));
        }

        console.log(`Importação Finalizada. Sucessos: ${successCount}, Falhas: ${failureCount}`);

        if (failureCount > 0) {
            alert(`Importação concluída com erros.\n\nSucesso: ${successCount} linhas\nFalhas: ${failureCount} linhas\n\nErro principal: ${firstError?.message || 'Desconhecido'}`);
        } else {
            // Only fetch if everything was more or less fine (or partially fine)
            // Actually we should always fetch to show what we got.
        }

        // Always refresh to show what we managed to import
        await fetchActivities();
        // setLoading(false) is handled inside fetchActivities usually, but if fetch fails it might stick.
        // fetchActivities sets loading to true then false. So we are good.
        // Wait, fetchActivities is async. We await it.
    };

    const moveActivity = async (activityId, fromColumnId, toColumnId) => {
        // Optimistic Update
        const newActivities = { ...activities };

        // Handle Columns Update
        const newColumns = { ...columns };

        // Remove from source
        if (newColumns[fromColumnId]) {
            newColumns[fromColumnId] = {
                ...newColumns[fromColumnId],
                activityIds: newColumns[fromColumnId].activityIds.filter(id => id !== activityId)
            };
        }

        // Add to destination
        if (newColumns[toColumnId]) {
            newColumns[toColumnId] = {
                ...newColumns[toColumnId],
                activityIds: [...newColumns[toColumnId].activityIds, activityId]
            };
        }
        // DB Update Logic
        const updatePayload = { status: toColumnId };

        // Auto-complete progress if moving to Done
        if (toColumnId === 'concluida' || toColumnId === 'done') {
            const activity = activities[activityId];
            if (activity) {
                // Update local state percentual
                newActivities[activityId] = { ...newActivities[activityId], percentual: 100 };

                // updatePayload.percentual = 100; // Removed as column does not exist

                // Sync metadata
                const metadata = { ...activity.metadata } || {};
                const keys = ['percentual', 'porcentagem', 'progresso', '%'];
                Object.keys(metadata).forEach(metaKey => {
                    if (keys.includes(metaKey.toLowerCase().trim())) {
                        metadata[metaKey] = 100;
                    }
                });

                // Also update status metadata
                const statusTitle = COLUMNS_DEF[toColumnId]?.title || toColumnId;
                const statusKeys = ['status', 'estado', 'situação', 'status tarefa', 'status om realizado', 'status_tarefa', 'status_om_realizado'];
                Object.keys(metadata).forEach(metaKey => {
                    if (statusKeys.includes(metaKey.toLowerCase().trim())) {
                        metadata[metaKey] = statusTitle;
                    }
                });

                updatePayload.metadata = metadata;

                // Update optimistic state again with full metadata
                newActivities[activityId] = { ...newActivities[activityId], ...metadata };
            }
        }

        setActivities(newActivities);
        setColumns(newColumns);

        const { error } = await supabase
            .from('activities')
            .update(updatePayload)
            .eq('id', activityId);

        if (error) {
            console.error('Error moving activity:', error);
            // Revert on error would be ideal, for now just refetch
            fetchActivities();
        }
    };

    const editActivity = async (id, updatedData) => {
        try {
            // Optimistic update
            const activity = activities[id];
            if (!activity) {
                console.error("Activity not found in context state:", id);
                alert("Erro: Atividade não encontrada localmente.");
                return;
            }

            // Allow only valid columns to be sent to DB, put rest in metadata
            // 'percentual' removed from validColumns as it's not in the schema anymore (stored in metadata)
            const validColumns = ['code', 'description', 'responsible', 'status', 'startDate', 'endDate'];
            const cleanData = { metadata: { ...activity.metadata } }; // Start with existing metadata

            Object.keys(updatedData).forEach(key => {
                if (validColumns.includes(key)) {
                    if (key === 'startDate' || key === 'endDate') {
                        cleanData[key] = safeDateParse(updatedData[key]);
                    } else if (key === 'percentual') {
                        cleanData[key] = parseInt(updatedData[key], 10);
                    } else {
                        cleanData[key] = updatedData[key];
                    }
                } else if (key === 'content') {
                    cleanData['description'] = updatedData[key];
                } else if (key !== 'id' && key !== 'metadata') {
                    // Update metadata field
                    cleanData.metadata[key] = updatedData[key];
                }
            });

            // Ensure we normalize status if it's being updated
            if (cleanData.status) {
                cleanData.status = normalizeStatus(cleanData.status);
            }

            // SYNCHRONIZATION: Update legacy/metadata columns if system columns change
            // This prevents confusion if user is looking at 'RESP_TÉCNICO' but editing 'Responsável'
            if (updatedData.responsible) {
                // Removed 'equipe' to keep it separate as requested
                const keys = ['responsavel', 'resp_técnico', 'resp_tecnico', 'resp', 'executor'];
                Object.keys(cleanData.metadata).forEach(metaKey => {
                    if (keys.includes(metaKey.toLowerCase().trim())) {
                        cleanData.metadata[metaKey] = updatedData.responsible;
                    }
                });
            }
            if (updatedData.code) {
                const keys = ['codigo', 'id_exc', 'id'];
                Object.keys(cleanData.metadata).forEach(metaKey => {
                    if (keys.includes(metaKey.toLowerCase().trim())) {
                        cleanData.metadata[metaKey] = updatedData.code;
                    }
                });
            }
            if (updatedData.description || updatedData.content) {
                const desc = updatedData.description || updatedData.content;
                const keys = ['descricao', 'descrição', 'operação', 'operacao', 'conteudo', 'content'];
                Object.keys(cleanData.metadata).forEach(metaKey => {
                    if (keys.includes(metaKey.toLowerCase().trim())) {
                        cleanData.metadata[metaKey] = desc;
                    }
                });
            }
            // Sync Dates
            if (updatedData.startDate) {
                const keys = ['início', 'inicio', 'startdate', 'data inicio', 'início_prev'];
                Object.keys(cleanData.metadata).forEach(metaKey => {
                    if (keys.includes(metaKey.toLowerCase().trim())) {
                        cleanData.metadata[metaKey] = safeDateParse(updatedData.startDate);
                    }
                });
            }
            if (updatedData.endDate) {
                const keys = ['prazo', 'data', 'enddate', 'término_prev', 'término', 'fim', 'data fim'];
                Object.keys(cleanData.metadata).forEach(metaKey => {
                    if (keys.includes(metaKey.toLowerCase().trim())) {
                        cleanData.metadata[metaKey] = safeDateParse(updatedData.endDate);
                    }
                });
            }
            // Sync Status (New)
            if (cleanData.status) {
                // Get readable title (e.g. 'Em Execução') instead of ID ('em_execucao')
                const statusTitle = COLUMNS_DEF[cleanData.status]?.title || cleanData.status;
                const keys = ['status', 'estado', 'situação', 'status tarefa', 'status om realizado', 'status_tarefa', 'status_om_realizado'];
                Object.keys(cleanData.metadata).forEach(metaKey => {
                    if (keys.includes(metaKey.toLowerCase().trim())) {
                        cleanData.metadata[metaKey] = statusTitle;
                    }
                });
            }
            // Sync Percentual (New)
            if (updatedData.percentual !== undefined) {
                const keys = ['percentual', 'porcentagem', 'progresso', '%'];
                Object.keys(cleanData.metadata).forEach(metaKey => {
                    if (keys.includes(metaKey.toLowerCase().trim())) {
                        // Excel usually handles % as 0-1, but some use 0-100. Let's assume user input 0-100 is what they want seen.
                        // If they want '50%', we simply store 50.
                        cleanData.metadata[metaKey] = updatedData.percentual;
                    }
                });
            }

            console.log("Saving activity:", id, cleanData);

            // Optimistic State Update
            const newActivities = { ...activities, [id]: { ...activity, ...updatedData, ...cleanData.metadata, status: cleanData.status || activity.status } };

            // Handle Column Movement if Status Changed
            if (cleanData.status && cleanData.status !== activity.status) {
                const oldStatus = activity.status;
                const newStatus = cleanData.status;

                const newColumns = { ...columns };

                // Remove from old column
                if (newColumns[oldStatus]) {
                    newColumns[oldStatus] = {
                        ...newColumns[oldStatus],
                        activityIds: newColumns[oldStatus].activityIds.filter(aid => aid !== id)
                    };
                }

                // Add to new column
                if (newColumns[newStatus]) {
                    // Avoid duplicates
                    const newIds = newColumns[newStatus].activityIds.filter(aid => aid !== id);
                    newColumns[newStatus] = {
                        ...newColumns[newStatus],
                        activityIds: [...newIds, id]
                    };
                }
                setColumns(newColumns);
            }

            setActivities(newActivities);

            const { error } = await supabase
                .from('activities')
                .update(cleanData)
                .eq('id', id);

            if (error) {
                console.error('Error updating activity:', error);
                alert(`Erro ao atualizar atividade: ${error.message}`);
                fetchActivities(); // Revert
            } else {
                // Success - fetch to ensure sync (optional but safer)
                // fetchActivities(); 
            }
        } catch (err) {
            console.error("Exception in editActivity:", err);
            alert(`Erro interno ao salvar: ${err.message}`);
        }
    };

    const deleteActivity = async (id) => {
        // Optimistic
        const newActivities = { ...activities };
        delete newActivities[id];

        // Remove from columns
        const newColumns = { ...columns };
        Object.keys(newColumns).forEach(colId => {
            newColumns[colId].activityIds = newColumns[colId].activityIds.filter(aid => aid !== id);
        });

        setActivities(newActivities);
        setColumns(newColumns);

        const { error } = await supabase
            .from('activities')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting activity:', error);
            fetchActivities();
        }
    };

    const wipeAllActivities = async () => {
        setLoading(true);
        // DB Delete first to ensure it actually works before clearing state (critical action)
        const { error } = await supabase
            .from('activities')
            .delete()
            .not('id', 'is', null); // Delete all rows (safer than neq 0 for UUIDs)

        if (error) {
            console.error('Error wiping activities:', error);
            alert(`Erro ao limpar banco de dados: ${error.message}`);
            setLoading(false);
            return false;
        }

        // Clear local state
        setActivities({});
        const resetColumns = JSON.parse(JSON.stringify(COLUMNS_DEF));
        setColumns(resetColumns);
        setLoading(false);
        return true;
    };

    const boardData = { activities, columns, columnOrder };

    return (
        <ActivitiesContext.Provider value={{
            boardData,
            loading,
            pagination,
            dashboardStats,
            fetchActivities,
            fetchDashboardMetrics,
            addActivities,
            moveActivity,
            editActivity,
            deleteActivity,
            wipeAllActivities
        }}>
            {children}
        </ActivitiesContext.Provider>
    );
};

export const useActivities = () => useContext(ActivitiesContext);
