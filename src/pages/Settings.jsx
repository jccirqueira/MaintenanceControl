import { useState, useEffect } from 'react';
import { Save, MessageSquare, Trash2 } from 'lucide-react';
import { useActivities } from '../contexts/ActivitiesContext';

export default function Settings() {
    const { wipeAllActivities } = useActivities();
    const [phoneNumber, setPhoneNumber] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [enableNotifications, setEnableNotifications] = useState(false);
    const [message, setMessage] = useState('');

    const handleDeleteAll = async () => {
        if (window.confirm("ATENÇÃO: Isso apagará TODAS as atividades do sistema permanentemente.\n\nTem certeza absoluta?")) {
            if (window.confirm("Confirmação Final: Digite OK para apagar.")) { // Simplified check for now
                const success = await wipeAllActivities();
                if (success) {
                    alert('Banco de dados limpo com sucesso.');
                }
            }
        }
    };

    useEffect(() => {
        // Load settings from localStorage
        const savedPhone = localStorage.getItem('whatsapp_phone');
        const savedKey = localStorage.getItem('whatsapp_api_key');
        const savedEnabled = localStorage.getItem('whatsapp_enabled');

        if (savedPhone) setPhoneNumber(savedPhone);
        if (savedKey) setApiKey(savedKey);
        if (savedEnabled) setEnableNotifications(savedEnabled === 'true');
    }, []);

    const handleSave = (e) => {
        e.preventDefault();

        // Save to localStorage
        localStorage.setItem('whatsapp_phone', phoneNumber);
        localStorage.setItem('whatsapp_api_key', apiKey);
        localStorage.setItem('whatsapp_enabled', enableNotifications);

        setMessage('Configurações salvas com sucesso!');
        setTimeout(() => setMessage(''), 3000);
    };

    return (
        <div style={{ paddingBottom: '2rem' }}>
            <h1 style={{ marginBottom: '2rem' }}>Configurações</h1>

            <div className="card" style={{ maxWidth: '600px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
                    <div style={{ padding: '0.75rem', backgroundColor: '#dcfce7', borderRadius: '50%', color: '#16a34a' }}>
                        <MessageSquare size={24} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.25rem' }}>Notificações WhatsApp</h2>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Configure o envio de alertas automáticos.</p>
                    </div>
                </div>

                <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <input
                            type="checkbox"
                            id="enable"
                            checked={enableNotifications}
                            onChange={(e) => setEnableNotifications(e.target.checked)}
                            style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                        />
                        <label htmlFor="enable" style={{ cursor: 'pointer', fontWeight: 'bold' }}>Ativar Notificações</label>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Número do Gestor (com DDD)</label>
                        <input
                            type="text"
                            className="input"
                            placeholder="Ex: 5514999999999"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            style={{ width: '100%', padding: '0.75rem' }}
                        />
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                            Número que receberá os alertas de atraso.
                        </p>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Chave da API</label>
                        <input
                            type="password"
                            className="input"
                            placeholder="Cole sua chave aqui..."
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            style={{ width: '100%', padding: '0.75rem' }}
                        />
                    </div>

                    {message && (
                        <div style={{ padding: '1rem', backgroundColor: '#f0fdf4', color: '#15803d', borderRadius: '6px', textAlign: 'center' }}>
                            {message}
                        </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                        <button type="submit" className="btn btn-primary">
                            <Save size={18} /> Salvar Alterações
                        </button>
                    </div>
                </form>

            </div>

            {/* Danger Zone */}
            <div className="card" style={{ maxWidth: '600px', marginTop: '2rem', borderColor: 'var(--color-danger)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid #fee2e2', paddingBottom: '1rem' }}>
                    <div style={{ padding: '0.75rem', backgroundColor: '#fee2e2', borderRadius: '50%', color: '#dc2626' }}>
                        <Trash2 size={24} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.25rem', color: '#dc2626' }}>Zona de Perigo</h2>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Ações destrutivas e irreversíveis.</p>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h3 style={{ fontSize: '1rem', fontWeight: 'bold' }}>Limpar Banco de Dados</h3>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', maxWidth: '400px' }}>
                            Exclui TODAS as atividades cadastradas. Use com cautela se importou dados errados.
                        </p>
                    </div>
                    <button
                        onClick={handleDeleteAll}
                        className="btn btn-outline"
                        style={{ borderColor: '#dc2626', color: '#dc2626', fontWeight: 'bold' }}
                    >
                        Excluir Tudo
                    </button>
                </div>
            </div>
        </div >
    );
}
