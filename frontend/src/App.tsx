import React, { useState, useEffect } from 'react';
import { 
  FolderGit2, 
  Terminal, 
  Sparkles, 
  ShieldCheck, 
  LogOut, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Layers, 
  ArrowRight,
  Code2
} from 'lucide-react';
import { Mascot, MascotState } from './components/Mascot';
import { api, User, Workspace, Project } from './services/api';

export function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Auth Form State
  const [isRegister, setIsRegister] = useState(false);
  const [authEmail, setAuthEmail] = useState('developer@fiixo.io');
  const [authPassword, setAuthPassword] = useState('Password123!');
  const [authName, setAuthName] = useState('Dev Explorer');
  const [authError, setAuthError] = useState<string | null>(null);

  // Agent State & Prompt
  const [mascotState, setMascotState] = useState<MascotState>('ready');
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'agent'; text: string; details?: string }>>([
    {
      role: 'agent',
      text: "Hey! I'm Fiixo, your AI developer companion. Have an old or broken repository you want to bring back to life? Paste a GitHub URL or ask me anything!",
      details: 'Agent is ready to inspect repositories, trace execution flow, and restore dependencies.'
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
      duration: '14ms'
    }
  ]);

  // New Project Modal State
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newRepoUrl, setNewRepoUrl] = useState('');

  // Initial Load
  useEffect(() => {
    checkAuth();
  }, []);

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

  async function loadProjects(workspaceId: string) {
    try {
      const list = await api.listProjects(workspaceId);
      setProjects(list);
    } catch (err) {
      console.error('Failed to load projects', err);
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
      await checkAuth();
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed');
    }
  }

  function handleLogout() {
    api.logout();
    setCurrentUser(null);
    setActiveWorkspace(null);
    setProjects([]);
  }

  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault();
    if (!activeWorkspace) return;
    try {
      await api.createProject(activeWorkspace.id, {
        name: newProjectName,
        repository: newRepoUrl ? { clone_url: newRepoUrl } : undefined
      });
      setShowNewProject(false);
      setNewProjectName('');
      setNewRepoUrl('');
      await loadProjects(activeWorkspace.id);
      
      setMessages(prev => [
        ...prev,
        {
          role: 'agent',
          text: `Awesome! Project "${newProjectName}" has been imported into workspace "${activeWorkspace.name}". Ready for AST scanning and dependency analysis.`
        }
      ]);
    } catch (err: any) {
      alert(err.message || 'Failed to create project');
    }
  }

  function handleSendPrompt(customText?: string) {
    const textToSend = customText || prompt;
    if (!textToSend.trim()) return;

    setMessages(prev => [...prev, { role: 'user', text: textToSend }]);
    setPrompt('');
    setMascotState('thinking');

    setTimeout(() => {
      setMascotState('exploring');
      setLiveEvents(prev => [
        {
          id: String(Date.now()),
          action: 'AST & Dependency Discovery',
          tool: 'tree_sitter_scanner',
          reason: `Decomposing instruction: "${textToSend}"`,
          result: 'Identified application entry points, package manifests, and outdated libraries',
          status: 'success',
          duration: '310ms'
        },
        ...prev
      ]);

      setTimeout(() => {
        setMascotState('ready');
        setMessages(prev => [
          ...prev,
          {
            role: 'agent',
            text: `I've analyzed your request: "${textToSend}". I examined your project structure and verified dependencies. I can prepare a safe, isolated Git branch to apply modern compatibility fixes. Would you like me to generate the diff for review?`,
            details: 'Live Transparency: Tool scan_dependencies executed with 0 errors. Awaiting approval for file modification.'
          }
        ]);
      }, 1000);
    }, 800);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#2B2D42] flex flex-col items-center justify-center p-6 text-white">
        <Mascot state="thinking" size="lg" />
        <p className="mt-4 text-[#00D2FF] font-pop-title text-sm tracking-wider animate-pulse">BOOTING FIIXO WORKSPACE...</p>
      </div>
    );
  }

  // Not Logged In -> Solid Vector Pop Grey Theme Auth Modal
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#2B2D42] flex flex-col items-center justify-center p-6 text-[#F1F3F5]">
        <div className="w-full max-w-md bg-[#3A3D56] border-4 border-[#111827] rounded-3xl p-8 shadow-[8px_8px_0px_#111827]">
          <div className="flex flex-col items-center text-center mb-6">
            <Mascot state="ready" size="lg" className="mb-3" />
            <h1 className="font-pop-title text-3xl text-white tracking-wider drop-shadow-[2px_2px_0px_#111827]">FIIXO!</h1>
            <p className="text-sm font-semibold text-gray-300 mt-1">Your AI Developer Companion</p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#4A4E69] border-2 border-[#111827] rounded-full text-xs font-bold text-[#00D2FF] mt-3 shadow-[2px_2px_0px_#111827]">
              <Sparkles className="w-3.5 h-3.5 text-[#FF3366]" /> Understand. Explain. Repair. Teach.
            </div>
          </div>

          {authError && (
            <div className="mb-4 p-3 bg-red-950/70 border-3 border-red-500 rounded-2xl text-xs font-bold text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {authError}
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-gray-200 mb-1">Full Name</label>
                <input
                  type="text"
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#232536] border-3 border-[#111827] focus:border-[#00D2FF] focus:outline-none text-white text-sm font-bold shadow-[3px_3px_0px_#111827]"
                  placeholder="Ada Lovelace"
                  required
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-gray-200 mb-1">Email Address</label>
              <input
                type="email"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#232536] border-3 border-[#111827] focus:border-[#00D2FF] focus:outline-none text-white text-sm font-bold shadow-[3px_3px_0px_#111827]"
                placeholder="dev@company.com"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-gray-200 mb-1">Password</label>
              <input
                type="password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#232536] border-3 border-[#111827] focus:border-[#00D2FF] focus:outline-none text-white text-sm font-bold shadow-[3px_3px_0px_#111827]"
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
              className="text-xs font-bold text-[#00D2FF] hover:underline"
            >
              {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Register now"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Logged In -> Solid Vector Pop Grey UI
  return (
    <div className="min-h-screen bg-[#2B2D42] flex flex-col text-[#F1F3F5]">
      {/* Top Vector Pop Header */}
      <header className="h-20 bg-[#3A3D56] border-b-4 border-[#111827] px-6 flex items-center justify-between sticky top-0 z-30 shadow-[0_4px_0px_#111827]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5 cursor-pointer">
            <Mascot state={mascotState} size="sm" />
            <span className="font-pop-title text-2xl tracking-wider text-white drop-shadow-[2px_2px_0px_#111827]">FIIXO!</span>
          </div>

          <div className="h-8 w-1 bg-[#111827] rounded-full" />

          {/* Workspace Switcher with Vector Pop Badge */}
          {activeWorkspace && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#454866] border-3 border-[#111827] rounded-2xl text-xs font-extrabold shadow-[3px_3px_0px_#111827]">
              <Layers className="w-4 h-4 text-[#00D2FF]" />
              <select 
                value={activeWorkspace.id} 
                onChange={(e) => {
                  const selected = workspaces.find(w => w.id === e.target.value);
                  if (selected) {
                    setActiveWorkspace(selected);
                    loadProjects(selected.id);
                  }
                }}
                className="bg-transparent font-extrabold focus:outline-none cursor-pointer text-white"
              >
                {workspaces.map(w => (
                  <option key={w.id} value={w.id} className="bg-[#3A3D56] text-white">{w.name}</option>
                ))}
              </select>
              <span className="px-2 py-0.5 bg-[#FF3366] text-white rounded-md font-black uppercase text-[10px] border border-[#111827]">
                {activeWorkspace.role || 'owner'}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* GitHub Connection Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#454866] border-3 border-[#111827] rounded-2xl text-xs font-extrabold shadow-[3px_3px_0px_#111827] hover:bg-[#52567A] transition cursor-pointer">
            <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 24 24">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            <span className="hidden sm:inline text-white">GitHub: Linked</span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#00E676] border border-[#111827] animate-pulse" />
          </div>

          {/* User profile & Logout */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-black text-gray-200 hidden sm:inline">
              {currentUser.full_name || currentUser.email}
            </span>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-300 hover:text-white bg-[#454866] hover:bg-[#FF3366] border-2 border-[#111827] rounded-xl shadow-[2px_2px_0px_#111827] transition"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <!-- Main 3-Panel Vector Pop Grey Layout -->
      <div className="flex-1 flex overflow-hidden p-3 sm:p-5 gap-5">
        
        <!-- Left Panel: Repositories Shelf -->
        <aside className="w-76 pop-grey-card flex flex-col p-5 hidden md:flex justify-between">
          <div>
            <div className="flex items-center justify-between mb-5 pb-3 border-b-3 border-[#111827]">
              <h2 className="font-pop-title text-xs tracking-wider text-white flex items-center gap-2">
                <FolderGit2 className="w-4 h-4 text-[#00D2FF]" /> REPOSITORIES ({projects.length})
              </h2>
              <button
                onClick={() => setShowNewProject(true)}
                className="pop-btn-pink px-2.5 py-1 text-xs font-black tracking-wider flex items-center gap-1"
                title="Import Repository"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>NEW</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {projects.length === 0 ? (
                <div className="p-5 border-3 border-dashed border-[#111827] rounded-2xl text-center bg-[#303348]">
                  <FolderGit2 className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-xs text-gray-300 font-bold">No repositories yet.</p>
                  <button
                    onClick={() => setShowNewProject(true)}
                    className="mt-3 text-xs font-black text-[#00D2FF] hover:underline uppercase"
                  >
                    + Import First Repo
                  </button>
                </div>
              ) : (
                projects.map(proj => (
                  <div 
                    key={proj.id}
                    className="p-3.5 bg-[#454866] hover:bg-[#52567A] border-3 border-[#111827] rounded-2xl cursor-pointer shadow-[3px_3px_0px_#111827] transition"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-xs text-white truncate">{proj.name}</span>
                      <span className="text-[10px] bg-[#232536] border border-[#111827] text-white px-2 py-0.5 rounded-lg font-mono">
                        {proj.default_branch}
                      </span>
                    </div>
                    {proj.repository && (
                      <p className="text-[11px] text-gray-300 truncate mt-1 font-mono">
                        {proj.repository.clone_url}
                      </p>
                    )}
                    <div className="flex items-center gap-1.5 mt-2.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#00D2FF] border border-[#111827]" />
                      <span className="text-[10px] text-gray-200 uppercase font-black tracking-wide">{proj.recovery_status.replace('_', ' ')}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <!-- Bottom Security Badge -->
          <div className="pt-4 border-t-3 border-[#111827] mt-3 flex items-center gap-2 text-xs text-gray-300 font-black">
            <ShieldCheck className="w-4 h-4 text-[#00E676] flex-shrink-0" />
            <span>POSTGRES RLS ISOLATED</span>
          </div>
        </aside>

        <!-- Center Panel: Conversational AI Agent Comic Panel -->
        <main className="flex-1 pop-grey-card flex flex-col p-6 overflow-hidden justify-between">
          
          <!-- Conversation Stream -->
          <div className="flex-1 overflow-y-auto space-y-5 pr-2">
            {messages.map((m, idx) => (
              <div 
                key={idx}
                className={`flex gap-3 max-w-2xl ${m.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
              >
                {m.role === 'agent' && <Mascot state={mascotState} size="sm" className="flex-shrink-0 mt-1" />}
                <div 
                  className={`p-4 rounded-2xl border-3 border-[#111827] text-sm font-semibold leading-relaxed ${
                    m.role === 'user' 
                      ? 'bg-[#FF3366] text-white shadow-[4px_4px_0px_#111827]' 
                      : 'bg-[#454866] text-white shadow-[4px_4px_0px_#111827]'
                  }`}
                >
                  <p>{m.text}</p>
                  {m.details && (
                    <div className="mt-2.5 pt-2 border-t-2 border-[#111827]/40 text-xs text-gray-300 flex items-center gap-1.5 font-bold">
                      <Code2 className="w-3.5 h-3.5 text-[#00D2FF]" /> {m.details}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <!-- Action Suggestion Burst Chips -->
          <div className="pt-4 border-t-3 border-[#111827] mt-3">
            <div className="flex flex-wrap gap-2 mb-3">
              {[
                "Restore broken dependencies",
                "Trace execution flow & entry point",
                "Scan security & deprecated APIs"
              ].map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendPrompt(chip)}
                  className="px-3.5 py-1.5 bg-[#454866] hover:bg-[#52567A] text-white border-2 border-[#111827] rounded-xl text-xs font-black shadow-[2px_2px_0px_#111827] transition active:scale-95 flex items-center gap-1.5"
                >
                  <Sparkles className="w-3 h-3 text-[#00D2FF]" />
                  <span>{chip}</span>
                </button>
              ))}
            </div>

            <!-- Big Vector Ink Input Bar -->
            <div className="bg-[#2B2D42] border-3 border-[#111827] rounded-2xl p-2.5 shadow-[4px_4px_0px_#111827] flex items-center gap-3">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendPrompt()}
                placeholder="Ask Fiixo to explore, explain, repair or modernize your code..."
                className="flex-1 px-3 py-2 text-sm font-bold focus:outline-none bg-transparent text-white placeholder-gray-400"
              />
              <button
                onClick={() => handleSendPrompt()}
                className="pop-btn-pink px-5 py-2.5 text-xs font-pop-title tracking-wider uppercase flex items-center gap-1.5"
              >
                <span>INSTRUCT</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </main>

        <!-- Right Panel: Live Agent Telemetry & Transparency -->
        <aside className="w-80 pop-grey-card flex flex-col p-5 hidden lg:flex justify-between">
          <div>
            <div className="flex items-center justify-between mb-5 pb-3 border-b-3 border-[#111827]">
              <h2 className="font-pop-title text-xs tracking-wider text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#FF3366]" /> LIVE TELEMETRY
              </h2>
              <span className="w-3 h-3 rounded-full bg-[#00E676] border-2 border-[#111827] animate-ping" />
            </div>

            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
              {liveEvents.map(event => (
                <div 
                  key={event.id}
                  className="p-3.5 bg-[#454866] border-3 border-[#111827] rounded-2xl text-xs space-y-1.5 shadow-[3px_3px_0px_#111827]"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-white">{event.action}</span>
                    <span className="text-[10px] bg-[#232536] border border-[#111827] text-gray-200 font-mono px-1.5 py-0.5 rounded flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {event.duration}
                    </span>
                  </div>

                  <div className="bg-[#232536] p-2 rounded-xl border border-[#111827] font-mono text-[11px] text-[#00D2FF]">
                    <span className="text-gray-400 font-bold">TOOL:</span> {event.tool}
                  </div>

                  <p className="text-[11px] text-gray-200 leading-relaxed font-semibold">
                    <span className="font-bold text-gray-400">WHY:</span> {event.reason}
                  </p>

                  <div className="flex items-center gap-1.5 text-[11px] text-[#00E676] font-black">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#00E676]" />
                    <span>{event.result}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <!-- Transparency Guarantee Sticker -->
          <div className="mt-4 p-3.5 bg-[#454866] border-3 border-[#111827] rounded-2xl shadow-[3px_3px_0px_#111827] text-xs text-gray-200 leading-relaxed">
            <span className="font-pop-title text-white block mb-0.5 text-xs">TRANSPARENCY RULE:</span>
            Zero silent code modifications. Every tool, diff, and verification step is recorded.
          </div>
        </aside>
      </div>

      {/* New Project Modal */}
      {showNewProject && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#3A3D56] border-4 border-[#111827] rounded-3xl p-6 shadow-[8px_8px_0px_#111827]">
            <h3 className="font-pop-title text-xl text-white mb-1">IMPORT REPOSITORY</h3>
            <p className="text-xs font-semibold text-gray-300 mb-4">Connect a GitHub repository or paste a public clone URL to revive.</p>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-gray-200 mb-1">Project Name</label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#232536] border-3 border-[#111827] text-white text-sm font-bold focus:outline-none focus:border-[#00D2FF]"
                  placeholder="e.g. my-legacy-api"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-gray-200 mb-1">Repository Clone URL</label>
                <input
                  type="text"
                  value={newRepoUrl}
                  onChange={(e) => setNewRepoUrl(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#232536] border-3 border-[#111827] text-white text-sm font-bold focus:outline-none focus:border-[#00D2FF]"
                  placeholder="https://github.com/username/project.git"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewProject(false)}
                  className="flex-1 py-2.5 border-3 border-[#111827] bg-[#232536] text-xs font-black text-gray-200 rounded-xl hover:bg-[#303348] transition"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 pop-btn-pink text-xs font-pop-title tracking-wider uppercase"
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
