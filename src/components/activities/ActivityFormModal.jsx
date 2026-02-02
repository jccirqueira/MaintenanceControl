import { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { useTeam } from '../../contexts/TeamContext';

const STATUS_OPTIONS = [
    { value: 'pendente', label: 'Pendente' },
    { value: 'em_execucao', label: 'Em Execução' },
    { value: 'aguardando_materiais', label: 'Aguardando Materiais' },
    { value: 'pausada', label: 'Pausada' },
    { value: 'concluida', label: 'Concluída' }
];

const PERCENTAGE_OPTIONS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

export default function ActivityFormModal({ isOpen, onClose, onSave, initialData = null }) {
    const { members } = useTeam();

    // Form State
    const [formData, setFormData] = useState({
        code: '',
        description: '',
        responsible: '',
        equipe: '',
        startDate: '',
        endDate: '',
        plannedStartDate: '',
        plannedEndDate: '',
        status: 'pendente',
        percentual: 0
    });

    useEffect(() => {
        if (isOpen) {
            const today = new Date().toISOString().split('T')[0];
            if (initialData) {
                setFormData({
                    code: initialData.code || '',
                    description: initialData.description || '',
                    responsible: initialData.responsible || '',
                    startDate: initialData.startDate ? String(initialData.startDate).split('T')[0] : today, // Default to today if missing? Or keep empty? Logic kept as is.
                    endDate: initialData.endDate ? String(initialData.endDate).split('T')[0] : '',
                    plannedStartDate: initialData.plannedStartDate ? String(initialData.plannedStartDate).split('T')[0] : '',
                    plannedEndDate: initialData.plannedEndDate ? String(initialData.plannedEndDate).split('T')[0] : '',
                    status: initialData.status || 'pendente',
                    percentual: initialData.percentual || 0,
                    equipe: initialData.equipe || (initialData.metadata && initialData.metadata.equipe) || ''
                });
            } else {
                setFormData({
                    code: '',
                    description: '',
                    responsible: '',
                    equipe: '',
                    startDate: today,
                    endDate: today,
                    plannedStartDate: today, // Default for new? 
                    plannedEndDate: today,
                    status: 'pendente',
                    percentual: 0
                });
            }
        }
    }, [isOpen, initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData(prev => {
            const newData = { ...prev, [name]: value };

            // Auto-update percentage if status becomes 'concluida'
            if (name === 'status' && (value === 'concluida' || value === 'done')) {
                newData.percentual = 100;
            }
            // Auto-update status if percentage becomes 100 ? (Optional, but user didn't ask explicitly. user asked Stauts -> %)
            // Let's stick to user request.

            return newData;
        });
    };

    const handleSubmit = () => {
        if (!formData.description) {
            alert('A descrição é obrigatória');
            return;
        }
        onSave(formData);
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={initialData ? 'Editar Atividade' : 'Nova Atividade'}
            footer={
                <>
                    <button className="btn btn-outline" onClick={onClose}>Cancelar</button>
                    <button className="btn btn-primary" onClick={handleSubmit}>Salvar</button>
                </>
            }
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                {/* Code */}
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Código (OS/Tag)</label>
                    <input
                        className="input"
                        name="code"
                        width="100%"
                        style={{ width: '100%', padding: '0.5rem' }}
                        value={formData.code}
                        onChange={handleChange}
                        placeholder="Ex: MAN-2024-001"
                    />
                </div>

                {/* Description */}
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Descrição *</label>
                    <textarea
                        className="input"
                        name="description"
                        style={{ width: '100%', padding: '0.5rem', minHeight: '80px' }}
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Descreva a atividade..."
                    />
                </div>

                {/* Dates Row 1: Planned */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Início Previsto</label>
                        <input
                            type="date"
                            className="input"
                            name="plannedStartDate"
                            style={{ width: '100%', padding: '0.5rem' }}
                            value={formData.plannedStartDate}
                            onChange={handleChange}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Término Previsto</label>
                        <input
                            type="date"
                            className="input"
                            name="plannedEndDate"
                            style={{ width: '100%', padding: '0.5rem' }}
                            value={formData.plannedEndDate}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                {/* Dates Row 2: Real */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Início (Real)</label>
                        <input
                            type="date"
                            className="input"
                            name="startDate"
                            style={{ width: '100%', padding: '0.5rem' }}
                            value={formData.startDate}
                            onChange={handleChange}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Término (Real)</label>
                        <input
                            type="date"
                            className="input"
                            name="endDate"
                            style={{ width: '100%', padding: '0.5rem' }}
                            value={formData.endDate}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                {/* Row 3: Status & Progress */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Status</label>
                        <select
                            className="input"
                            name="status"
                            style={{ width: '100%', padding: '0.5rem' }}
                            value={formData.status}
                            onChange={handleChange}
                        >
                            {STATUS_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Progresso (%)</label>
                        <select
                            className="input"
                            name="percentual"
                            style={{ width: '100%', padding: '0.5rem' }}
                            value={formData.percentual}
                            onChange={handleChange}
                        >
                            {PERCENTAGE_OPTIONS.map(val => (
                                <option key={val} value={val}>{val}%</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Row 4: Responsible & Team */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Responsável</label>
                        <select
                            className="input"
                            name="responsible"
                            style={{ width: '100%', padding: '0.5rem' }}
                            value={formData.responsible}
                            onChange={handleChange}
                        >
                            <option value="">Selecione...</option>
                            {members.map(m => (
                                <option key={m.id} value={m.name}>{m.name} ({m.role})</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Equipe</label>
                        <input
                            type="text"
                            className="input"
                            name="equipe"
                            style={{ width: '100%', padding: '0.5rem' }}
                            value={formData.equipe}
                            onChange={handleChange}
                            placeholder="Ex: Elétrica, Mecânica..."
                        />
                    </div>
                </div>

            </div>
        </Modal>
    );
}
