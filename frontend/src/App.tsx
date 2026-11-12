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
  ArrowRight
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
      text: "Hey! I'm Fiixo, your AI developer. Have an old project you want to bring back to life? Paste a GitHub URL or let's explore it together.",
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
      
      // Update Agent
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

    // Simulate Agent ReAct transparency step
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
      <div className="min-h-screen bg-[#F8F5FF] flex flex-col items-center justify-center p-6">
        <Mascot state="thinking" size="lg" />
        <p className="mt-4 text-[#7955F5] font-display font-semibold animate-pulse">Initializing Fiixo Workspace...</p>
      </div>
    );
  }

  // Not Logged In -> Show Auth Screen
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#F8F5FF] flex flex-col items-center justify-center p-6 selection:bg-[#FF579A] selection:text-white">
        <div className="w-full max-w-md bg-white border-2 border-[#241A35] rounded-3xl p-8 shadow-[8px_8px_0px_#241A35]">
          <div className="flex flex-col items-center text-center mb-6">
            <Mascot state="ready" size="lg" className="mb-3" />
            <h1 className="text-3xl font-display font-bold text-[#241A35]">Fiixo</h1>
            <p className="text-sm text-gray-600 mt-1">Your AI Developer Companion</p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F8F5FF] border border-[#7955F5] rounded-full text-xs font-medium text-[#7955F5] mt-3">
              <Sparkles className="w-3.5 h-3.5" /> Understand. Explain. Repair. Teach.
            </div>
          </div>

          {authError && (
            <div className="mb-4 p-3 bg-red-50 border-2 border-red-500 rounded-xl text-xs font-semibold text-red-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {authError}
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#241A35] mb-1">Full Name</label>
                <input
                  type="text"
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-[#241A35] focus:outline-none focus:ring-2 focus:ring-[#7955F5] text-sm"
                  placeholder="Ada Lovelace"
                  required
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#241A35] mb-1">Email Address</label>
              <input
                type="email"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-[#241A35] focus:outline-none focus:ring-2 focus:ring-[#7955F5] text-sm"
                placeholder="dev@company.com"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#241A35] mb-1">Password</label>
              <input
                type="password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-[#241A35] focus:outline-none focus:ring-2 focus:ring-[#7955F5] text-sm"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#7955F5] hover:bg-[#6843e8] text-white font-display font-bold rounded-xl border-2 border-[#241A35] shadow-[4px_4px_0px_#241A35] transition-transform active:translate-x-1 active:translate-y-1"
            >
              {isRegister ? 'Create Free Workspace' : 'Sign In to Workspace'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => { setIsRegister(!isRegister); setAuthError(null); }}
              className="text-xs font-semibold text-[#7955F5] hover:underline"
            >
              {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Register now"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Logged In -> Main SaaS Workspace
  return (
    <div className="min-h-screen bg-[#F8F5FF] flex flex-col text-[#241A35]">
      {/* Top Header */}
      <header className="h-16 bg-white border-b-2 border-[#241A35] px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <Mascot state={mascotState} size="sm" />
            <span className="font-display font-bold text-xl tracking-tight text-[#241A35]">FIIXO</span>
          </div>

          <div className="h-6 w-px bg-gray-200" />

          {/* Workspace Switcher */}
          {activeWorkspace && (
            <div className="flex items-center gap-2 px-3 py-1 bg-[#F8F5FF] border border-[#241A35] rounded-xl text-xs font-medium">
              <Layers className="w-3.5 h-3.5 text-[#7955F5]" />
              <select 
                value={activeWorkspace.id} 
                onChange={(e) => {
                  const selected = workspaces.find(w => w.id === e.target.value);
                  if (selected) {
                    setActiveWorkspace(selected);
                    loadProjects(selected.id);
                  }
                }}
                className="bg-transparent font-semibold focus:outline-none cursor-pointer"
              >
                {workspaces.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
              <span className="px-1.5 py-0.5 bg-[#FFD65A] text-[#241A35] rounded-md font-bold uppercase text-[10px]">
                {activeWorkspace.role || 'owner'}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* GitHub Connection Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#F8F5FF] border border-[#241A35] rounded-xl text-xs font-medium hover:bg-gray-50 transition cursor-pointer">
            <svg className="w-4 h-4 fill-current text-[#241A35]" viewBox="0 0 24 24">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            <span className="hidden sm:inline">GitHub: Connected</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          {/* User profile & Logout */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-gray-700 hidden sm:inline">
              {currentUser.full_name || currentUser.email}
            </span>
            <button
              onClick={handleLogout}
              className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main 3-Panel Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Projects & Navigation */}
        <aside className="w-72 bg-white border-r-2 border-[#241A35] flex flex-col p-4 hidden md:flex">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-600 flex items-center gap-1.5">
              <FolderGit2 className="w-4 h-4 text-[#7955F5]" /> Repositories ({projects.length})
            </h2>
            <button
              onClick={() => setShowNewProject(true)}
              className="p-1 bg-[#7955F5] text-white rounded-lg hover:bg-[#6843e8] transition"
              title="Import Repository"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {projects.length === 0 ? (
              <div className="p-4 border-2 border-dashed border-gray-300 rounded-2xl text-center">
                <FolderGit2 className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-xs text-gray-500 font-medium">No projects imported yet.</p>
                <button
                  onClick={() => setShowNewProject(true)}
                  className="mt-3 text-xs font-bold text-[#7955F5] hover:underline"
                >
                  + Import First Repository
                </button>
              </div>
            ) : (
              projects.map(proj => (
                <div 
                  key={proj.id}
                  className="p-3 bg-[#F8F5FF] hover:bg-[#F0EAFF] border border-[#241A35] rounded-xl cursor-pointer transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[#241A35] truncate">{proj.name}</span>
                    <span className="text-[10px] bg-white border border-gray-300 px-1.5 py-0.5 rounded text-gray-600 font-mono">
                      {proj.default_branch}
                    </span>
                  </div>
                  {proj.repository && (
                    <p className="text-[11px] text-gray-500 truncate mt-1 font-mono">
                      {proj.repository.clone_url}
                    </p>
                  )}
                  <div className="flex items-center gap-1 mt-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span className="text-[10px] text-gray-600 capitalize">{proj.recovery_status.replace('_', ' ')}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Bottom Security Badge */}
          <div className="pt-4 border-t border-gray-200 mt-2 flex items-center gap-2 text-[11px] text-gray-500 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Zero-trust isolated workspace</span>
          </div>
        </aside>

        {/* Center Panel: Interactive AI Agent Workspace */}
        <main className="flex-1 flex flex-col bg-[#F8F5FF] overflow-hidden">
          {/* Conversation Stream */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((m, idx) => (
              <div 
                key={idx}
                className={`flex gap-3 max-w-2xl ${m.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
              >
                {m.role === 'agent' && <Mascot state={mascotState} size="sm" className="flex-shrink-0 mt-1" />}
                <div 
                  className={`p-4 rounded-2xl border-2 border-[#241A35] text-sm ${
                    m.role === 'user' 
                      ? 'bg-[#7955F5] text-white shadow-[4px_4px_0px_#241A35]' 
                      : 'bg-white text-[#241A35] shadow-[4px_4px_0px_#241A35]'
                  }`}
                >
                  <p className="leading-relaxed font-medium">{m.text}</p>
                  {m.details && (
                    <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-500 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#FF579A]" /> {m.details}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Quick Action Suggestion Chips */}
          <div className="px-6 py-2 flex flex-wrap gap-2">
            {[
              "Restore broken dependencies",
              "Trace application entry points",
              "Scan security & deprecated APIs"
            ].map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSendPrompt(chip)}
                className="px-3 py-1 bg-white hover:bg-[#F0EAFF] border border-[#241A35] rounded-full text-xs font-semibold text-[#241A35] shadow-[2px_2px_0px_#241A35] transition active:translate-x-0.5 active:translate-y-0.5 flex items-center gap-1.5"
              >
                <Sparkles className="w-3 h-3 text-[#FF579A]" /> {chip}
              </button>
            ))}
          </div>

          {/* Bottom Conversational Prompt Bar */}
          <div className="p-6 pt-2 bg-[#F8F5FF]">
            <div className="bg-white border-2 border-[#241A35] rounded-2xl p-2 shadow-[6px_6px_0px_#241A35] flex items-center gap-3">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendPrompt()}
                placeholder="Ask Fiixo to explore, explain, repair or modernize your code..."
                className="flex-1 px-3 py-2 text-sm focus:outline-none bg-transparent"
              />
              <button
                onClick={() => handleSendPrompt()}
                className="px-5 py-2.5 bg-[#7955F5] hover:bg-[#6843e8] text-white font-display font-bold text-xs rounded-xl border border-[#241A35] shadow-[2px_2px_0px_#241A35] transition flex items-center gap-1.5"
              >
                <span>Instruct</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </main>

        {/* Right Panel: Live Agent Transparency & Telemetry */}
        <aside className="w-80 bg-white border-l-2 border-[#241A35] flex flex-col p-4 hidden lg:flex">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-600 flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-[#FF579A]" /> Live Agent Operations
            </h2>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {liveEvents.map(event => (
              <div 
                key={event.id}
                className="p-3 bg-[#F8F5FF] border border-[#241A35] rounded-xl text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#241A35]">{event.action}</span>
                  <span className="text-[10px] text-gray-500 font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {event.duration}
                  </span>
                </div>

                <div className="bg-white p-2 rounded-lg border border-gray-200 font-mono text-[11px] text-gray-700">
                  <span className="text-[#7955F5] font-bold">Tool:</span> {event.tool}
                </div>

                <p className="text-[11px] text-gray-600 leading-relaxed">
                  <span className="font-semibold text-gray-800">Why:</span> {event.reason}
                </p>

                <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{event.result}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Transparency Guarantee Note */}
          <div className="mt-4 p-3 bg-[#FFF9E6] border border-[#FFD65A] rounded-xl text-[11px] text-[#241A35] leading-relaxed">
            <span className="font-bold">Transparency Pledge:</span> Nothing meaningful happens silently. Every tool, diff, and verification step is recorded.
          </div>
        </aside>
      </div>

      {/* New Project Modal */}
      {showNewProject && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border-2 border-[#241A35] rounded-3xl p-6 shadow-[8px_8px_0px_#241A35]">
            <h3 className="text-xl font-display font-bold text-[#241A35] mb-1">Import Repository</h3>
            <p className="text-xs text-gray-600 mb-4">Connect a GitHub repository or paste a public clone URL to revive.</p>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#241A35] mb-1">Project Name</label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border-2 border-[#241A35] text-sm focus:outline-none focus:ring-2 focus:ring-[#7955F5]"
                  placeholder="e.g. my-legacy-api"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#241A35] mb-1">Repository Clone URL</label>
                <input
                  type="text"
                  value={newRepoUrl}
                  onChange={(e) => setNewRepoUrl(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border-2 border-[#241A35] text-sm focus:outline-none focus:ring-2 focus:ring-[#7955F5]"
                  placeholder="https://github.com/username/project.git"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewProject(false)}
                  className="flex-1 py-2.5 border-2 border-[#241A35] text-xs font-bold rounded-xl hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#7955F5] hover:bg-[#6843e8] text-white border-2 border-[#241A35] text-xs font-bold rounded-xl shadow-[2px_2px_0px_#241A35] transition"
                >
                  Import Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
