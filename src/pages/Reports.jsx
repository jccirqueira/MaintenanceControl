import { useState, useEffect } from 'react';
import { useActivities } from '../contexts/ActivitiesContext';
import { useTeam } from '../contexts/TeamContext';
import { getTeamMetrics, getMemberMetrics } from '../utils/analytics';
import { useAuth } from '../contexts/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Download, FileSpreadsheet } from 'lucide-react';
import ExcelJS from 'exceljs';

export default function Reports() {
    const { boardData } = useActivities();
    const { teams, members } = useTeam();
    const { user } = useAuth();

    // Filter State
    const [viewMode, setViewMode] = useState('general'); // 'general', 'team', 'member'
    const [selectedTeamId, setSelectedTeamId] = useState('');
    const [selectedMemberId, setSelectedMemberId] = useState('');

    // Enforce User Role Restrictions
    useEffect(() => {
        if (user && user.role === 'user') {
            const myMemberRecord = members.find(m => m.name === user.name);
            if (myMemberRecord) {
                setViewMode('member');
                setSelectedMemberId(myMemberRecord.id);
            }
        }
    }, [user, members]);

    // Flatten and Enrich Activities (Get Status from Column)
    const allActivities = [];
    if (boardData && boardData.columns) {
        Object.values(boardData.columns).forEach(column => {
            column.activityIds.forEach(activityId => {
                const activity = boardData.activities[activityId];
                if (activity) {
                    allActivities.push({
                        ...activity,
                        status: column.title, // Status from column title (Human Readable)
                        statusId: column.id
                    });
                }
            });
        });
    }

    const filteredActivities = allActivities.filter(activity => {
        if (viewMode === 'general') return true;

        if (viewMode === 'team') {
            if (!selectedTeamId) return true;
            // Get members of this team
            const teamMembers = members.filter(m => m.teamId === selectedTeamId).map(m => m.name);
            return teamMembers.includes(activity.responsible);
        }

        if (viewMode === 'member') {
            if (!selectedMemberId) return true;
            const member = members.find(m => m.id === selectedMemberId);
            return member && activity.responsible === member.name;
        }

        return true;
    });

    const isMemberView = viewMode === 'member';
    const metricsData = isMemberView
        ? getMemberMetrics(filteredActivities, members)
        : getTeamMetrics(filteredActivities, teams, members);

    // Prepare data for stacked bar (Total vs Delayed)
    const stackedData = metricsData.map(m => ({
        name: m.name,
        Concluído: m.completed,
        Atrasado: m.delayed,
        'Em Andamento': m.total - m.completed - m.delayed
    }));

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR');
    };

    const handleExport = () => {
        // Detailed Report Headers
        const headers = ['Código', 'Descrição', 'Responsável', 'Início Previsto', 'Fim Previsto', 'Status'];

        // Detailed Rows
        const rows = filteredActivities.map(act => [
            act.code || '-',
            act.description || act.content || '-', // Handle both keys just in case
            act.responsible || '-',
            formatDate(act.startDate),
            formatDate(act.endDate),
            act.status || '-'
        ]);

        let csvContent = "data:text/csv;charset=utf-8,\uFEFF" // Add BOM for Excel
            + headers.join(",") + "\n"
            + rows.map(e => e.map(field => `"${field}"`).join(",")).join("\n"); // Quote fields

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `relatorio_detalhado_${isMemberView ? 'membros' : 'equipes'}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportXLS = async () => {
        // Create Workbook and Sheet
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Atividades Detalhadas', {
            views: [
                { state: 'frozen', ySplit: 1, showGridLines: false }
            ]
        });

        // Define Columns
        worksheet.columns = [
            { header: 'Código', key: 'code', width: 15 },
            { header: 'Descrição', key: 'description', width: 40 },
            { header: 'Responsável', key: 'responsible', width: 20 },
            { header: 'Início Previsto', key: 'startDate', width: 15 },
            { header: 'Fim Previsto', key: 'endDate', width: 15 },
            { header: 'Status', key: 'status', width: 20 }
        ];

        // Add Data
        filteredActivities.forEach(act => {
            worksheet.addRow({
                code: act.code || '-',
                description: act.description || act.content || '-',
                responsible: act.responsible || '-',
                startDate: formatDate(act.startDate),
                endDate: formatDate(act.endDate),
                status: act.status || '-'
            });
        });

        // Styling
        worksheet.eachRow((row, rowNumber) => {
            // Common styles
            row.eachCell((cell) => {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
                cell.alignment = { vertical: 'top', wrapText: true };
                cell.font = { name: 'Arial', size: 10 };
            });

            // Header Style (Row 1)
            if (rowNumber === 1) {
                row.eachCell((cell) => {
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFE0E0E0' }
                    };
                    cell.font = { name: 'Arial', size: 10, bold: true };
                    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
                });
            } else {
                // Zebra Striping (Even rows get light gray)
                if (rowNumber % 2 === 0) {
                    row.eachCell((cell) => {
                        cell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'FFF5F5F5' }
                        };
                    });
                }
            }
        });

        // Generate Buffer and Download
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `relatorio_detalhado_${isMemberView ? 'membros' : 'equipes'}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    };

    return (
        <div style={{ paddingBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h1>Relatórios e Desempenho</h1>
                    {/* View Switcher Controls */}
                    {user?.role === 'user' ? (
                        <div style={{ padding: '0.5rem', backgroundColor: '#f1f5f9', borderRadius: '8px', color: '#64748b' }}>
                            <strong>Visualizando:</strong> Apenas Minhas Atividades ({user.name})
                        </div>
                    ) : (
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
                    )}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={handleExport} className="btn btn-outline">
                        <Download size={18} /> Exportar CSV
                    </button>
                    <button onClick={handleExportXLS} className="btn btn-outline" style={{ borderColor: '#16a34a', color: '#15803d' }}>
                        <FileSpreadsheet size={18} /> Exportar XLS
                    </button>
                </div>
            </div>

            <div className="responsive-grid">

                {/* Chart 1: Volume */}
                <div className="card" style={{ height: '400px' }}>
                    <h3 style={{ marginBottom: '1.5rem' }}>Volume de Atividades por {isMemberView ? 'Membro' : 'Equipe'}</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={metricsData} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="total" name="Total de Atividades" fill="#8884d8">
                                {metricsData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color || '#8884d8'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Chart 2: Status Breakdown */}
                <div className="card" style={{ height: '400px' }}>
                    <h3 style={{ marginBottom: '1.5rem' }}>Status por {isMemberView ? 'Membro' : 'Equipe'} (Stacked)</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stackedData} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="Concluído" stackId="a" fill="var(--color-success)" />
                            <Bar dataKey="Em Andamento" stackId="a" fill="var(--color-secondary)" />
                            <Bar dataKey="Atrasado" stackId="a" fill="var(--color-danger)" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

            </div>

            {/* Summary Table */}
            <div className="card" style={{ marginTop: '2rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>Detalhamento Completo</h3>
                <div className="table-container">
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                                <th style={{ padding: '1rem' }}>{isMemberView ? 'Membro' : 'Equipe'}</th>
                                <th style={{ padding: '1rem' }}>Total</th>
                                <th style={{ padding: '1rem' }}>Concluídas</th>
                                <th style={{ padding: '1rem' }}>Atrasadas (%)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {metricsData.map(m => {
                                const delayedPercent = m.total > 0 ? ((m.delayed / m.total) * 100).toFixed(1) : 0;
                                return (
                                    <tr key={m.name} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '1rem', fontWeight: 'bold' }}>{m.name}</td>
                                        <td style={{ padding: '1rem' }}>{m.total}</td>
                                        <td style={{ padding: '1rem' }}>{m.completed}</td>
                                        <td style={{ padding: '1rem', color: Number(delayedPercent) > 0 ? 'var(--color-danger)' : 'inherit' }}>
                                            {m.delayed} ({delayedPercent}%)
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
