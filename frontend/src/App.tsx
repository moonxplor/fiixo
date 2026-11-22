import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  FolderGit2, 
  LogOut, 
  Plus, 
  ArrowRight,
  Sun,
  Moon,
  FileText,
  Download,
  Trash2,
  RefreshCw,
  ChevronDown,
  FlaskConical,
  BookOpen,
  Sparkles,
  AlertCircle,
  MessageSquare
} from 'lucide-react';
import { Mascot, MascotState } from './components/Mascot';
import { FiixoLogo } from './components/FiixoLogo';
import { api, User, Workspace, Project } from './services/api';

export function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  // Project Agent Studio Theme: default 'dark'
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('fiixo_theme') as 'light' | 'dark') || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('fiixo_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };
  
  // Auth Form State
  const [isRegister, setIsRegister] = useState(false);
  const [authEmail, setAuthEmail] = useState('sahasnigdha654@gmail.com');
  const [authPassword, setAuthPassword] = useState('Password123!');
  const [authName, setAuthName] = useState('moonxplor');
  const [authError, setAuthError] = useState<string | null>(null);

  // Studio Agent Mode & Knowledge Base State
  const [agentMode, setAgentMode] = useState<'concise' | 'architect' | 'pedantic'>('concise');
  const [showKnowledgeBase, setShowKnowledgeBase] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Agent State & Prompt
  const [mascotState, setMascotState] = useState<MascotState>('ready');
  const [prompt, setPrompt] = useState('');
  
  // Per-project isolated conversations (stored in memory & localStorage)
  const defaultFiixoWelcome: Array<{ role: 'user' | 'agent'; text: string; details?: string }> = [
    {
      role: 'agent',
      text: `### Active Repository: \`moonxplor/fiixo\`
* \`README.md\` — Architecture & system specification
* \`backend/app/main.py\` — FastAPI backend entry point
* \`backend/app/services/agent_service.py\` — Code intelligence reasoning agent
* \`backend/app/api/v1/agent.py\` — Repository inquiry & conversation engine
* \`backend/app/api/v1/auth.py\` — Authentication & session controller
* \`frontend/src/App.tsx\` — Studio dashboard & repository interface

Ask a technical question, or select a quick inquiry below.`
    }
  ];

  const [projectChats, setProjectChats] = useState<Record<string, Array<{ role: 'user' | 'agent'; text: string; details?: string }>>>(() => {
    try {
      const saved = localStorage.getItem('fiixo_repo_chats');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Save repo chats to localStorage on changes
  useEffect(() => {
    try {
      localStorage.setItem('fiixo_repo_chats', JSON.stringify(projectChats));
    } catch (e) {
      console.error('Failed to save project chats to localStorage', e);
    }
  }, [projectChats]);

  // Current active repository messages
  const currentMessages = (selectedProject && projectChats[selectedProject.id]) || (selectedProject?.name === 'fiixo' ? defaultFiixoWelcome : [
    {
      role: 'agent' as const,
      text: `### Active Project: **${selectedProject?.name || 'Selected Repository'}**\n* Repository: \`${selectedProject?.repository?.clone_url || 'local'}\`\n* Branch: \`${selectedProject?.default_branch || 'main'}\`\n* Language: \`${selectedProject?.primary_language || 'Auto-detect'}\`\n\nAsk a technical question, or select a quick inquiry below.`
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom('smooth');
  }, [currentMessages, mascotState, selectedProject?.id]);


  // Project Creation Modal State
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newRepoUrl, setNewRepoUrl] = useState('');

  // Check login on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const user = await api.getMe();
        setCurrentUser(user);
        const wsList = await api.listWorkspaces();
        setWorkspaces(wsList);
        if (wsList.length > 0) {
          setActiveWorkspace(wsList[0]);
          loadProjects(wsList[0].id);
        }
      } catch {
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    }

    const onAuthExpired = () => {
      setCurrentUser(null);
    };
    window.addEventListener('fiixo:auth:expired', onAuthExpired);

    checkAuth();

    return () => {
      window.removeEventListener('fiixo:auth:expired', onAuthExpired);
    };
  }, []);

  async function loadProjects(workspaceId: string) {
    try {
      const projs = await api.listProjects(workspaceId);
      setProjects(projs);
      if (projs.length > 0 && !selectedProject) {
        setSelectedProject(projs[0]);
      }
    } catch {
      setProjects([]);
      setSelectedProject(null);
    }
  }

  async function handleAuthSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAuthError(null);
    try {
      if (isRegister) {
        await api.register({
          email: authEmail,
          password: authPassword,
          full_name: authName
        });
      } else {
        await api.login({
          email: authEmail,
          password: authPassword
        });
      }
      const user = await api.getMe();
      setCurrentUser(user);
      const wsList = await api.listWorkspaces();
      setWorkspaces(wsList);
      if (wsList.length > 0) {
        setActiveWorkspace(wsList[0]);
        loadProjects(wsList[0].id);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed');
    }
  }

  function handleLogout() {
    api.logout();
    setCurrentUser(null);
    setWorkspaces([]);
    setActiveWorkspace(null);
    setProjects([]);
  }

  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault();
    if (!activeWorkspace) return;
    try {
      const proj = await api.createProject(activeWorkspace.id, {
        name: newProjectName,
        repository: newRepoUrl ? { clone_url: newRepoUrl } : undefined
      });
      setProjects(prev => [...prev, proj]);
      setShowNewProject(false);
      setNewProjectName('');
      setNewRepoUrl('');
    } catch (err: any) {
      alert(err.message || 'Failed to create project');
    }
  }

  async function handleSyncRepo() {
    if (!selectedProject) return;
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
    }, 1200);
  }

  function handleClearChat() {
    if (!selectedProject) return;
    const freshChat = [
      {
        role: 'agent' as const,
        text: `### Active Project: **${selectedProject.name}**\n\n**Repository:** \`${selectedProject.repository?.clone_url || 'local'}\`\n**Branch:** \`${selectedProject.default_branch}\`\n**Language:** \`${selectedProject.primary_language || 'Auto-detect'}\`\n\nChat session cleared for **${selectedProject.name}**. Ask anything about this repository...`
      }
    ];
    setProjectChats(prev => ({
      ...prev,
      [selectedProject.id]: freshChat
    }));
  }

  function handleExportChat() {
    const chatText = currentMessages.map(m => `${m.role.toUpperCase()}:\n${m.text}\n\n`).join('---\n');
    const blob = new Blob([chatText], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedProject?.name || 'fiixo'}-conversation.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleSendPrompt(customText?: string) {
    const textToSend = customText || prompt;
    if (!textToSend.trim() || !selectedProject) return;

    const userMessage = { role: 'user' as const, text: textToSend };
    const updatedMessages = [...currentMessages, userMessage];

    // Optimistically update the selected project's chat
    setProjectChats(prev => ({
      ...prev,
      [selectedProject.id]: updatedMessages
    }));

    if (!customText) setPrompt('');
    setMascotState('thinking');

    try {
      const activeProjId = selectedProject.id;
      
      // Immediately reflect recovery status change from not_started to analyzing
      if (selectedProject.recovery_status === 'not_started') {
        setSelectedProject(prev => prev ? { ...prev, recovery_status: 'analyzing' } : null);
        setProjects(prev => prev.map(p => p.id === selectedProject.id ? { ...p, recovery_status: 'analyzing' } : p));
      }

      const response = await api.queryAgent({
        prompt: textToSend,
        project_id: activeProjId,
        conversation_history: updatedMessages.slice(-5).map(m => ({ role: m.role, text: m.text }))
      });

      if (response.updated_recovery_status && activeProjId) {
        setSelectedProject(prev => prev && prev.id === activeProjId ? { ...prev, recovery_status: response.updated_recovery_status! } : prev);
        setProjects(prev => prev.map(p => p.id === activeProjId ? { ...p, recovery_status: response.updated_recovery_status! } : p));
      }

      setMascotState('ready');
      setProjectChats(prev => ({
        ...prev,
        [activeProjId]: [
          ...(prev[activeProjId] || updatedMessages),
          {
            role: 'agent',
            text: response.response
          }
        ]
      }));
    } catch (err: any) {
      setMascotState('error');
      setProjectChats(prev => ({
        ...prev,
        [selectedProject.id]: [
          ...(prev[selectedProject.id] || updatedMessages),
          {
            role: 'agent',
            text: `[Error] Unable to communicate with agent: ${err.message || 'Please check backend connection.'}`
          }
        ]
      }));
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-[var(--pop-text)]">
        <Mascot state="thinking" size="lg" />
        <p className="mt-4 text-[#FF3366] font-pop-title text-sm tracking-wider animate-pulse">BOOTING FIIXO WORKSPACE...</p>
      </div>
    );
  }

  // Not Logged In -> Solid Vector Pop Retro Auth Modal
  if (!currentUser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-[var(--pop-text)] relative">
        {/* Top-Right Theme Toggle */}
        <div className="absolute top-6 right-6">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 px-3.5 py-2 bg-[var(--pop-card)] border-3 border-[#111827] rounded-2xl shadow-[4px_4px_0px_#111827] font-black text-xs hover:scale-105 active:scale-95 transition"
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          >
            {theme === 'light' ? (
              <>
                <Moon className="w-4 h-4 text-[#7C4DFF]" />
                <span className="hidden sm:inline">DARK MODE</span>
              </>
            ) : (
              <>
                <Sun className="w-4 h-4 text-[#00D2FF]" />
                <span className="hidden sm:inline">LIGHT MODE</span>
              </>
            )}
          </button>
        </div>

        <div className="w-full max-w-md pop-card p-8">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="p-3 bg-[#2D2254] border-3 border-black rounded shadow-[4px_4px_0px_#000] mb-3">
              <FiixoLogo size={90} />
            </div>
            <h1 className="font-pop-title text-3xl tracking-wider text-[var(--pop-text)] drop-shadow-[2px_2px_0px_#111827]">FIIXO!</h1>
            <p className="text-sm font-semibold text-[var(--pop-text-muted)] mt-1">Your AI Developer Companion</p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[var(--pop-card-inner)] border-2 border-[#111827] rounded-full text-xs font-bold text-[#FF3366] mt-3 shadow-[2px_2px_0px_#111827]">
              <Sparkles className="w-3.5 h-3.5 text-[#00D2FF]" /> Understand. Explain. Repair. Teach.
            </div>
          </div>

          {authError && (
            <div className="mb-4 p-3 bg-red-500/10 border-3 border-red-500 rounded-2xl text-xs font-bold text-red-600 dark:text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {authError}
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-[var(--pop-text)] mb-1">Full Name</label>
                <input
                  type="text"
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[var(--pop-input-bg)] border-3 border-[#111827] focus:border-[#FF3366] focus:outline-none text-[var(--pop-text)] text-sm font-bold shadow-[3px_3px_0px_#111827]"
                  placeholder="Ada Lovelace"
                  required
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-[var(--pop-text)] mb-1">Email Address</label>
              <input
                type="email"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--pop-input-bg)] border-3 border-[#111827] focus:border-[#FF3366] focus:outline-none text-[var(--pop-text)] text-sm font-bold shadow-[3px_3px_0px_#111827]"
                placeholder="dev@company.com"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-[var(--pop-text)] mb-1">Password</label>
              <input
                type="password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--pop-input-bg)] border-3 border-[#111827] focus:border-[#FF3366] focus:outline-none text-[var(--pop-text)] text-sm font-bold shadow-[3px_3px_0px_#111827]"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 pop-btn-pink font-pixel text-xs tracking-wider uppercase"
            >
              {isRegister ? 'CREATE FREE WORKSPACE' : 'SIGN IN TO WORKSPACE'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => { setIsRegister(!isRegister); setAuthError(null); }}
              className="text-xs font-bold text-[#FF3366] hover:underline"
            >
              {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Register now"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Logged In -> Project Agent Studio / Vector Pop UI
  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col text-[var(--pop-text)] bg-[var(--pop-bg)] font-sans">
      {/* Top Pixel Studio Header */}
      <header className="h-16 flex-shrink-0 bg-[var(--pop-card)] border-b-2 border-black px-5 flex items-center justify-between sticky top-0 z-30 shadow-[0_2px_0_#000]">
        <div className="flex items-center gap-3">
          {/* High-Res Pixel Pop FX Logo */}
          <div className="h-10 px-1.5 rounded bg-[#2D2254] border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_#000] cursor-pointer hover:translate-x-0.5 hover:translate-y-0.5 transition">
            <FiixoLogo size={48} className="drop-shadow-sm" />
          </div>

          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-pixel text-sm text-[var(--pop-text)] tracking-wider">FIIXO</span>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-950/80 border border-[#00FF66] text-[10px] font-mono text-[#00FF66]">
                <span className="w-1.5 h-1.5 rounded-none bg-[#00FF66] animate-pulse" />
                <span>AGENT READY</span>
              </div>
            </div>
            <p className="text-[11px] text-[var(--pop-text-muted)] font-mono">
              {selectedProject?.name ? `${selectedProject.name} — GitHub repository ${selectedProject.repository?.clone_url ? selectedProject.repository.clone_url.replace('https://github.com/', '') : 'local'}` : 'fiixo — GitHub repository moonxplor/fiixo'}
            </p>
          </div>
        </div>

        {/* Top Right Controls: Mode Selector, Knowledge Base, Export, Clear, User */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mode Dropdown */}
          <div className="relative">
            <select
              value={agentMode}
              onChange={(e) => setAgentMode(e.target.value as any)}
              className="appearance-none bg-[var(--pop-btn-bg)] hover:bg-[var(--pop-btn-hover)] border-2 border-black text-xs font-semibold px-3 py-1.5 pr-8 rounded text-[var(--pop-text)] shadow-[2px_2px_0px_#000] focus:outline-none cursor-pointer"
            >
              <option value="concise">Mode: Concise Engineer</option>
              <option value="architect">Mode: Full Architecture</option>
              <option value="pedantic">Mode: Step-by-Step Teacher</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[var(--pop-text-muted)] absolute right-2.5 top-2.5 pointer-events-none" />
          </div>

          {/* Knowledge Base Button with Pill Badge */}
          <button
            onClick={() => setShowKnowledgeBase(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-[var(--pop-btn-bg)] hover:bg-[var(--pop-btn-hover)] border-2 border-black rounded text-xs font-semibold text-[var(--pop-text)] shadow-[2px_2px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 transition cursor-pointer"
            title="Open Repository Knowledge Base"
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-500" />
            <span>Knowledge Base</span>
            <span className="w-4 h-4 rounded bg-[#00FF66] text-black text-[10px] flex items-center justify-center font-bold font-mono">
              3
            </span>
          </button>

          {/* Export Chat Button */}
          <button
            onClick={handleExportChat}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--pop-btn-bg)] hover:bg-[var(--pop-btn-hover)] border-2 border-black rounded text-xs font-semibold text-[var(--pop-text)] shadow-[2px_2px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 transition cursor-pointer"
            title="Export conversation history"
          >
            <Download className="w-3.5 h-3.5 text-[var(--pop-text-muted)]" />
            <span className="hidden sm:inline">Export</span>
          </button>

          {/* Clear Chat Button */}
          <button
            onClick={handleClearChat}
            className="p-1.5 bg-[var(--pop-btn-bg)] hover:bg-rose-100 dark:hover:bg-rose-950/60 border-2 border-black hover:border-rose-500 text-[var(--pop-text-muted)] hover:text-rose-500 rounded text-xs shadow-[2px_2px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 transition cursor-pointer"
            title="Reset conversation"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-1.5 bg-[var(--pop-btn-bg)] hover:bg-[var(--pop-btn-hover)] border-2 border-black text-[var(--pop-text)] rounded text-xs shadow-[2px_2px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 transition cursor-pointer"
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          >
            {theme === 'light' ? <Moon className="w-4 h-4 text-[#FF0055]" /> : <Sun className="w-4 h-4 text-[#FFE600]" />}
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="p-1.5 bg-[var(--pop-btn-bg)] hover:bg-rose-100 dark:hover:bg-rose-950/60 border-2 border-black hover:border-rose-500 text-[var(--pop-text-muted)] hover:text-rose-500 rounded text-xs shadow-[2px_2px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 transition cursor-pointer"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Studio Viewport */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        
        {/* Left Sidebar: Select Project & Active Agent Context */}
        <aside className="w-72 flex-shrink-0 bg-[var(--pop-card)] border-r-2 border-black flex flex-col justify-between overflow-hidden shadow-[2px_0_0_#000]">
          <div className="flex-1 flex flex-col min-h-0 p-4">
            
            {/* Header: SELECT PROJECT + New Button */}
            <div className="flex items-center justify-between mb-3 pb-1">
              <h2 className="text-[10px] font-pixel tracking-wider text-[var(--pop-text-muted)] uppercase">
                SELECT PROJECT
              </h2>
              <button
                onClick={() => setShowNewProject(true)}
                className="px-2.5 py-1 bg-[#00FF66] hover:bg-emerald-400 border-2 border-black text-black rounded text-xs font-bold flex items-center gap-1 shadow-[2px_2px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 transition"
                title="Create or Import Project"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New</span>
              </button>
            </div>

            {/* Project List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
              {projects.length === 0 ? (
                <div className="p-4 border-2 border-dashed border-black rounded text-center bg-[var(--pop-card-inner)]">
                  <FolderGit2 className="w-7 h-7 text-[var(--pop-text-muted)] mx-auto mb-2" />
                  <p className="text-xs text-[var(--pop-text-muted)] font-medium">No projects found.</p>
                  <button
                    onClick={() => setShowNewProject(true)}
                    className="mt-2 text-xs font-bold text-emerald-600 dark:text-[#00FF66] hover:underline uppercase"
                  >
                    + Import Project
                  </button>
                </div>
              ) : (
                projects.map(proj => {
                  const isSelected = selectedProject?.id === proj.id;
                  const docCount = 3;
                  const descText = proj.description || (proj.repository?.clone_url ? proj.repository.clone_url.replace('https://github.com/', '') : 'Active repository');

                  return (
                    <div 
                      key={proj.id}
                      onClick={() => {
                        setSelectedProject(proj);
                      }}
                      className={`p-3 rounded cursor-pointer transition relative border-2 ${
                        isSelected 
                          ? 'pop-collage-selected' 
                          : 'bg-[var(--pop-card-inner)] hover:bg-[var(--pop-card-alt)] border-black shadow-[2px_2px_0px_#000]'
                      }`}
                    >
                      {/* Pop Collage decorative corner tape when selected */}
                      {isSelected && (
                        <div className="absolute -top-1.5 -right-2 px-2 py-0.5 bg-[#FFE600] text-black text-[9px] font-pixel border border-black shadow-[1px_1px_0px_#000] rotate-6 z-10">
                          ACTIVE
                        </div>
                      )}

                      <div className="flex items-center justify-between relative z-1">
                        <span className={`font-bold text-sm tracking-tight flex items-center gap-1.5 ${isSelected ? 'text-[var(--pop-text)]' : 'text-[var(--pop-text)]'}`}>
                          <MessageSquare className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-500' : 'text-[var(--pop-text-muted)]'}`} />
                          {proj.name}
                        </span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border border-black ${isSelected ? 'bg-[#FFE600] text-black font-bold' : 'bg-[var(--pop-card)] text-[var(--pop-text-muted)]'}`}>
                          {docCount} docs
                        </span>
                      </div>
                      
                      <p className={`text-[11px] truncate mt-1 leading-normal font-sans relative z-1 ${isSelected ? 'text-[var(--pop-text)] font-medium' : 'text-[var(--pop-text-muted)]'}`}>
                        {descText}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Active Agent Context Footer with Pop Collage Effect */}
          {selectedProject && (
            <div className="p-4 pop-collage-context space-y-2">
              <div className="flex items-center justify-between">
                <span className="pop-sticker-tape px-2 py-0.5 text-[9px] font-pixel uppercase tracking-wider">
                  ACTIVE CONTEXT
                </span>
                <span className="text-[9px] font-mono font-bold bg-[#FF0055] text-white px-1.5 py-0.5 border border-black shadow-[1px_1px_0px_#000] rotate-1">
                  SYNCED
                </span>
              </div>
              <div className="flex items-center justify-between relative z-1">
                <div>
                  <span className="font-bold text-sm text-[var(--pop-text)] block">{selectedProject.name}</span>
                  <span className="text-[11px] text-emerald-600 dark:text-[#00FF66] font-mono block font-semibold">
                    {selectedProject.repository?.clone_url ? selectedProject.repository.clone_url.replace('https://github.com/', '') : 'moonxplor/' + selectedProject.name}
                  </span>
                </div>
                <button
                  onClick={handleSyncRepo}
                  disabled={isSyncing}
                  className="px-2.5 py-1 bg-[var(--pop-btn-bg)] hover:bg-[var(--pop-btn-hover)] border-2 border-black text-[var(--pop-text)] text-xs font-semibold rounded flex items-center gap-1 shadow-[2px_2px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 transition"
                  title="Resync repository documents"
                >
                  <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-emerald-500' : ''}`} />
                  <span>Sync</span>
                </button>
              </div>

              {/* Language Chip & Branch Stamp */}
              <div className="pt-1 flex items-center gap-2 relative z-1">
                <span className="inline-block px-2 py-0.5 bg-[var(--pop-card)] border border-black text-emerald-600 dark:text-[#00FF66] text-[10px] font-mono font-bold rounded shadow-[1px_1px_0px_#000]">
                  {selectedProject.primary_language || 'Python'}
                </span>
                <span className="inline-block px-2 py-0.5 bg-[#00F0FF] text-black border border-black text-[10px] font-mono font-bold rounded shadow-[1px_1px_0px_#000] -rotate-1">
                  branch: {selectedProject.default_branch || 'main'}
                </span>
              </div>
            </div>
          )}
        </aside>

        {/* Center Main Studio Conversation & Code Surface */}
        <main className="flex-1 min-w-0 flex flex-col justify-between overflow-hidden bg-[var(--pop-bg)] px-8 py-4">
          
          {/* Conversation Stream: Clean Markdown file structure preview & messages */}
          <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-2">
            {currentMessages.map((m, idx) => (
              <div 
                key={idx}
                className={`max-w-4xl ${m.role === 'user' ? 'ml-auto flex justify-end' : ''}`}
              >
                {m.role === 'user' ? (
                  <div className="p-3.5 px-4 rounded bg-[#FF0055] text-white font-medium text-sm max-w-xl border-2 border-black shadow-[3px_3px_0px_#000]">
                    <p className="whitespace-pre-wrap">{m.text}</p>
                  </div>
                ) : (
                  <div className="text-[var(--pop-text)] text-sm leading-relaxed">
                    <div className="markdown-body">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {m.text}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {mascotState === 'thinking' && (
              <div className="flex gap-3 max-w-xl items-center animate-pulse pt-2">
                <div className="w-8 h-8 rounded bg-[#00FF66] border-2 border-black flex items-center justify-center text-black flex-shrink-0 shadow-[2px_2px_0px_#000]">
                  <FlaskConical className="w-4 h-4" />
                </div>
                <div className="p-2.5 px-3 rounded border-2 border-black bg-[var(--pop-card)] text-xs font-semibold text-emerald-600 dark:text-[#00FF66] flex items-center gap-2 shadow-[2px_2px_0px_#000]">
                  <span className="w-2 h-2 rounded-none bg-[#00FF66] animate-ping" />
                  <span>Analyzing repository and preparing response...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Action Area: Quick Inquiry Chips & Ask Agent Input */}
          <div className="pt-3 flex-shrink-0 space-y-3">
            {/* 4 Studio Quick Pill Chips in Pixel Pop Style */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              {[
                "Summarize this repository",
                "What is the file structure and tech stack?",
                "How do I set up and run this project?",
                "List key dependencies or entry points"
              ].map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendPrompt(chip)}
                  className="px-3.5 py-1.5 bg-[var(--pop-chip-bg)] hover:bg-[var(--pop-chip-hover)] text-[var(--pop-chip-text)] border-2 border-black hover:border-emerald-500 rounded text-xs font-medium shadow-[2px_2px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 transition cursor-pointer active:scale-95"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Studio Input Bar + Ask Agent Button */}
            <div className="max-w-4xl mx-auto flex items-center gap-3 bg-[var(--pop-input-bg)] border-2 border-black focus-within:border-emerald-500 rounded p-1.5 px-3 transition shadow-[4px_4px_0px_#000]">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendPrompt()}
                placeholder="Ask anything about the selected project..."
                className="flex-1 px-2 py-2 text-sm focus:outline-none bg-transparent text-[var(--pop-input-text)] placeholder-[var(--pop-input-placeholder)] font-sans"
              />
              <button
                onClick={() => handleSendPrompt()}
                className="px-4 py-2 bg-[#00FF66] hover:bg-emerald-400 text-black text-xs font-bold font-pixel tracking-wider rounded border-2 border-black shadow-[2px_2px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 transition flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <span>SEND</span>
                <ArrowRight className="w-3.5 h-3.5 text-black" />
              </button>
            </div>

            <p className="text-center text-[11px] text-[var(--pop-text-muted)] font-sans">
              Answers are retrieved strictly from the selected project's knowledge base. Add or edit docs anytime.
            </p>
          </div>
        </main>
      </div>


      {/* Knowledge Base Modal */}
      {showKnowledgeBase && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-[var(--pop-card)] border-3 border-black rounded p-6 shadow-[6px_6px_0px_#000]">
            <div className="flex items-center justify-between pb-3 border-b-2 border-black mb-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-500" />
                <h3 className="font-bold text-base text-[var(--pop-text)] font-sans">Repository Knowledge Base</h3>
                <span className="text-xs bg-[var(--pop-card-alt)] text-[var(--pop-text)] border border-black px-2 py-0.5 rounded font-mono">
                  3 docs indexed
                </span>
              </div>
              <button
                onClick={() => setShowKnowledgeBase(false)}
                className="text-[var(--pop-text-muted)] hover:text-[var(--pop-text)] p-1 text-sm font-bold font-mono border border-black rounded px-2 hover:bg-[var(--pop-card-alt)] transition cursor-pointer"
              >
                X
              </button>
            </div>

            <p className="text-xs text-[var(--pop-text-muted)] mb-4 font-sans">
              These files are continuously indexed to provide project-specific answers, AST mappings, and architecture definitions.
            </p>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {[
                { name: 'REPO_SUMMARY.md', type: 'Architecture & File Structure', size: '1.4 KB', synced: 'Just now' },
                { name: 'DEPENDENCIES.lock', type: 'Package Manifests & Deprecations', size: '3.8 KB', synced: '2m ago' },
                { name: 'AST_INDEX.json', type: 'Tree-sitter Syntax Graph', size: '12.1 KB', synced: '5m ago' },
              ].map((doc, idx) => (
                <div key={idx} className="p-3 bg-[var(--pop-card-inner)] border-2 border-black rounded flex items-center justify-between shadow-[2px_2px_0px_#000]">
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <div>
                      <span className="font-mono text-xs text-[var(--pop-text)] font-bold block">{doc.name}</span>
                      <span className="text-[11px] text-[var(--pop-text-muted)] block">{doc.type}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-emerald-600 dark:text-[#00FF66] font-mono font-bold block">Synced</span>
                    <span className="text-[10px] text-[var(--pop-text-muted)] font-mono block">{doc.size}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 flex justify-end gap-2.5">
              <button
                onClick={() => setShowKnowledgeBase(false)}
                className="px-4 py-2 bg-[#00FF66] hover:bg-emerald-400 text-black border-2 border-black rounded text-xs font-bold font-pixel tracking-wider shadow-[2px_2px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 transition cursor-pointer"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Project Modal */}
      {showNewProject && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[var(--pop-card)] border-3 border-black rounded p-6 shadow-[6px_6px_0px_#000]">
            <h3 className="font-pixel text-sm text-[var(--pop-text)] mb-1 tracking-wider">IMPORT REPOSITORY</h3>
            <p className="text-xs text-[var(--pop-text-muted)] mb-4 font-sans">Connect a GitHub repository or paste a public clone URL to revive.</p>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--pop-text)] mb-1">Project Name</label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded bg-[var(--pop-input-bg)] border-2 border-black text-[var(--pop-input-text)] text-sm font-medium focus:outline-none focus:border-emerald-500 shadow-[2px_2px_0px_#000]"
                  placeholder="e.g. Dodo AI"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--pop-text)] mb-1">Repository Clone URL</label>
                <input
                  type="text"
                  value={newRepoUrl}
                  onChange={(e) => setNewRepoUrl(e.target.value)}
                  className="w-full px-3.5 py-2 rounded bg-[var(--pop-input-bg)] border-2 border-black text-[var(--pop-input-text)] text-sm font-medium focus:outline-none focus:border-emerald-500 shadow-[2px_2px_0px_#000]"
                  placeholder="https://github.com/username/project.git"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewProject(false)}
                  className="flex-1 py-2 border-2 border-black bg-[var(--pop-card-alt)] text-xs font-bold text-[var(--pop-text)] rounded shadow-[2px_2px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 transition"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-[#00FF66] hover:bg-emerald-400 text-black text-xs font-bold font-pixel tracking-wider border-2 border-black rounded shadow-[2px_2px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 transition"
                >
                  IMPORT REPO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
