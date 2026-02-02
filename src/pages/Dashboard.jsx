import { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useActivities } from '../contexts/ActivitiesContext';
import { useTeam } from '../contexts/TeamContext';
import { getTeamMetrics } from '../utils/analytics';
import { useAuth } from '../contexts/AuthContext';
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { AlertTriangle, CheckCircle, Clock, PlayCircle, Filter } from 'lucide-react';

const STATUS_COLORS = {
    'pendente': '#94a3b8',
    'em_execucao': '#3b82f6',
    'aguardando_materiais': '#f59e0b',
    'pausada': '#ef4444',
    'concluida': '#22c55e',
    'atrasado': '#dc2626' // Red
};

const STATUS_LABELS = {
    'pendente': 'Pendente',
    'em_execucao': 'Em Execução',
    'aguardando_materiais': 'Ag. Materiais',
    'pausada': 'Pausada',
    'concluida': 'Concluída',
    'atrasado': 'Atrasado'
};

import { AREAS } from '../constants/areas';

export default function Dashboard() {
    const { boardData, dashboardStats, fetchDashboardMetrics } = useActivities();
    const { user } = useAuth();
    const { teams, members } = useTeam(); // Moved here for clarity and consistency
    const location = useLocation(); // To detect if we came from login/refresh

    useEffect(() => {
        // Fetch stats if empty
        if (!dashboardStats.loading && !dashboardStats.counts.length) {
            fetchDashboardMetrics();
        }
    }, []);

    const [viewMode, setViewMode] = useState('general'); // 'general', 'team', 'member'
    const [selectedTeamId, setSelectedTeamId] = useState('');
    const [selectedMemberId, setSelectedMemberId] = useState('');
    const [selectedArea, setSelectedArea] = useState('Todas'); // New state for area filter


    // 1. Memoize Filter Logic
    const filteredActivities = useMemo(() => {
        // Use global analytics data instead of paginated boardData
        const sourceData = dashboardStats.rawData || [];

        return sourceData.filter(activity => {
            // Filter by View Mode (Team/Member)
            if (viewMode === 'team' && selectedTeamId) {
                const teamMemberNames = members
                    .filter(m => m.teamId === selectedTeamId)
                    .map(m => m.name);
                if (!teamMemberNames.includes(activity.responsible)) return false;
            }

            if (viewMode === 'member' && selectedMemberId) {
                const member = members.find(m => m.id === selectedMemberId);
                return member ? activity.responsible === member.name : false;
            }

            // Filter by Area
            if (selectedArea !== 'Todas') {
                const meta = activity.metadata || {};
                // Check all known keys for the area value (same logic as ActivitiesContext)
                const areaToCheck = selectedArea;
                const val = meta.area || meta.ÁREA || meta['Área'] || meta.Area || meta.area4 || meta['ÁREA4'];

                // Compare values safely
                if (String(val).trim() !== String(areaToCheck).trim()) return false;
            }

            return true;
        });
    }, [dashboardStats.rawData, viewMode, selectedTeamId, selectedMemberId, members, selectedArea]);

    // 2. Memoize Stats Calculation
    const { statusCounts, delayedCount, pieData, barData } = useMemo(() => {
        const counts = {
            'pendente': 0,
            'em_execucao': 0,
            'aguardando_materiais': 0,
            'pausada': 0,
            'concluida': 0,
            'atrasado': 0
        };

        filteredActivities.forEach(act => {
            const isDelayed = new Date(act.endDate) < new Date() && act.status !== 'concluida';

            if (isDelayed) {
                counts['atrasado']++;
            } else {
                if (counts[act.status] !== undefined) {
                    counts[act.status]++;
                }
            }
        });

        const dCount = counts['atrasado'];

        const pData = Object.keys(counts).map(key => ({
            name: STATUS_LABELS[key] || key,
            value: counts[key],
            color: STATUS_COLORS[key],
            key: key
        })).filter(d => d.value > 0);

        // Calculate Team Metrics (now O(N) optimized)
        const teamMetrics = getTeamMetrics(filteredActivities, teams, members);

        const bData = teamMetrics.map(m => ({
            name: m.name,
            completed: m.completed,
            active: m.total - m.completed,
            delayed: m.delayed
        }));

        return { statusCounts: counts, delayedCount: dCount, pieData: pData, barData: bData };
    }, [filteredActivities, teams, members]); // Recalculate only when filtered data changes

    const simulateWhatsapp = () => {
        if (user?.role !== 'admin') {
            alert("Apenas administradores podem enviar notificações.");
            return;
        }

        const delayedActivities = filteredActivities.filter(a => new Date(a.endDate) < new Date() && a.status !== 'concluida');

        if (delayedActivities.length === 0) {
            alert("Não há atividades atrasadas para notificar.");
            return;
        }

        // Group by Responsible
        const delaysByPerson = delayedActivities.reduce((acc, act) => {
            const person = act.responsible || 'Sem Responsável';
            if (!acc[person]) acc[person] = 0;
            acc[person]++;
            return acc;
        }, {});

        const adminName = user?.name || "Administrador";

        // Send message for each person
        Object.entries(delaysByPerson).forEach(([personName, count]) => {
            const message = `*Relatório de Atividades Manutenção Zilor USJ*\n\nOlá ${personName},\nVocê possui ${count} atividades em atraso.\nPor favor verifique o painel.\n\n- ${adminName}`;
            console.log(`[WHATSAPP-MOCK] Sending to ${personName}: ${message}`);
            alert(`Mensagem enviada para ${personName} via WhatsApp:\n\n${message}`);
        });
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h1>Dashboard Operacional</h1>

                    {/* View Switcher Controls */}
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', backgroundColor: '#e2e8f0', padding: '4px', borderRadius: '8px' }}>
                            <button
                                onClick={() => setViewMode('general')}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    backgroundColor: viewMode === 'general' ? 'white' : 'transparent',
                                    color: viewMode === 'general' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                                    fontWeight: viewMode === 'general' ? 'bold' : 'normal',
                                    cursor: 'pointer',
                                    boxShadow: viewMode === 'general' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                    transition: 'all 0.2s'
                                }}
                            >
                                Geral
                            </button>
                            <button
                                onClick={() => setViewMode('team')}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    backgroundColor: viewMode === 'team' ? 'white' : 'transparent',
                                    color: viewMode === 'team' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                                    fontWeight: viewMode === 'team' ? 'bold' : 'normal',
                                    cursor: 'pointer',
                                    boxShadow: viewMode === 'team' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                    transition: 'all 0.2s'
                                }}
                            >
                                Por Equipe
                            </button>
                            <button
                                onClick={() => setViewMode('member')}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    backgroundColor: viewMode === 'member' ? 'white' : 'transparent',
                                    color: viewMode === 'member' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                                    fontWeight: viewMode === 'member' ? 'bold' : 'normal',
                                    cursor: 'pointer',
                                    boxShadow: viewMode === 'member' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                    transition: 'all 0.2s'
                                }}
                            >
                                Por Membro
                            </button>
                        </div>

                        {/* Team Dropdown */}
                        {viewMode === 'team' && (
                            <select
                                className="input"
                                value={selectedTeamId}
                                onChange={(e) => setSelectedTeamId(e.target.value)}
                                style={{ padding: '8px', minWidth: '200px' }}
                            >
                                <option value="">Selecione uma equipe...</option>
                                {teams.map(team => (
                                    <option key={team.id} value={team.id}>{team.name}</option>
                                ))}
                            </select>
                        )}

                        {/* Member Dropdown */}
                        {viewMode === 'member' && (
                            <select
                                className="input"
                                value={selectedMemberId}
                                onChange={(e) => setSelectedMemberId(e.target.value)}
                                style={{ padding: '8px', minWidth: '200px' }}
                            >
                                <option value="">Selecione um membro...</option>
                                {members.map(member => (
                                    <option key={member.id} value={member.id}>{member.name}</option>
                                ))}
                            </select>
                        )}
                    </div>
                </div>

                {user?.role === 'admin' && (
                    <button onClick={simulateWhatsapp} className="btn btn-outline" style={{ borderColor: '#25D366', color: '#128C7E', gap: '0.5rem', alignSelf: 'flex-start' }}>
                        <CheckCircle size={18} /> Enviar Cobrança WhatsApp
                    </button>
                )}
            </div>

            {/* KPI Cards */}
            <div className="responsive-grid" style={{ marginBottom: '2rem' }}>
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '0.75rem', backgroundColor: '#eff6ff', borderRadius: '50%', color: '#3b82f6' }}>
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Total Pendentes</p>
                        <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{statusCounts.pendente || 0}</span>
                    </div>
                </div>

                <div className="flex flex-wrap gap-4 items-center bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2">
                        <Filter className="w-5 h-5 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">Áreas:</span>
                    </div>

                    {/* Area Filter */}
                    <select
                        value={selectedArea}
                        onChange={(e) => setSelectedArea(e.target.value)}
                        className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px]"
                    >
                        {AREAS.map(area => (
                            <option key={area} value={area}>{area}</option>
                        ))}
                    </select>
                </div>

                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '0.75rem', backgroundColor: '#fef3c7', borderRadius: '50%', color: '#d97706' }}>
                        <PlayCircle size={24} />
                    </div>
                    <div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Em Execução</p>
                        <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{statusCounts.em_execucao || 0}</span>
                    </div>
                </div>

                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '0.75rem', backgroundColor: '#dcfce7', borderRadius: '50%', color: '#16a34a' }}>
                        <CheckCircle size={24} />
                    </div>
                    <div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Concluídas</p>
                        <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{statusCounts.concluida || 0}</span>
                    </div>
                </div>

                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '0.75rem', backgroundColor: '#fee2e2', borderRadius: '50%', color: '#dc2626' }}>
                        <Clock size={24} />
                    </div>
                    <div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Atrasadas</p>
                        <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-danger)' }}>{delayedCount}</span>
                    </div>
                </div>
            </div>

            <div className="responsive-grid">
                {/* Chart 1 */}
                <div className="card" style={{ height: '400px' }}>
                    <h3 style={{ marginBottom: '1.5rem' }}>Status das Atividades</h3>
                    <ResponsiveContainer width="100%" height="80%">
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Chart 2 */}
                <div className="card" style={{ height: '400px' }}>
                    <h3 style={{ marginBottom: '1.5rem' }}>Desempenho por Equipe</h3>
                    <ResponsiveContainer width="100%" height="80%">
                        <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="completed" name="Concluídas" fill="var(--color-success)" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>

    );
}
