import { useState } from 'react';
import { Key, Sparkles, Terminal, Bot, Plug } from 'lucide-react';
import KeyList from '@/components/KeyList';
import SkillsManager from '@/components/SkillsManager';
import CommandsManager from '@/components/CommandsManager';
import DroidsManager from '@/components/DroidsManager';
import McpManager from '@/components/McpManager';
import { cn } from '@/lib/utils';

type Tab = 'keys' | 'commands' | 'skills' | 'droids' | 'mcp';

const tabs: { id: Tab; label: string; icon: typeof Key }[] = [
  { id: 'keys', label: 'Keys', icon: Key },
  { id: 'commands', label: 'Commands', icon: Terminal },
  { id: 'skills', label: 'Skills', icon: Sparkles },
  { id: 'droids', label: 'Sub Agents', icon: Bot },
  { id: 'mcp', label: 'MCP', icon: Plug },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('keys');

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <nav className="mb-6 border-b">
          <div className="flex gap-1">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors relative",
                  "hover:text-foreground",
                  activeTab === id
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
                {activeTab === id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
                )}
              </button>
            ))}
          </div>
        </nav>

        {activeTab === 'keys' && <KeyList />}
        {activeTab === 'commands' && <CommandsManager />}
        {activeTab === 'skills' && <SkillsManager />}
        {activeTab === 'droids' && <DroidsManager />}
        {activeTab === 'mcp' && <McpManager />}
      </div>
    </div>
  );
}
