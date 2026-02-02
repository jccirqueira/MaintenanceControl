import { useRef, useState, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { useActivities } from '../contexts/ActivitiesContext';
import { useAuth } from '../contexts/AuthContext';
import { Upload, FileSpreadsheet, CheckCircle, Plus, Edit, Trash2, Search, Filter, Columns, Eye, EyeOff, Save } from 'lucide-react';
import { AREAS } from '../constants/areas';
import ActivityFormModal from '../components/activities/ActivityFormModal';

// Column Configuration
const COLUMNS_CONFIG = [
    { key: 'code', label: 'Código' },
    { key: 'content', label: 'Descrição' }, // 'content' maps to description in context but display label is Descrição
    { key: 'responsible', label: 'Responsável' },
    { key: 'status', label: 'Status' },
    { key: 'plannedStartDate', label: 'Início Previsto', isDate: true },
    { key: 'plannedEndDate', label: 'Término Previsto', isDate: true },
    { key: 'startDate', label: 'Início (Real)', isDate: true },
    { key: 'endDate', label: 'Término (Real)', isDate: true },
    { key: 'idExc', label: 'ID_EXC' },
    { key: 'area', label: 'ÁREA' },
    { key: 'subarea', label: 'SUBÁREA' },
    { key: 'localInst', label: 'LOCAL_INST' },
    { key: 'nOm', label: 'Nº_OM' },
    { key: 'ordem', label: 'ORDEM' },
    { key: 'operacao', label: 'OPERAÇÃO' },
    { key: 'duracaoPrev', label: 'DURAÇÃO_PREV' },
    // { key: 'inicioPrev', label: 'INÍCIO_PREV' }, // Deprecated
    // { key: 'terminoPrev', label: 'TÉRMINO_PREV' }, // Deprecated
    { key: 'inicio', label: 'INÍCIO' },
    { key: 'termino', label: 'TÉRMINO' },
    { key: 'inicioReal', label: 'INÍCIO_REAL' },
    { key: 'duracaoReal', label: 'DURAÇÃO_REAL' },
    { key: 'duracaoRestante', label: 'DURAÇÃO_RESTANTE' },
    { key: 'variacaoTermino', label: 'VARIAÇÃO NO TÉRMINO' },
    { key: 'equipe', label: 'EQUIPE' },
    { key: 'ctrabOpe', label: 'CTRAB_OPE' },
    { key: 'familiaEquip', label: 'FAMILIA_EQUIP' },
    { key: 'natureza', label: 'NATUREZA' },
    { key: 'respTecnico', label: 'RESP_TÉCNICO' },
    { key: 'sempro', label: 'SEMPRO' },
    { key: 'inicioRealAtual', label: 'INÍCIO_REAL_ATUAL' },
    { key: 'duracaoRealAtual', label: 'DURAÇÃO_REAL_ATUAL' },
    { key: 'duracaoRestanteAtual', label: 'DURAÇÃO_RESTANTE_ATUAL' },
    { key: 'cancelada', label: 'CANCELADA' },
    { key: 'observacao', label: 'OBSERVAÇÃO' },
    { key: 'gravadoEm', label: 'GRAVADO_EM' },
    { key: 'upload', label: 'UPLOAD' },

    { key: 'subDivisao', label: 'SUB DIVISÃO' },
    { key: 'familia', label: 'FAMÍLIA' },
    { key: 'statusTarefa', label: 'STATUS TAREFA' },
    { key: 'percentual', label: '%' },
    { key: 'idExc2', label: 'ID_EXC2' },
    { key: 'nOm2', label: 'Nº OM' },
    { key: 'statusOmPrevisto', label: 'STATUS OM PREVISTO' },
    { key: 'statusOmRealizado', label: 'STATUS OM REALIZADO' },
    { key: 'area4', label: 'ÁREA4' },
    { key: 'area5', label: 'ÁREA5' },
    { key: 'semanaTerminoPrevisto', label: 'SEMANA TERMINO PREVISTO' },
];

const DEFAULT_VISIBLE_COLUMNS = ['code', 'content', 'responsible', 'status', 'startDate', 'endDate'];

export default function Activities() {
    const fileInputRef = useRef(null);
    const [importedData, setImportedData] = useState([]);
    const { boardData, addActivities, editActivity, deleteActivity, loading, pagination, fetchActivities, dashboardStats, fetchDashboardMetrics } = useActivities();
    const { user } = useAuth();
    const [successMsg, setSuccessMsg] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Column Visibility State
    const [visibleColumns, setVisibleColumns] = useState(() => {
        const saved = localStorage.getItem('activities_visible_columns');
        return saved ? JSON.parse(saved) : DEFAULT_VISIBLE_COLUMNS;
    });
    const [isColumnSelectorOpen, setIsColumnSelectorOpen] = useState(false);

    // New: Area Filter for Admins
    const [selectedArea, setSelectedArea] = useState('Todas');
    // Static Area List imported from constants to ensure consistency across pages

    const handleAreaChange = (e) => {
        const newArea = e.target.value;
        setSelectedArea(newArea);
        // Reset to page 0 when filtering
        fetchActivities(0, { area: newArea });
    };

    // Initial Load
    useEffect(() => {
        // Pass current area filter
        fetchActivities(0, { area: selectedArea });

        // Ensure we have global data for the filter dropdown AND it includes metadata
        // If rawData exists but missing metadata, it's a stale cache from before our code update.
        const isStale = dashboardStats.rawData?.length > 0 && dashboardStats.rawData[0].metadata === undefined;

        if (!dashboardStats.rawData || dashboardStats.rawData.length === 0 || isStale) {
            console.log("Fetching dashboard metrics (Force Refresh)...");
            fetchDashboardMetrics();
        }
    }, []); // Only on mount. Area change handles its own fetch.

    useEffect(() => {
        localStorage.setItem('activities_visible_columns', JSON.stringify(visibleColumns));
    }, [visibleColumns]);

    const toggleColumn = (key) => {
        setVisibleColumns(prev => {
            if (prev.includes(key)) {
                if (prev.length <= 1) return prev; // Prevent hiding all columns
                return prev.filter(k => k !== key);
            } else {
                return [...prev, key];
            }
        });
    };

    const handlePageChange = (newPage) => {
        // Use pagination from context directly
        const totalPages = pagination?.totalPages || 1;
        if (newPage >= 0 && newPage < totalPages) {
            // Pass current filters AND new page
            fetchActivities(newPage, { area: selectedArea });
        }
    };

    // Flatten all activities from all columns
    const allActivities = useMemo(() => {
        let activities = [];
        Object.values(boardData.columns).forEach(column => {
            column.activityIds.forEach(activityId => {
                const activity = boardData.activities[activityId];
                if (activity) {
                    activities.push({
                        ...activity,
                        content: activity.description, // Remap internal description to 'content' key for display consistency
                        status: column.title, // Add current status for display
                        statusId: column.id
                    });
                }
            });
        });

        // Filter by User Role (RBAC)
        if (user?.role === 'user') {
            activities = activities.filter(activity => activity.responsible === user.name);
        }

        // Enforce Sort by Code for List View Stability
        const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
        activities.sort((a, b) => {
            const codeA = String(a.code || '');
            const codeB = String(b.code || '');
            return collator.compare(codeA, codeB);
        });

        return activities;
    }, [boardData, user]);

    const filteredActivities = useMemo(() => allActivities.filter(activity => {
        const searchLower = searchTerm.toLowerCase();
        // Search across all visible columns
        const matchesSearch = visibleColumns.some(key => {
            const val = activity[key];
            return val && String(val).toLowerCase().includes(searchLower);
        });

        const matchesStatus = statusFilter === 'all' || activity.statusId === statusFilter;

        return matchesSearch && matchesStatus;
    }), [allActivities, searchTerm, statusFilter, visibleColumns]);

    console.log('Activities Page: All:', allActivities.length, 'Filtered:', filteredActivities.length, 'StatusFilter:', statusFilter);

    // Pagination Logic: Server-Side

    const { page, totalCount, pageSize } = pagination || {};
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));



    // Use keys of activities object directly as they are the current page
    // Note: 'allActivities' above was deriving from 'boardData'. 
    // Since boardData is now just the current page, 'allActivities' IS the current page data.
    // So 'filteredActivities' is filtering the CURRENT PAGE only. 
    // This is a trade-off: Client-side search only searches the current page.
    // ideally we'd implement server-side search, but let's stick to pagination first.
    // We do NOT need to slice 'filteredActivities' again.

    // const paginatedActivities = filteredActivities.slice(startIndex, endIndex); // REMOVE THIS
    const paginatedActivities = filteredActivities; // Render what we have (current page)

    // Reset page on filter change? We can't easily. 
    // Only fetchActivities resets it.



    const getStatusColor = (statusId) => {
        switch (statusId) {
            case 'pending': return '#fef3c7'; // yellow-100
            case 'in_progress': return '#dbeafe'; // blue-100
            case 'review': return '#e0e7ff'; // indigo-100
            case 'done': return '#dcfce7'; // green-100
            default: return '#f3f4f6';
        }
    };

    const getStatusTextColor = (statusId) => {
        switch (statusId) {
            case 'pending': return '#d97706';
            case 'in_progress': return '#2563eb';
            case 'review': return '#4f46e5';
            case 'done': return '#16a34a';
            default: return '#4b5563';
        }
    };

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingActivity, setEditingActivity] = useState(null);

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary', cellDates: true, dateNF: 'yyyy-mm-dd' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];

                // Smart Header Detection
                // 1. Get data as array of arrays to find the header row
                const rawArrays = XLSX.utils.sheet_to_json(ws, { header: 1, range: 0 });
                let headerRowIndex = 0;

                // Search first 20 rows for a likely header
                for (let i = 0; i < Math.min(20, rawArrays.length); i++) {
                    const row = rawArrays[i].map(c => String(c).toLowerCase().trim());
                    // Check for signatures of a header row
                    // We look for 'codigo' OR 'descrição'/ 'operation' + 'responsavel'
                    const hasCode = row.some(c => c.includes('cod') || c.includes('cód') || c === 'id');
                    const hasDesc = row.some(c => c.includes('desc') || c.includes('opera') || c.includes('conteudo'));

                    if (hasCode && hasDesc) {
                        headerRowIndex = i;
                        console.log(`Cabeçalho encontrado na linha ${i + 1}`);
                        break;
                    }
                }

                // 2. Parse again using the found header row
                const rawData = XLSX.utils.sheet_to_json(ws, { range: headerRowIndex });
                console.log('Dados brutos importados:', rawData);

                if (!rawData || rawData.length === 0) {
                    alert('A planilha parece estar vazia ou o cabeçalho não foi encontrado.');
                    return;
                }

                const formatted = rawData.map((row, index) => {
                    const mappedRow = { ...row, _raw: row }; // Start with all original data to ensure nothing is lost

                    // Helper to find value loosely (trim, lowercase check)
                    const getVal = (possibleKeys) => {
                        // normalized row keys for comparison
                        const rowKeys = Object.keys(row);

                        for (const targetKey of possibleKeys) {
                            const targetNorm = targetKey.toLowerCase().trim();

                            // 1. Try exact match
                            if (row[targetKey] !== undefined) return row[targetKey];

                            // 2. Try case-insensitive normalized match
                            const foundKey = rowKeys.find(k => k.toLowerCase().trim() === targetNorm);
                            if (foundKey && row[foundKey] !== undefined) return row[foundKey];
                        }
                        return undefined;
                    };

                    // explicit mappings with more options
                    mappedRow.code = getVal(['Código', 'Codigo', 'code', 'ID_EXC', 'ID', 'Id']);
                    mappedRow.description = getVal(['Descrição', 'Descricao', 'description', 'OPERAÇÃO', 'Operacao', 'Conteudo', 'Content']);
                    mappedRow.responsible = getVal(['Responsável', 'Responsavel', 'responsible', 'RESP_TÉCNICO', 'EQUIPE', 'Resp', 'Executor']);
                    mappedRow.status = getVal(['Status', 'Estado', 'Situação', 'Situation']);
                    mappedRow.endDate = getVal(['Prazo', 'Data', 'endDate', 'TÉRMINO_PREV', 'TÉRMINO', 'Fim', 'Data Fim']);
                    mappedRow.startDate = getVal(['Início', 'Inicio', 'startDate', 'INÍCIO', 'INÍCIO_PREV', 'Data Inicio']);

                    // Default values to ensure visibility
                    if (!mappedRow.code) mappedRow.code = `IMP-${Date.now()}-${index}`;
                    if (!mappedRow.description) mappedRow.description = '(Sem Descrição)';
                    if (!mappedRow.responsible) mappedRow.responsible = 'Não Atribuído';

                    // Map other columns
                    COLUMNS_CONFIG.forEach(col => {
                        // Skip if already mapped manually above to main fields
                        if (['code', 'content', 'responsible', 'status', 'startDate', 'endDate'].includes(col.key)) return;

                        // Try to find by label or key
                        const val = getVal([col.label, col.key]);
                        if (val !== undefined) {
                            mappedRow[col.key] = val;
                        }
                    });

                    // Ensure status is valid or default
                    // We don't map status directly to ID here, Context/AddActivities handles defaults (pending)
                    // But if we wanted to support importing status, we would map it here.

                    return mappedRow;
                });

                console.log('Dados formatados:', formatted);
                setImportedData(formatted);
            } catch (error) {
                console.error("Erro ao importar planilha:", error);
                alert("Erro ao processar arquivo. Verifique o console.");
            }
        };
        reader.readAsBinaryString(file);
    };

    const confirmImport = () => {
        addActivities(importedData);
        setSuccessMsg(`${importedData.length} atividades importadas com sucesso!`);
        setImportedData([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setTimeout(() => setSuccessMsg(''), 3000);
    };

    // Manual CRUD Handlers
    const handleNewActivity = () => {
        setEditingActivity(null);
        setIsModalOpen(true);
    };

    const handleEdit = (activity) => {
        setEditingActivity(activity);
        setIsModalOpen(true);
    };

    const handleDelete = (id) => {
        if (window.confirm('Tem certeza que deseja excluir esta atividade?')) {
            deleteActivity(id);
        }
    };

    const handleSaveActivity = (data) => {
        console.log("ActivityFormModal - onSave:", data, "Editing:", editingActivity);
        if (editingActivity) {
            // Edit
            if (!editingActivity.id) {
                alert("Erro: ID da atividade inválido para edição.");
                return;
            }
            editActivity(editingActivity.id, data);
        } else {
            // New
            // addActivities expects an array
            addActivities([data]);
        }
    };

    return (
        <div style={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
            {loading && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(255,255,255,0.8)', zIndex: 50, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #3498db', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                    <style>{`
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    `}</style>
                </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1>Lista de Atividades</h1>

            </div>

            {/* Import Section */}
            {/* Import Preview Section - Only show when data is loaded */}
            {user?.role === 'admin' && importedData.length > 0 && (
                <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>

                        {/* Preview Logic (Button/Input removed, triggered by bottom button) */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, width: '100%' }}>
                            {/* Debug Info: Detected Columns */}
                            <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.75rem', color: '#64748b' }}>
                                <strong>Colunas Detectadas no Excel:</strong> {importedData[0] && Object.keys(importedData[0]._raw || {}).join(', ')}
                                <br />
                                <strong>Exemplo de Mapeamento (Linha 1):</strong>
                                <ul style={{ margin: '0.25rem 0 0 1rem' }}>
                                    <li>Code: {importedData[0].code || 'NÃO ENCONTRADO'} (Buscou por: Código, ID_EXC...)</li>
                                    <li>Descrição: {importedData[0].description || 'NÃO ENCONTRADO'} (Buscou por: Descrição, OPERAÇÃO...)</li>
                                    <li>Data Início: {importedData[0].startDate ? new Date(importedData[0].startDate).toLocaleDateString() : 'NÃO ENCONTRADO'}</li>
                                </ul>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-success)', fontWeight: '500' }}>
                                    <FileSpreadsheet size={20} />
                                    {importedData.length} registros prontos para importação
                                </span>
                                <button
                                    className="btn btn-primary"
                                    onClick={confirmImport}
                                    style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                >
                                    <CheckCircle size={20} /> Confirmar Importação
                                </button>
                                <button
                                    className="btn btn-outline"
                                    onClick={() => setImportedData([])}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
                                >
                                    <Trash2 size={20} /> Cancelar
                                </button>
                            </div>

                            {/* Preview Table */}
                            <div style={{ maxHeight: '300px', overflow: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                                    <thead style={{ backgroundColor: '#f1f5f9', position: 'sticky', top: 0 }}>
                                        <tr>
                                            <th style={{ padding: '8px', textAlign: 'left' }}>Código</th>
                                            <th style={{ padding: '8px', textAlign: 'left' }}>Descrição</th>
                                            <th style={{ padding: '8px', textAlign: 'left' }}>Responsável</th>
                                            <th style={{ padding: '8px', textAlign: 'left' }}>Status</th>
                                            <th style={{ padding: '8px', textAlign: 'left' }}>Início</th>
                                            <th style={{ padding: '8px', textAlign: 'left' }}>Fim</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {importedData.slice(0, 50).map((row, idx) => (
                                            <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                                <td style={{ padding: '8px' }}>{row.code}</td>
                                                <td style={{ padding: '8px' }}>{row.description}</td>
                                                <td style={{ padding: '8px' }}>{row.responsible}</td>
                                                <td style={{ padding: '8px' }}>{row.status}</td>
                                                <td style={{ padding: '8px' }}>{row.startDate ? new Date(row.startDate).toLocaleDateString() : '-'}</td>
                                                <td style={{ padding: '8px' }}>{row.endDate ? new Date(row.endDate).toLocaleDateString() : '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {importedData.length > 50 && (
                                    <div style={{ padding: '8px', textAlign: 'center', backgroundColor: '#f8fafc', fontStyle: 'italic' }}>
                                        ... e mais {importedData.length - 50} linhas
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                    {successMsg && (
                        <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#dcfce7', color: '#166534', borderRadius: '8px' }}>
                            {successMsg}
                        </div>
                    )}
                </div>
            )}


            <div className="card" style={{ padding: '1rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div className="search-container" style={{ display: 'flex', alignItems: 'center', backgroundColor: '#f1f5f9', padding: '0.5rem 1rem', borderRadius: '0.5rem', flex: 1, minWidth: '300px' }}>
                        <Search size={20} color="#64748b" style={{ marginRight: '0.5rem' }} />
                        <input
                            type="text"
                            placeholder="Buscar atividades..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.875rem', color: '#334155' }}
                        />
                    </div>

                    {/* Admin Area Filter */}
                    {user?.role === 'admin' && (
                        <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#f1f5f9', padding: '0.25rem 0.5rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                            <span style={{ fontSize: '0.75rem', color: '#64748b', marginRight: '0.5rem', fontWeight: 600 }}>Área:</span>
                            <select
                                value={selectedArea}
                                onChange={handleAreaChange}
                                style={{ border: 'none', background: 'transparent', fontSize: '0.875rem', color: '#334155', fontWeight: 500, outline: 'none', cursor: 'pointer', minWidth: '100px' }}
                            >
                                {AREAS.map(area => (
                                    <option key={area} value={area}>{area}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Status Filter */}
                    <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#f1f5f9', padding: '0.25rem 0.5rem', borderRadius: '0.5rem' }}>
                        <Filter size={16} color="#64748b" style={{ marginRight: '0.5rem' }} />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.875rem', color: '#334155' }}
                        >
                            <option value="all">Todos Status</option>
                            <option value="pendente">Pendente</option>
                            <option value="em_execucao">Em Execução</option>
                            <option value="aguardando_materiais">Aguardando Materiais</option>
                            <option value="concluida">Concluída</option>
                            <option value="pausada">Pausada</option>
                            <option value="atrasada">Atrasada</option>
                        </select>
                    </div>

                    <div style={{ position: 'relative', height: '36px' }}>
                        <button
                            onClick={() => setIsColumnSelectorOpen(!isColumnSelectorOpen)}
                            className="btn btn-outline"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', height: '100%' }}
                        >
                            <Columns size={16} />
                            Colunas
                        </button>
                        {isColumnSelectorOpen && (
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                right: 0,
                                transform: 'translateY(0.5rem)',
                                backgroundColor: 'white',
                                border: '1px solid #e2e8f0',
                                borderRadius: '0.5rem',
                                padding: '0.5rem',
                                zIndex: 50,
                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                minWidth: '200px',
                                maxHeight: '300px',
                                overflowY: 'auto'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Exibir Colunas</span>
                                </div>
                                {COLUMNS_CONFIG.map(col => (
                                    <label key={col.key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem', fontSize: '0.75rem', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={visibleColumns.includes(col.key)}
                                            onChange={() => toggleColumn(col.key)}
                                        />
                                        {col.label}
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>

                    <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                        <Plus size={20} />
                        Nova
                    </button>
                    {/* Excel Import Button */}
                    <button
                        className="btn btn-success"
                        onClick={() => fileInputRef.current.click()}
                        disabled={loading}
                        style={{ backgroundColor: '#10b981', color: 'white', border: 'none' }}
                    >
                        <FileSpreadsheet size={20} />
                        Importar (Excel)
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept=".xlsx, .xls"
                        style={{ display: 'none' }}
                    />
                </div>
            </div>

            <div className="card" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: 0 }}>
                <div className="table-container" style={{ overflow: 'auto', flex: 1 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px', fontSize: '0.65rem' }}>
                        <thead style={{ backgroundColor: '#f8fafc', position: 'sticky', top: 0, zIndex: 10 }}>
                            <tr>
                                {COLUMNS_CONFIG.map(col => visibleColumns.includes(col.key) && (
                                    <th key={col.key} style={{ textAlign: 'left', padding: '0.25rem', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap', fontWeight: '600', color: '#64748b' }}>
                                        {col.label}
                                    </th>
                                ))}
                                {user?.role === 'admin' && <th style={{ textAlign: 'right', padding: '0.25rem', borderBottom: '1px solid #e2e8f0', fontWeight: '600', color: '#64748b' }}>Ações</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedActivities.map(activity => (
                                <tr key={activity.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.2s' }}>
                                    {COLUMNS_CONFIG.map(col => {
                                        if (!visibleColumns.includes(col.key)) return null;

                                        let content = activity[col.key];

                                        // Formatting
                                        if (col.key === 'status') {
                                            content = (
                                                <span style={{
                                                    backgroundColor: getStatusColor(activity.statusId),
                                                    color: getStatusTextColor(activity.statusId),
                                                    padding: '1px 4px',
                                                    borderRadius: '12px',
                                                    fontSize: '0.6rem',
                                                    fontWeight: '600'
                                                }}>
                                                    {activity.status}
                                                </span>
                                            );
                                        } else if (col.key === 'responsible') {
                                            content = (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.55rem', fontWeight: 'bold' }}>
                                                        {content ? String(content).charAt(0).toUpperCase() : '?'}
                                                    </div>
                                                    {content}
                                                </div>
                                            )
                                        } else if (col.isDate && content) {
                                            // Try simple date format
                                            try {
                                                if (String(content).includes('T')) {
                                                    const d = new Date(content);
                                                    if (!isNaN(d)) content = d.toLocaleDateString('pt-BR');
                                                } else if (String(content).includes('-')) {
                                                    content = new Date(content + 'T12:00:00').toLocaleDateString('pt-BR');
                                                }
                                            } catch (e) { /* ignore */ }
                                        }

                                        return (
                                            <td key={col.key} style={{ padding: '0.25rem', whiteSpace: 'nowrap' }}>
                                                {content || '-'}
                                            </td>
                                        );
                                    })}

                                    {user?.role === 'admin' && (
                                        <td style={{ padding: '0.25rem', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end' }}>
                                                <button
                                                    className="btn btn-outline"
                                                    style={{ padding: '1px', border: 'none' }}
                                                    onClick={() => handleEdit(activity)}
                                                >
                                                    <Edit size={12} />
                                                </button>
                                                <button
                                                    className="btn btn-outline"
                                                    style={{ padding: '1px', border: 'none', color: 'var(--color-danger)' }}
                                                    onClick={() => handleDelete(activity.id)}
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                            {filteredActivities.length === 0 && (
                                <tr>
                                    <td colSpan={visibleColumns.length + (user?.role === 'admin' ? 1 : 0)} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                                        Nenhuma atividade encontrada.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                <div style={{ padding: '0.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', fontSize: '0.75rem' }}>
                    <div>
                        Exibindo página {page + 1} de {totalPages} (Total: {totalCount} itens)
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            className="btn btn-outline"
                            disabled={page === 0}
                            onClick={() => handlePageChange(page - 1)}
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                        >
                            Anterior
                        </button>
                        <span style={{ display: 'flex', alignItems: 'center' }}>
                            Página {page + 1}
                        </span>
                        <button
                            className="btn btn-outline"
                            disabled={page >= totalPages - 1}
                            onClick={() => handlePageChange(page + 1)}
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                        >
                            Próxima
                        </button>
                    </div>
                </div>

                <ActivityFormModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveActivity}
                    initialData={editingActivity}
                />
            </div>
        </div>
    );
}
