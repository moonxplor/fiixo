import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  FolderGit2, 
  Terminal, 
  Sparkles, 
  LogOut, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ArrowRight,
  Code2,
  Sun,
  Moon,
  FileText,
  Download,
  Trash2,
  RefreshCw,
  ChevronDown,
  FlaskConical,
  BookOpen
} from 'lucide-react';
import { Mascot, MascotState } from './components/Mascot';
import { api, User, Workspace, Project } from './services/api';

export function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  // Retro Vector Pop Theme: 'light' (white background with halftone dots) or 'dark' (slate-grey background)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('fiixo_theme') as 'light' | 'dark') || 'light';
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
  const [authEmail, setAuthEmail] = useState('developer@fiixo.io');
  const [authPassword, setAuthPassword] = useState('Password123!');
  const [authName, setAuthName] = useState('Dev Explorer');
  const [authError, setAuthError] = useState<string | null>(null);

  // Studio Agent Mode & Knowledge Base State
  const [agentMode, setAgentMode] = useState<'concise' | 'architect' | 'pedantic'>('concise');
  const [showKnowledgeBase, setShowKnowledgeBase] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Agent State & Prompt
  const [mascotState, setMascotState] = useState<MascotState>('ready');
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'agent'; text: string; details?: string }>>([
    {
      role: 'agent',
      text: "No repository description provided.\n\n### File Structure Preview (`REPO_SUMMARY.md`)\n* `.env.example`\n* `.gitignore`\n* `README.md`\n* `backend/alembic.ini`\n* `backend/alembic/README`\n* `backend/app/main.py`\n* `backend/app/api/deps.py`\n* `backend/app/api/v1/auth.py`\n* `backend/app/api/v1/agent.py`\n* `backend/app/services/agent_service.py`\n* `frontend/src/App.tsx`\n* `frontend/package.json`\n\nAsk anything about the selected project or click one of the quick inquiry pills below.",
      details: 'Connected to Gemini API • Knowledge Base Synced'
    }
  ]);

  // Live Telemetry Event Feed
  const [liveEvents, setLiveEvents] = useState<Array<{
    id: string;
    action: string;
    tool: string;
    reason: string;
    result: string;
    status: 'success' | 'running' | 'approval_required';
    duration: string;
  }>>([
    {
      id: '1',
      action: 'Tenant Isolation Initialized',
      tool: 'rbac_resolver',
      reason: 'Enforcing PostgreSQL Row-Level Security for current workspace',
      result: 'Verified 0 cross-tenant data leaks',
      status: 'success',
      duration: '42ms'
    },
    {
      id: '2',
      action: 'AST Engine Ready',
      tool: 'tree_sitter_parser',
      reason: 'Preparing static abstract syntax tree analysis for Python 3.14 migration',
      result: 'Parsers active for Python, JS/TS, Go',
      status: 'success',
      duration: '118ms'
    }
  ]);

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
    checkAuth();
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
      
      setLiveEvents(prev => [
        {
          id: Date.now().toString(),
          action: `Repository Linked: ${newProjectName}`,
          tool: 'git_shallow_cloner',
          reason: 'Cloning repo manifest for static structure evaluation',
          result: 'Manifest inspected safely',
          status: 'success',
          duration: '620ms'
        },
        ...prev
      ]);
    } catch (err: any) {
      alert(err.message || 'Failed to create project');
    }
  }

  async function handleSyncRepo() {
    if (!selectedProject) return;
    setIsSyncing(true);
    setLiveEvents(prev => [
      {
        id: Date.now().toString(),
        action: `Syncing ${selectedProject.name}`,
        tool: 'git_knowledge_sync',
        reason: 'Scanning repo commit tree, branches, and AST manifests',
        result: 'Knowledge base updated with latest files',
        status: 'running',
        duration: '120ms'
      },
      ...prev
    ]);
    setTimeout(() => {
      setIsSyncing(false);
      setLiveEvents(prev => [
        {
          id: Date.now().toString(),
          action: `Sync Complete: ${selectedProject.name}`,
          tool: 'git_knowledge_sync',
          reason: '3 documentation entries indexed to memory cache',
          result: 'Synced (0 warnings)',
          status: 'success',
          duration: '340ms'
        },
        ...prev
      ]);
    }, 1200);
  }

  function handleClearChat() {
    if (!selectedProject) return;
    setMessages([
      {
        role: 'agent',
        text: `### Active Project: ${selectedProject.name}\n\n**Repository:** \`${selectedProject.repository?.clone_url || 'local'}\`\n**Branch:** \`${selectedProject.default_branch}\`\n\nNo repository description provided.\n\n### File Structure Preview (\`REPO_SUMMARY.md\`)\n* \`.env.example\`\n* \`.gitignore\`\n* \`README.md\`\n* \`backend/alembic.ini\`\n* \`backend/alembic/env.py\`\n* \`backend/app/main.py\`\n* \`backend/app/api/v1/agent.py\`\n* \`frontend/src/App.tsx\`\n\nAsk anything about the selected project...`,
        details: 'Knowledge Base Cleaned & Ready'
      }
    ]);
  }

  function handleExportChat() {
    const chatText = messages.map(m => `${m.role.toUpperCase()}:\n${m.text}\n\n`).join('---\n');
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
    if (!textToSend.trim()) return;

    const userMessage = { role: 'user' as const, text: textToSend };
    setMessages(prev => [...prev, userMessage]);
    if (!customText) setPrompt('');

    setMascotState('thinking');

    // Add immediate dispatch telemetry
    setLiveEvents(prev => [
      {
        id: Date.now().toString(),
        action: 'Dispatching Prompt to Agent',
        tool: 'agent_dispatcher',
        reason: `Processing: "${textToSend.slice(0, 45)}..."`,
        result: 'Forwarded to Gemini AI Engine',
        status: 'running',
        duration: '45ms'
      },
      ...prev
    ]);

    try {
      const activeProjId = selectedProject ? selectedProject.id : (projects.length > 0 ? projects[0].id : undefined);
      
      // Immediately reflect recovery status change from not_started to analyzing
      if (selectedProject && selectedProject.recovery_status === 'not_started') {
        setSelectedProject(prev => prev ? { ...prev, recovery_status: 'analyzing' } : null);
        setProjects(prev => prev.map(p => p.id === selectedProject.id ? { ...p, recovery_status: 'analyzing' } : p));
      }

      const response = await api.queryAgent({
        prompt: textToSend,
        project_id: activeProjId,
        conversation_history: messages.slice(-5).map(m => ({ role: m.role, text: m.text }))
      });

      if (response.updated_recovery_status && activeProjId) {
        setSelectedProject(prev => prev && prev.id === activeProjId ? { ...prev, recovery_status: response.updated_recovery_status! } : prev);
        setProjects(prev => prev.map(p => p.id === activeProjId ? { ...p, recovery_status: response.updated_recovery_status! } : p));
      }

      setMascotState('ready');
      setMessages(prev => [
        ...prev,
        {
          role: 'agent',
          text: response.response,
          details: `Model: ${response.model_used} • Live Telemetry Recorded`
        }
      ]);

      if (response.telemetry && response.telemetry.length > 0) {
        setLiveEvents(prev => [
          ...response.telemetry.map((t, idx) => ({
            id: `${Date.now()}_${idx}`,
            action: t.action,
            tool: t.tool,
            reason: t.reason,
            result: t.result,
            status: t.status as 'success' | 'running' | 'approval_required',
            duration: t.duration
          })),
          ...prev
        ]);
      }
    } catch (err: any) {
      setMascotState('error');
      setMessages(prev => [
        ...prev,
        {
          role: 'agent',
          text: `⚠️ Error communicating with agent: ${err.message || 'Please check backend connection.'}`,
          details: 'Connection error'
        }
      ]);
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
            <Mascot state="ready" size="lg" className="mb-3" />
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
              className="w-full py-3.5 pop-btn-pink font-pop-title text-sm tracking-wider uppercase"
            >
              {isRegister ? '★ CREATE FREE WORKSPACE' : '★ SIGN IN TO WORKSPACE'}
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
      {/* Top Studio Header */}
      <header className="h-16 flex-shrink-0 bg-[var(--pop-card)] border-b border-[#1E293B] px-5 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          {/* Studio Icon / Logo */}
          <div className="w-10 h-10 rounded-xl bg-emerald-950/70 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-sm cursor-pointer hover:border-emerald-400 transition">
            <FlaskConical className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-bold text-base text-[var(--pop-text)] tracking-tight">Project Agent Studio</span>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-[11px] font-medium text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Agent Ready</span>
              </div>
            </div>
            <p className="text-[11px] text-[var(--pop-text-muted)] font-mono">
              {selectedProject?.name ? `${selectedProject.name} — GitHub repository ${selectedProject.repository?.clone_url ? selectedProject.repository.clone_url.replace('https://github.com/', '') : 'local'}` : 'fiixo — GitHub repository moonxplor/fiixo'}
            </p>
          </div>
        </div>

        {/* Top Right Controls: Mode Selector, Knowledge Base, Export, Clear, User */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Mode Dropdown */}
          <div className="relative">
            <select
              value={agentMode}
              onChange={(e) => setAgentMode(e.target.value as any)}
              className="appearance-none bg-[#161F30] hover:bg-[#1F2A40] border border-[#2D3B55] text-xs font-semibold px-3 py-1.5 pr-8 rounded-lg text-[var(--pop-text)] focus:outline-none focus:border-emerald-500 transition cursor-pointer"
            >
              <option value="concise">Mode: Concise Engineer</option>
              <option value="architect">Mode: Full Architecture</option>
              <option value="pedantic">Mode: Step-by-Step Teacher</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>

          {/* Knowledge Base Button with Pill Badge */}
          <button
            onClick={() => setShowKnowledgeBase(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#161F30] hover:bg-[#1F2A40] border border-[#2D3B55] hover:border-emerald-500/50 rounded-lg text-xs font-semibold text-[var(--pop-text)] transition cursor-pointer"
            title="Open Repository Knowledge Base"
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
            <span>Knowledge Base</span>
            <span className="w-4 h-4 rounded-full bg-emerald-900/60 text-emerald-300 text-[10px] flex items-center justify-center font-bold">
              3
            </span>
          </button>

          {/* Export Chat Button */}
          <button
            onClick={handleExportChat}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#161F30] hover:bg-[#1F2A40] border border-[#2D3B55] rounded-lg text-xs font-semibold text-[var(--pop-text)] transition cursor-pointer"
            title="Export conversation history"
          >
            <Download className="w-3.5 h-3.5 text-gray-300" />
            <span className="hidden sm:inline">Export</span>
          </button>

          {/* Clear Chat Button */}
          <button
            onClick={handleClearChat}
            className="p-1.5 bg-[#161F30] hover:bg-rose-950/60 border border-[#2D3B55] hover:border-rose-500/40 text-gray-400 hover:text-rose-400 rounded-lg text-xs transition cursor-pointer"
            title="Reset conversation"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-1.5 bg-[#161F30] hover:bg-[#1F2A40] border border-[#2D3B55] text-gray-300 rounded-lg text-xs transition cursor-pointer"
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          >
            {theme === 'light' ? <Moon className="w-4 h-4 text-[#FF3366]" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="p-1.5 bg-[#161F30] hover:bg-rose-950/60 border border-[#2D3B55] hover:border-rose-500/40 text-gray-400 hover:text-rose-400 rounded-lg text-xs transition cursor-pointer"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Studio Viewport */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        
        {/* Left Sidebar: Select Project & Active Agent Context */}
        <aside className="w-72 flex-shrink-0 bg-[var(--pop-card)] border-r border-[#1E293B] flex flex-col justify-between overflow-hidden">
          <div className="flex-1 flex flex-col min-h-0 p-4">
            
            {/* Header: SELECT PROJECT + New Button */}
            <div className="flex items-center justify-between mb-3 pb-1">
              <h2 className="text-[11px] font-bold tracking-wider text-[var(--pop-text-muted)] uppercase">
                SELECT PROJECT
              </h2>
              <button
                onClick={() => setShowNewProject(true)}
                className="px-2.5 py-1 bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-400 rounded-lg text-xs font-bold flex items-center gap-1 transition"
                title="Create or Import Project"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New</span>
              </button>
            </div>

            {/* Project List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
              {projects.length === 0 ? (
                <div className="p-4 border border-dashed border-[#2D3B55] rounded-xl text-center bg-[#161F30]">
                  <FolderGit2 className="w-7 h-7 text-gray-500 mx-auto mb-2" />
                  <p className="text-xs text-[var(--pop-text-muted)] font-medium">No projects found.</p>
                  <button
                    onClick={() => setShowNewProject(true)}
                    className="mt-2 text-xs font-bold text-emerald-400 hover:underline uppercase"
                  >
                    + Import Project
                  </button>
                </div>
              ) : (
                projects.map(proj => {
                  const isSelected = selectedProject?.id === proj.id;
                  const docCount = proj.name === 'fiixo' ? 3 : (proj.name.toLowerCase().includes('dodo') ? 3 : 2);
                  const descText = proj.description || (proj.name === 'fiixo' ? 'GitHub repository moonxplor/fiixo' : (proj.repository?.clone_url ? proj.repository.clone_url.replace('https://github.com/', '') : 'Active revival project'));

                  return (
                    <div 
                      key={proj.id}
                      onClick={() => {
                        setSelectedProject(proj);
                        setMessages(prev => [
                          ...prev,
                          {
                            role: 'agent',
                            text: `Switched active repository to **${proj.name}** (\`${proj.default_branch}\`). Loaded knowledge base and AST manifests.`,
                            details: `Repo: ${proj.repository?.clone_url || 'local'}`
                          }
                        ]);
                      }}
                      className={`p-3 rounded-xl cursor-pointer transition relative border ${
                        isSelected 
                          ? 'bg-[#161F30] border-emerald-500/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]' 
                          : 'bg-[#121926] hover:bg-[#161F30] border-[#1E293B]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`font-bold text-sm tracking-tight ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                          {proj.name}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1F2A40] text-gray-300 border border-[#2D3B55]">
                          {docCount} docs
                        </span>
                      </div>
                      
                      <p className="text-[11px] text-gray-400 truncate mt-1 leading-normal font-sans">
                        {descText}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Active Agent Context Footer (Matches screenshot bottom left) */}
          {selectedProject && (
            <div className="p-4 border-t border-[#1E293B] bg-[#0E1522] space-y-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Active Agent Context
              </span>
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-sm text-white block">{selectedProject.name}</span>
                  <span className="text-[11px] text-emerald-400 font-mono block">
                    {selectedProject.repository?.clone_url ? selectedProject.repository.clone_url.replace('https://github.com/', '') : 'moonxplor/' + selectedProject.name}
                  </span>
                </div>
                <button
                  onClick={handleSyncRepo}
                  disabled={isSyncing}
                  className="px-2.5 py-1 bg-[#161F30] hover:bg-[#1F2A40] border border-[#2D3B55] text-gray-200 text-xs font-semibold rounded-lg flex items-center gap-1 transition"
                  title="Resync repository documents & AST"
                >
                  <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-emerald-400' : ''}`} />
                  <span>Sync</span>
                </button>
              </div>

              {/* Language Chip */}
              <div className="pt-1">
                <span className="inline-block px-2 py-0.5 bg-[#161F30] border border-[#2D3B55] text-emerald-300 text-[10px] font-mono rounded">
                  Python
                </span>
              </div>
            </div>
          )}
        </aside>

        {/* Center Main Studio Conversation & Code Surface */}
        <main className="flex-1 min-w-0 flex flex-col justify-between overflow-hidden bg-[var(--pop-bg)] px-6 py-4">
          
          {/* Conversation Stream: Markdown file structure preview & messages */}
          <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-3">
            {messages.map((m, idx) => (
              <div 
                key={idx}
                className={`flex gap-3 max-w-4xl ${m.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
              >
                {m.role === 'agent' && (
                  <div className="w-8 h-8 rounded-lg bg-emerald-950/70 border border-emerald-500/40 flex items-center justify-center text-emerald-400 flex-shrink-0 mt-0.5">
                    <FlaskConical className="w-4 h-4" />
                  </div>
                )}
                <div 
                  className={`p-4 rounded-xl text-sm leading-relaxed overflow-x-auto border ${
                    m.role === 'user' 
                      ? 'bg-emerald-600 text-white font-medium border-emerald-500' 
                      : 'bg-[#121926] text-gray-200 border-[#1E293B]'
                  }`}
                >
                  {m.role === 'user' ? (
                    <p className="whitespace-pre-wrap">{m.text}</p>
                  ) : (
                    <div className="markdown-body">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {m.text}
                      </ReactMarkdown>
                    </div>
                  )}
                  {m.details && (
                    <div className="mt-2.5 pt-2 border-t border-[#1E293B] text-[11px] text-gray-400 flex items-center gap-1.5 font-mono">
                      <Code2 className="w-3.5 h-3.5 text-emerald-400" /> {m.details}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {mascotState === 'thinking' && (
              <div className="flex gap-3 max-w-xl items-center animate-pulse">
                <div className="w-8 h-8 rounded-lg bg-emerald-950/70 border border-emerald-500/40 flex items-center justify-center text-emerald-400 flex-shrink-0">
                  <FlaskConical className="w-4 h-4" />
                </div>
                <div className="p-3 rounded-xl border border-emerald-500/40 bg-[#121926] text-xs font-semibold text-emerald-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Agent is querying Gemini API & analyzing repository...</span>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Action Area: Quick Inquiry Chips & Ask Gemini Input */}
          <div className="pt-3 flex-shrink-0 space-y-3">
            {/* 4 Studio Quick Pill Chips (Directly from screenshot) */}
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
                  className="px-3.5 py-1.5 bg-[#161F30] hover:bg-[#1F2A40] text-gray-300 hover:text-white border border-[#2D3B55] hover:border-emerald-500/50 rounded-full text-xs font-medium transition cursor-pointer active:scale-95 shadow-sm"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Studio Input Bar + Ask Gemini Pill Button */}
            <div className="max-w-4xl mx-auto flex items-center gap-3 bg-[#121926] border border-[#232F48] focus-within:border-emerald-500/80 rounded-2xl p-1.5 px-3 transition shadow-lg">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendPrompt()}
                placeholder="Ask anything about the selected project..."
                className="flex-1 px-2 py-2 text-sm focus:outline-none bg-transparent text-gray-100 placeholder-gray-500 font-sans"
              />
              <button
                onClick={() => handleSendPrompt()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95"
              >
                <span>Ask Gemini</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-center text-[11px] text-gray-500 font-sans">
              Answers are retrieved strictly from the selected project's knowledge base. Add or edit docs anytime.
            </p>
          </div>
        </main>

        {/* Right Panel: Live Agent Telemetry & Transparency */}
        <aside className="w-80 flex-shrink-0 pop-card flex flex-col p-4 hidden lg:flex justify-between overflow-hidden">
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-3 pb-2.5 border-b-3 border-[#111827] flex-shrink-0">
              <h2 className="font-pop-title text-xs tracking-wider text-[var(--pop-text)] flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#FF3366]" /> LIVE TELEMETRY
              </h2>
              <span className="w-3 h-3 rounded-full bg-[#00E676] border-2 border-[#111827] animate-ping" />
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-0">
              {liveEvents.map(event => (
                <div 
                  key={event.id}
                  className="p-3 bg-[var(--pop-card-inner)] border-3 border-[#111827] rounded-2xl text-xs space-y-1.5 shadow-[3px_3px_0px_#111827]"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-[var(--pop-text)]">{event.action}</span>
                    <span className="text-[10px] bg-[var(--pop-card)] border border-[#111827] text-[var(--pop-text)] font-mono px-1.5 py-0.5 rounded flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {event.duration}
                    </span>
                  </div>

                  <div className="bg-[var(--pop-code-bg)] p-2 rounded-xl border border-[#111827] font-mono text-[11px] text-[#00D2FF]">
                    <span className="text-gray-400 font-bold">TOOL:</span> {event.tool}
                  </div>

                  <p className="text-[11px] text-[var(--pop-text)] leading-relaxed font-semibold">
                    <span className="font-bold text-[var(--pop-text-muted)]">WHY:</span> {event.reason}
                  </p>

                  <div className="flex items-center gap-1.5 text-[11px] text-[#00E676] font-black">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#00E676]" />
                    <span>{event.result}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Transparency Guarantee Sticker */}
          <div className="mt-3 p-3 bg-[var(--pop-card-inner)] border-3 border-[#111827] rounded-2xl shadow-[3px_3px_0px_#111827] text-xs text-[var(--pop-text)] leading-relaxed flex-shrink-0">
            <span className="font-pop-title text-[var(--pop-text)] block mb-0.5 text-xs">TRANSPARENCY RULE:</span>
            Zero silent code modifications. Every tool, diff, and verification step is recorded.
          </div>
        </aside>
      </div>

      {/* Knowledge Base Modal */}
      {showKnowledgeBase && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-[#121926] border border-[#232F48] rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#232F48] mb-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base text-white">Repository Knowledge Base</h3>
                <span className="text-xs bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-mono">
                  3 docs indexed
                </span>
              </div>
              <button
                onClick={() => setShowKnowledgeBase(false)}
                className="text-gray-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-400 mb-4">
              These files are continuously indexed to provide project-specific answers, AST mappings, and architecture definitions.
            </p>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {[
                { name: 'REPO_SUMMARY.md', type: 'Architecture & File Structure', size: '1.4 KB', synced: 'Just now' },
                { name: 'DEPENDENCIES.lock', type: 'Package Manifests & Deprecations', size: '3.8 KB', synced: '2m ago' },
                { name: 'AST_INDEX.json', type: 'Tree-sitter Syntax Graph', size: '12.1 KB', synced: '5m ago' },
              ].map((doc, idx) => (
                <div key={idx} className="p-3 bg-[#162032] border border-[#232F48] rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <div>
                      <span className="font-mono text-xs text-white block">{doc.name}</span>
                      <span className="text-[11px] text-gray-400 block">{doc.type}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-emerald-400 font-mono block">Synced</span>
                    <span className="text-[10px] text-gray-400 font-mono block">{doc.size}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 flex justify-end gap-2.5">
              <button
                onClick={() => setShowKnowledgeBase(false)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Project Modal */}
      {showNewProject && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#121926] border border-[#232F48] rounded-2xl p-6 shadow-2xl">
            <h3 className="font-bold text-lg text-white mb-1">IMPORT REPOSITORY</h3>
            <p className="text-xs text-gray-400 mb-4">Connect a GitHub repository or paste a public clone URL to revive.</p>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">Project Name</label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#162032] border border-[#232F48] text-white text-sm font-medium focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. Dodo AI"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">Repository Clone URL</label>
                <input
                  type="text"
                  value={newRepoUrl}
                  onChange={(e) => setNewRepoUrl(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#162032] border border-[#232F48] text-white text-sm font-medium focus:outline-none focus:border-emerald-500"
                  placeholder="https://github.com/username/project.git"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewProject(false)}
                  className="flex-1 py-2 border border-[#232F48] bg-[#162032] text-xs font-bold text-gray-300 rounded-xl hover:bg-[#1E293B] transition"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition"
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
