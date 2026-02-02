import { useState, useRef } from 'react';
import { useTeam } from '../contexts/TeamContext';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Trash2, Users, UserPlus, Edit, Camera, Upload, Shield, User, X } from 'lucide-react';
import Modal from '../components/common/Modal';

export default function Team() {
    const { user } = useAuth();
    const { teams, members, addTeam, removeTeam, addMember, editMember, removeMember } = useTeam();
    const [selectedTeam, setSelectedTeam] = useState(null);

    // Modals state
    const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
    const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);

    // Form state
    const [newTeamName, setNewTeamName] = useState('');

    // Member Form State
    const [editingMember, setEditingMember] = useState(null);
    const [memberName, setMemberName] = useState('');
    const [memberRole, setMemberRole] = useState('Técnico'); // Default
    const [memberAccessLevel, setMemberAccessLevel] = useState('user'); // admin | user
    const [memberPhoto, setMemberPhoto] = useState(null);
    const [memberUsername, setMemberUsername] = useState('');
    const [memberPassword, setMemberPassword] = useState('');

    const fileInputRef = useRef(null);

    const filteredMembers = selectedTeam
        ? members.filter(m => m.teamId === selectedTeam.id)
        : [];

    const handleAddTeam = () => {
        if (newTeamName.trim()) {
            addTeam(newTeamName);
            setNewTeamName('');
            setIsTeamModalOpen(false);
        }
    };

    const openNewMemberModal = () => {
        setEditingMember(null);
        setMemberName('');
        setMemberRole('Técnico');
        setMemberAccessLevel('user');
        setMemberPhoto(null);
        setMemberUsername('');
        setMemberPassword('123'); // Default simple password
        setIsMemberModalOpen(true);
    };

    const openEditMemberModal = (member) => {
        setEditingMember(member);
        setMemberName(member.name);
        setMemberRole(member.role);
        setMemberAccessLevel(member.accessLevel || 'user');
        setMemberPhoto(member.photo || null);
        setMemberUsername(member.username || '');
        setMemberPassword(member.password || '');
        setIsMemberModalOpen(true);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setMemberPhoto(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemovePhoto = () => {
        setMemberPhoto(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSaveMember = () => {
        if (memberName.trim()) {
            if (editingMember) {
                // Edit
                editMember(editingMember.id, {
                    name: memberName,
                    role: memberRole,
                    accessLevel: memberAccessLevel,
                    photo: memberPhoto,
                    username: memberUsername,
                    password: memberPassword
                });
            } else {
                // Create
                if (selectedTeam) {
                    addMember(memberName, memberRole, selectedTeam.id, memberPhoto, memberAccessLevel, memberUsername, memberPassword);
                }
            }
            setIsMemberModalOpen(false);
        }
    };

    return (
        <div style={{ height: 'calc(100vh - 120px)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1>Gestão de Equipes</h1>
            </div>

            <div className="responsive-grid" style={{ gridTemplateColumns: 'minmax(250px, 300px) 1fr', gap: '2rem', height: '100%' }}>
                {/* Teams List */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h2 style={{ fontSize: '1.2rem' }}>Equipes</h2>
                        {user?.role === 'admin' && (
                            <button className="btn btn-outline" onClick={() => setIsTeamModalOpen(true)} style={{ padding: '0.25rem 0.5rem' }}>
                                <Plus size={16} />
                            </button>
                        )}
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {teams.map(team => (
                            <div
                                key={team.id}
                                onClick={() => setSelectedTeam(team)}
                                style={{
                                    padding: '1rem',
                                    borderRadius: '6px',
                                    marginBottom: '0.5rem',
                                    cursor: 'pointer',
                                    backgroundColor: selectedTeam?.id === team.id ? 'var(--color-primary)' : '#f8fafc',
                                    color: selectedTeam?.id === team.id ? 'white' : 'inherit',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    transition: 'all 0.2s',
                                    borderLeft: selectedTeam?.id === team.id ? `4px solid ${team.color}` : '4px solid transparent'
                                }}
                            >
                                <span style={{ fontWeight: 'bold' }}>{team.name}</span>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                                        {members.filter(m => m.teamId === team.id).length} <Users size={12} style={{ display: 'inline' }} />
                                    </span>
                                    {selectedTeam?.id === team.id && user?.role === 'admin' && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); removeTeam(team.id); }}
                                            style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Members List */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    {selectedTeam ? (
                        <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h2 style={{ fontSize: '1.2rem' }}>Membros: {selectedTeam.name}</h2>
                                {user?.role === 'admin' && (
                                    <button className="btn btn-primary" onClick={openNewMemberModal}>
                                        <UserPlus size={16} /> Novo Membro
                                    </button>
                                )}
                            </div>

                            <div className="table-container" style={{ flex: 1, overflowY: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                                            <th style={{ textAlign: 'left', padding: '0.75rem', width: '60px' }}>Foto</th>
                                            <th style={{ textAlign: 'left', padding: '0.75rem' }}>Nome</th>
                                            <th style={{ textAlign: 'left', padding: '0.75rem' }}>Função</th>
                                            <th style={{ textAlign: 'left', padding: '0.75rem' }}>Acesso</th>
                                            <th style={{ textAlign: 'right', padding: '0.75rem' }}>Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredMembers.map(member => (
                                            <tr key={member.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <td style={{ padding: '0.75rem' }}>
                                                    <div style={{
                                                        width: '40px',
                                                        height: '40px',
                                                        borderRadius: '50%',
                                                        overflow: 'hidden',
                                                        backgroundColor: '#e2e8f0',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}>
                                                        {member.photo ? (
                                                            <img src={member.photo} alt={member.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        ) : (
                                                            <Users size={20} color="#94a3b8" />
                                                        )}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '0.75rem', fontWeight: '500' }}>{member.name}</td>
                                                <td style={{ padding: '0.75rem' }}>
                                                    <span style={{
                                                        backgroundColor: '#e0f2fe',
                                                        color: '#0369a1',
                                                        padding: '2px 8px',
                                                        borderRadius: '12px',
                                                        fontSize: '0.85rem'
                                                    }}>
                                                        {member.role}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '0.75rem' }}>
                                                    <span style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        backgroundColor: member.accessLevel === 'admin' ? '#fef3c7' : '#f1f5f9',
                                                        color: member.accessLevel === 'admin' ? '#d97706' : '#64748b',
                                                        padding: '2px 8px',
                                                        borderRadius: '12px',
                                                        fontSize: '0.85rem',
                                                        fontWeight: 'bold'
                                                    }}>
                                                        {member.accessLevel === 'admin' ? <Shield size={12} /> : <User size={12} />}
                                                        {member.accessLevel === 'admin' ? 'Admin' : 'User'}
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: 'right', padding: '0.75rem' }}>
                                                    {user?.role === 'admin' && (
                                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                                            <button
                                                                onClick={() => openEditMemberModal(member)}
                                                                className="btn btn-outline"
                                                                style={{ padding: '4px 8px', borderColor: '#cbd5e1' }}
                                                            >
                                                                <Edit size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => removeMember(member.id)}
                                                                className="btn btn-outline"
                                                                style={{ padding: '4px 8px', borderColor: '#fee2e2', color: 'var(--color-danger)' }}
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredMembers.length === 0 && (
                                            <tr>
                                                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)' }}>
                                                    Nenhum membro cadastrado nesta equipe.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-text-secondary)' }}>
                            <Users size={48} style={{ marginBottom: '1rem', opacity: 0.2 }} />
                            <p>Selecione uma equipe para visualizar e gerenciar os membros.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal: New Team */}
            <Modal
                isOpen={isTeamModalOpen}
                onClose={() => setIsTeamModalOpen(false)}
                title="Nova Equipe"
                footer={
                    <>
                        <button className="btn btn-outline" onClick={() => setIsTeamModalOpen(false)}>Cancelar</button>
                        <button className="btn btn-primary" onClick={handleAddTeam}>Criar</button>
                    </>
                }
            >
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Nome da Equipe</label>
                <input
                    className="input"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem' }}
                    placeholder="Ex: Manutenção Mecânica"
                />
            </Modal>

            {/* Modal: Add/Edit Member */}
            <Modal
                isOpen={isMemberModalOpen}
                onClose={() => setIsMemberModalOpen(false)}
                title={editingMember ? "Editar Colaborador" : "Novo Colaborador"}
                footer={
                    <>
                        <button className="btn btn-outline" onClick={() => setIsMemberModalOpen(false)}>Cancelar</button>
                        <button className="btn btn-primary" onClick={handleSaveMember}>{editingMember ? "Salvar" : "Adicionar"}</button>
                    </>
                }
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                    {/* Photo Upload Section */}
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                        <div style={{ position: 'relative', width: '100px', height: '100px' }}>
                            <div style={{
                                width: '100%',
                                height: '100%',
                                borderRadius: '50%',
                                overflow: 'hidden',
                                border: '2px solid var(--color-border)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: '#f1f5f9'
                            }}>
                                {memberPhoto ? (
                                    <img src={memberPhoto} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <Camera size={40} color="#cbd5e1" />
                                )}
                            </div>
                            <button
                                onClick={() => fileInputRef.current.click()}
                                style={{
                                    position: 'absolute',
                                    bottom: '0',
                                    right: '0',
                                    backgroundColor: 'var(--color-primary)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '32px',
                                    height: '32px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer'
                                }}
                                title="Alterar Foto"
                            >
                                <Upload size={16} />
                            </button>
                            {memberPhoto && (
                                <button
                                    onClick={handleRemovePhoto}
                                    style={{
                                        position: 'absolute',
                                        top: '0',
                                        right: '0',
                                        backgroundColor: 'var(--color-danger)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '50%',
                                        width: '24px',
                                        height: '24px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer'
                                    }}
                                    title="Remover Foto"
                                >
                                    <X size={12} /> {/* Assuming X is imported or trash */}
                                </button>
                            )}
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                            style={{ display: 'none' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Nome Completo</label>
                        <input
                            className="input"
                            value={memberName}
                            onChange={(e) => setMemberName(e.target.value)}
                            style={{ width: '100%', padding: '0.5rem' }}
                            placeholder="Ex: José Santos"
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Função</label>
                            <select
                                className="input"
                                value={memberRole}
                                onChange={(e) => setMemberRole(e.target.value)}
                                style={{ width: '100%', padding: '0.5rem' }}
                            >
                                <option value="Coordenador">Coordenador</option>
                                <option value="Técnico">Técnico</option>
                                <option value="Mecânico">Mecânico</option>
                                <option value="Eletricista">Eletricista</option>
                                <option value="Auxiliar">Auxiliar</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Nível de Acesso</label>
                            <select
                                className="input"
                                value={memberAccessLevel}
                                onChange={(e) => setMemberAccessLevel(e.target.value)}
                                style={{ width: '100%', padding: '0.5rem' }}
                            >
                                <option value="user">Usuário Comum</option>
                                <option value="admin">Administrador</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem', marginTop: '0.5rem' }}>
                        <h3 style={{ fontSize: '0.9rem', marginBottom: '0.75rem', color: 'var(--color-primary)' }}>Credenciais de Acesso</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Usuário</label>
                                <input
                                    className="input"
                                    value={memberUsername}
                                    onChange={(e) => setMemberUsername(e.target.value)}
                                    style={{ width: '100%', padding: '0.5rem' }}
                                    placeholder="usuario.sistema"
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Senha</label>
                                <input
                                    className="input"
                                    type="password"
                                    value={memberPassword}
                                    onChange={(e) => setMemberPassword(e.target.value)}
                                    style={{ width: '100%', padding: '0.5rem' }}
                                    placeholder="******"
                                />
                            </div>
                        </div>
                    </div>

                </div>
            </Modal>
        </div>
    );
}
