import { useState, useRef } from 'react';
import { useTeam } from '../contexts/TeamContext';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Edit, Trash2, Search, Shield, User, Key, Mail, Upload, Camera } from 'lucide-react';

export default function Users() {
    const { members, teams, addMember, editMember, removeMember } = useTeam();
    const { user: currentUser } = useAuth(); // To protect or hide self-delete if needed

    // State
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    // Filtered Users
    const filteredUsers = members.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.username && u.username.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Form Handling
    const handleNewUser = () => {
        setEditingUser(null);
        setIsModalOpen(true);
    };

    const handleEditUser = (user) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };

    const handleDeleteUser = (id) => {
        if (window.confirm('Tem certeza que deseja remover este usuário do sistema?')) {
            removeMember(id);
        }
    };


    return (
        <div style={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1>Gestão de Usuários</h1>
                <button className="btn btn-primary" onClick={handleNewUser}>
                    <Plus size={20} /> Novo Usuário
                </button>
            </div>

            <div className="card" style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

                {/* Search Bar */}
                <div style={{ marginBottom: '1.5rem', maxWidth: '400px', display: 'flex', alignItems: 'center', backgroundColor: '#f1f5f9', padding: '0.5rem 1rem', borderRadius: '0.5rem' }}>
                    <Search size={20} color="#64748b" style={{ marginRight: '0.5rem' }} />
                    <input
                        type="text"
                        placeholder="Buscar por nome, cargo ou email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.875rem', color: '#334155' }}
                    />
                </div>

                {/* Table */}
                <div className="table-container" style={{ overflow: 'auto', flex: 1 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px', fontSize: '0.875rem' }}>
                        <thead style={{ backgroundColor: '#f8fafc', position: 'sticky', top: 0, zIndex: 10 }}>
                            <tr>
                                <th style={{ textAlign: 'left', padding: '1rem', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>Usuário</th>
                                <th style={{ textAlign: 'left', padding: '1rem', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>Cargo / Equipe</th>
                                <th style={{ textAlign: 'left', padding: '1rem', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>Acesso</th>
                                <th style={{ textAlign: 'left', padding: '1rem', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>Login (Email)</th>
                                <th style={{ textAlign: 'right', padding: '1rem', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map(u => {
                                const team = teams.find(t => t.id === u.teamId);
                                return (
                                    <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                {/* Avatar Display */}
                                                <div style={{
                                                    width: '40px', height: '40px', borderRadius: '50%',
                                                    backgroundColor: team?.color || '#e2e8f0', color: 'white',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontWeight: 'bold', fontSize: '1rem', overflow: 'hidden',
                                                    border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                                }}>
                                                    {u.photo ? (
                                                        <img src={u.photo} alt={u.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    ) : (
                                                        u.name.charAt(0).toUpperCase()
                                                    )}
                                                </div>
                                                <span style={{ fontWeight: '500' }}>{u.name}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span>{u.role}</span>
                                                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{team?.name || 'Sem Equipe'}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                                                padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '600',
                                                backgroundColor: u.accessLevel === 'admin' ? '#dbeafe' : '#f1f5f9',
                                                color: u.accessLevel === 'admin' ? '#1e40af' : '#475569'
                                            }}>
                                                {u.accessLevel === 'admin' ? <Shield size={12} /> : <User size={12} />}
                                                {u.accessLevel === 'admin' ? 'Administrador' : 'Usuário'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem', color: '#64748b' }}>
                                            {u.username || '-'}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                                <button className="btn btn-outline" onClick={() => handleEditUser(u)} style={{ padding: '0.5rem' }}>
                                                    <Edit size={16} />
                                                </button>
                                                <button className="btn btn-outline" onClick={() => handleDeleteUser(u.id)} style={{ padding: '0.5rem', color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal - User Form */}
            {isModalOpen && (
                <UserFormModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    initialData={editingUser}
                    teams={teams}
                    onSave={(data) => {
                        if (editingUser) {
                            editMember(editingUser.id, data);
                        } else {
                            addMember(data.name, data.role, data.teamId, data.photo, data.accessLevel, data.username, data.password);
                        }
                        setIsModalOpen(false);
                    }}
                />
            )}
        </div>
    );
}

function UserFormModal({ isOpen, onClose, initialData, teams, onSave }) {
    if (!isOpen) return null;

    const fileInputRef = useRef(null);
    const [formData, setFormData] = useState(initialData || {
        name: '',
        role: '',
        teamId: teams[0]?.id || '',
        photo: null,
        accessLevel: 'user',
        username: '',
        password: '123' // Default password suggestion
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    const handlePhotoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, photo: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
            <div className="card" style={{ width: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
                <h2 style={{ marginBottom: '1.5rem' }}>{initialData ? 'Editar Usuário' : 'Novo Usuário'}</h2>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                    {/* Photo Upload - Centered */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1rem' }}>
                        <div
                            style={{
                                width: '100px', height: '100px', borderRadius: '50%',
                                backgroundColor: '#f1f5f9', border: '2px dashed #cbd5e1',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                overflow: 'hidden', position: 'relative', cursor: 'pointer'
                            }}
                            onClick={() => fileInputRef.current.click()}
                        >
                            {formData.photo ? (
                                <img src={formData.photo} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <Camera size={32} color="#94a3b8" />
                            )}
                            <div style={{
                                position: 'absolute', bottom: 0, left: 0, right: 0,
                                backgroundColor: 'rgba(0,0,0,0.5)', color: 'white',
                                fontSize: '0.6rem', padding: '2px', textAlign: 'center'
                            }}>
                                Alterar
                            </div>
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            accept="image/*"
                            onChange={handlePhotoUpload}
                        />
                        <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>Clique para enviar foto</span>
                    </div>

                    {/* Name */}
                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Nome Completo</label>
                        <input
                            type="text" required className="input" style={{ width: '100%' }}
                            value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    {/* Email/Login */}
                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>E-mail (Login)</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={16} style={{ position: 'absolute', left: '10px', top: '12px', color: '#94a3b8' }} />
                            <input
                                type="text" className="input" style={{ width: '100%', paddingLeft: '2.5rem' }}
                                placeholder="nome.sobrenome@drivetech.com"
                                value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })}
                            />
                        </div>
                        <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Utilizado para login no sistema.</p>
                    </div>

                    {/* Password - Conditional Hint */}
                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Senha Inicial (Provisória)</label>
                        <div style={{ position: 'relative' }}>
                            <Key size={16} style={{ position: 'absolute', left: '10px', top: '12px', color: '#94a3b8' }} />
                            <input
                                type="text" className="input" style={{ width: '100%', paddingLeft: '2.5rem' }}
                                value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>
                        <p style={{ fontSize: '0.75rem', color: '#eab308', marginTop: '0.25rem' }}>
                            Nota: Em produção, o usuário receberia um email para definir a senha. Aqui, definimos manualmente.
                        </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        {/* Role */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Cargo</label>
                            <input
                                type="text" className="input" style={{ width: '100%' }}
                                placeholder="Ex: Técnico Mecânico"
                                value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}
                            />
                        </div>

                        {/* Team */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Equipe</label>
                            <select
                                className="input" style={{ width: '100%' }}
                                value={formData.teamId} onChange={e => setFormData({ ...formData, teamId: e.target.value })}
                            >
                                <option value="">Selecione...</option>
                                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Access Level */}
                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Nível de Acesso</label>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.5rem', border: `1px solid ${formData.accessLevel === 'user' ? 'var(--color-primary)' : '#e2e8f0'}`, borderRadius: '6px', flex: 1 }}>
                                <input
                                    type="radio" name="accessLevel" value="user"
                                    checked={formData.accessLevel === 'user'}
                                    onChange={() => setFormData({ ...formData, accessLevel: 'user' })}
                                />
                                <div>
                                    <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>Usuário</div>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Visualiza e edita suas tarefas.</div>
                                </div>
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.5rem', border: `1px solid ${formData.accessLevel === 'admin' ? 'var(--color-primary)' : '#e2e8f0'}`, borderRadius: '6px', flex: 1 }}>
                                <input
                                    type="radio" name="accessLevel" value="admin"
                                    checked={formData.accessLevel === 'admin'}
                                    onChange={() => setFormData({ ...formData, accessLevel: 'admin' })}
                                />
                                <div>
                                    <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>Administrador</div>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Acesso total ao sistema.</div>
                                </div>
                            </label>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                        <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
