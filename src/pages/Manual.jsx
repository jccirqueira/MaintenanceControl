import { BookOpen } from 'lucide-react';

export default function Manual() {
    return (
        <div style={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ padding: '0.75rem', backgroundColor: '#e0f2fe', borderRadius: '50%', color: '#0284c7' }}>
                    <BookOpen size={24} />
                </div>
                <h1 style={{ margin: 0 }}>Manual do Usuário</h1>
            </div>

            <div className="card" style={{ flex: 1, overflowY: 'auto', padding: '2rem', lineHeight: '1.6' }}>

                <h2 style={{ color: 'var(--color-primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', marginTop: 0 }}>
                    1. Acesso (Login)
                </h2>
                <p>Ao abrir o sistema, você verá a tela de login.</p>
                <ul>
                    <li><strong>Usuário:</strong> Digite seu e-mail corporativo ou nome de usuário cadastrado.</li>
                    <li><strong>Senha:</strong> Insira sua senha de acesso.</li>
                    <li><strong>Entrar:</strong> Clique no botão azul para acessar.</li>
                </ul>
                <p><em>Nota: Caso não tenha acesso ou tenha esquecido sua senha, contate o Administrador do sistema.</em></p>

                <br />

                <h2 style={{ color: 'var(--color-primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                    2. Dashboard (Visão Geral)
                </h2>
                <p>Esta é a tela inicial que resume a saúde da manutenção industrial.</p>

                <h3>Painel de Indicadores (KPIs)</h3>
                <p>No topo, você vê cartões coloridos com números em tempo real:</p>
                <ul>
                    <li><strong>Total de Atividades:</strong> Quantidade geral de tarefas cadastradas.</li>
                    <li><strong>Atrasadas:</strong> Tarefas que já passaram da data prevista e ainda não foram concluídas. (Cartão Vermelho = Atenção!)</li>
                    <li><strong>Em Andamento (D+0):</strong> Atividades iniciadas que estão dentro do prazo de hoje.</li>
                    <li><strong>Concluídas:</strong> Total de atividades já finalizadas com sucesso.</li>
                </ul>

                <h3>Filtros Globais</h3>
                <p>Logo abaixo do título, você encontra controles para refinar o que vê:</p>
                <ul>
                    <li><strong>Filtro de Equipe/Membro:</strong> Permite ver dados gerais da planta ou focar em uma equipe específica (Ex: Elétrica) ou até em um único mecânico.</li>
                    <li><strong>Filtro de Áreas:</strong> Uma lista suspensa ("Dropdown") onde você seleciona a Área Industrial (Ex: "EXTRAÇÃO DO CALDO", "MOENDA"). Ao selecionar, <strong>todos</strong> os gráficos e números da tela mudam para mostrar apenas aquela área.</li>
                </ul>

                <br />

                <h2 style={{ color: 'var(--color-primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                    3. Kanban (Gestão Visual de Serviços)
                </h2>
                <p>Acesse pelo menu lateral "Kanban". Aqui as tarefas são cartões visuais.</p>

                <h3>O Quadro</h3>
                <p>As atividades são organizadas em colunas que representam o <strong>fluxo de trabalho</strong>:</p>
                <ol>
                    <li><strong>Pendente:</strong> A tarefa foi criada mas ainda não começou.</li>
                    <li><strong>Em Execução:</strong> A equipe já está trabalhando nela.</li>
                    <li><strong>Aguardando Materiais:</strong> O serviço parou pois falta peça ou ferramenta.</li>
                    <li><strong>Pausada:</strong> Interrompida por outros motivos.</li>
                    <li><strong>Concluída:</strong> Serviço finalizado.</li>
                </ol>

                <h3>Como usar</h3>
                <ul>
                    <li><strong>Mover Cartões:</strong> Clique em um cartão, segure e arraste-o para outra coluna. Ex: Arraste de "Pendente" para "Em Execução" quando começar o trabalho. O sistema atualiza o status automaticamente.</li>
                    <li><strong>Filtros:</strong> Assim como no Dashboard, você pode filtrar por <strong>Área</strong> aqui. Se selecionar "CALDEIRAS", o quadro limpa e traz apenas cartões daquela área.</li>
                </ul>

                <br />

                <h2 style={{ color: 'var(--color-primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                    4. Atividades (Lista Detalhada)
                </h2>
                <h3>Funcionalidades Principais</h3>
                <ul>
                    <li><strong>Botão "Importar (Excel)":</strong> Localizado no rodapé (botão verde). Clique aqui para selecionar uma planilha do Excel de seu computador. O sistema vai ler os dados e carregar na tabela.</li>
                    <li><strong>Busca e Filtros:</strong> Pesquise por código OS, nome ou responsável. Use os filtros de Status e Área para refinar.</li>
                </ul>

                <h3>Criando/Editando Manualmente</h3>
                <ul>
                    <li><strong>Nova Atividade (Admin):</strong> Clique no botão "+ Nova Atividade" para criar tarefas manualmente.</li>
                    <li><strong>Editar:</strong> Clique no ícone de lápis em qualquer linha para alterar datas, responsáveis ou status.</li>
                </ul>

                <br />

                <h2 style={{ color: 'var(--color-primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                    5. Usuários (Gestão de Acesso)
                </h2>
                <p><em>Apenas Administradores têm acesso total a esta tela.</em></p>
                <p>Aqui você cadastra quem pode acessar o sistema e quem executa as tarefas.</p>
                <ul>
                    <li><strong>Listagem:</strong> Vê nome, cargo, foto e nível de acesso de todos.</li>
                    <li><strong>Novo Usuário:</strong> Cadastre novos colaboradores definindo nome, login (email), senha provisória, cargo, equipe e nível de acesso (Admin ou Usuário).</li>
                    <li><strong>Foto:</strong> Você pode carregar uma foto de perfil para cada usuário para facilitar a identificação.</li>
                </ul>

                <br />

                <h2 style={{ color: 'var(--color-primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                    6. Relatórios
                </h2>
                <p>Para quando você precisa enviar dados para a gerência ou imprimir.</p>
                <ul>
                    <li><strong>Visualização:</strong> Escolha ver dados "Por Equipe" ou "Por Membro".</li>
                    <li><strong>Exportar CSV/XLS:</strong> Gere planilhas formatadas para impressão ou análise externa.</li>
                </ul>

                <br />

                <h2 style={{ color: 'var(--color-primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                    7. Configurações
                </h2>
                <ul>
                    <li><strong>Notificações WhatsApp:</strong> Configure o número do gestor para receber alertas de atrasos.</li>
                    <li><strong>Zona de Perigo:</strong> Ferramentas administrativas para limpar o banco de dados (Cuidado!).</li>
                </ul>

                <hr style={{ margin: '3rem 0', borderColor: '#e2e8f0' }} />

                <p><strong>Dúvidas?</strong><br />
                    Entre em contato com o suporte técnico ou o administrador do sistema.</p>

                <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f0fdf4', borderRadius: '8px', display: 'inline-block', border: '1px solid #bbf7d0' }}>
                    <strong style={{ color: '#166534' }}>Cacir Soluções Tecnológicas</strong> 🟢 016 997932877
                </div>

            </div>
        </div>
    );
}
