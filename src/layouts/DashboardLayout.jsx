
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard, Kanban, Briefcase, Users, FileBarChart, LogOut, Menu, X, Settings, Shield, BookOpen } from 'lucide-react';
import { useState, useEffect } from 'react';
import LogoZilor from '../assets/LogoZilor.png';

export default function DashboardLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Check if mobile logic needed ? Actually CSS handles it, but default state might differ.
    // Let's stick to true (desktop) or false (mobile) initially? 
    // Ideally we'd use a media query hook, but for simplicity let's default to closed on very small screens if we could detect, 
    // or just let the user toggle. 
    // Better UX: Start closed on Mobile, Open on Desktop.

    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);

    useEffect(() => {
        // Auto-close sidebar on route change if on mobile
        if (window.innerWidth <= 768) {
            setSidebarOpen(false);
        }
    }, [location]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
        { to: '/kanban', label: 'Kanban', icon: <Kanban size={20} /> },
        { to: '/activities', label: 'Atividades', icon: <Briefcase size={20} /> },
        { to: '/team', label: 'Equipes', icon: <Users size={20} /> },
        { to: '/reports', label: 'Relatórios', icon: <FileBarChart size={20} /> },
        { to: '/users', label: 'Usuários', icon: <Shield size={20} /> },
        { to: '/manual', label: 'Manual', icon: <BookOpen size={20} /> },
        { to: '/settings', label: 'Configurações', icon: <Settings size={20} /> },
    ];

    return (
        <div className="app-container">
            {/* Mobile Overlay */}
            {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

            {/* Sidebar */}
            <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'} `}>
                <div style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #333', minHeight: '80px' }}>

                    {/* Logo Logic: Show if open, or if mobile open. If closed desktop, show small or hide? */}
                    {/* We'll use CSS to help or just conditional rendering. */}

                    {(sidebarOpen || window.innerWidth <= 768) ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <img src={LogoZilor} alt="Zilor" style={{ maxHeight: '40px', maxWidth: '100%', objectFit: 'contain', alignSelf: 'flex-start' }} />
                                <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px', whiteSpace: 'nowrap' }}>Unidade Usina São José</span>
                            </div>
                            {/* Close button for mobile inside sidebar */}
                            <button
                                onClick={() => setSidebarOpen(false)}
                                style={{ background: 'none', border: 'none', color: 'white', display: window.innerWidth <= 768 ? 'block' : 'none', marginLeft: 'auto' }}
                            >
                                <X size={24} />
                            </button>
                        </div>
                    ) : (
                        /* Closed state desktop: Show small part of logo or icon? Or nothing? User asked to replace text with logo. 
                           If I just put the img with max-width 100%, it might look tiny but acceptable. */
                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            {/* Assuming the logo is legible small, or we crop it. For now, just scale it. */}
                            <img src={LogoZilor} alt="Zilor" style={{ maxWidth: '40px', height: 'auto' }} />
                        </div>
                    )}
                </div>

                <nav style={{ flex: 1, padding: '1rem' }}>
                    <ul style={{ listStyle: 'none' }}>
                        {navItems.map(item => (
                            <li key={item.to} style={{ marginBottom: '0.5rem' }}>
                                <NavLink
                                    to={item.to}
                                    style={({ isActive }) => ({
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem',
                                        padding: '0.75rem',
                                        borderRadius: '4px',
                                        backgroundColor: isActive ? 'var(--color-primary)' : 'transparent',
                                        color: isActive ? 'white' : '#cbd5e1',
                                        justifyContent: (sidebarOpen || window.innerWidth <= 768) ? 'flex-start' : 'center'
                                    })}
                                >
                                    {item.icon}
                                    {(sidebarOpen || window.innerWidth <= 768) && <span>{item.label}</span>}
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </nav>
            </aside>

            {/* Main Content */}
            <div className="main-content">
                <header className="header">
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'none', border: 'none' }}>
                        <Menu />
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ textAlign: 'right', display: window.innerWidth > 400 ? 'block' : 'none' }}>
                            <p style={{ fontWeight: 'bold' }}>{user?.name}</p>
                            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{user?.role}</p>
                        </div>
                        <button onClick={handleLogout} className="btn btn-outline" style={{ border: 'none' }}>
                            <LogOut size={20} />
                        </button>
                    </div>
                </header>

                <main className="content-area">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
