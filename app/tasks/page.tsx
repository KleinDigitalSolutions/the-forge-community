'use client';

import { useEffect, useState } from 'react';
import PageShell from '@/app/components/PageShell';
import AuthGuard from '@/app/components/AuthGuard';
import { CheckSquare, Circle, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

interface Task {
  id: string;
  task: string;
  description: string;
  assignedTo: string;
  status: 'To Do' | 'In Progress' | 'Done';
  priority: 'High' | 'Medium' | 'Low';
  dueDate: string;
  category: 'Legal' | 'WMS' | 'Marketing' | 'Operations';
}

const statusIcons = {
  'To Do': Circle,
  'In Progress': Clock,
  'Done': CheckCircle2,
};

const statusColors = {
  'To Do': 'bg-zinc-100 text-zinc-600',
  'In Progress': 'bg-blue-50 text-blue-600',
  'Done': 'bg-green-50 text-green-600',
};

const priorityColors = {
  High: 'border-l-4 border-red-500',
  Medium: 'border-l-4 border-amber-400',
  Low: 'border-l-4 border-zinc-200',
};

const categoryColors = {
  Legal: 'bg-purple-50 text-purple-700 border border-purple-100',
  WMS: 'bg-blue-50 text-blue-700 border border-blue-100',
  Marketing: 'bg-pink-50 text-pink-700 border border-pink-100',
  Operations: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('All');

  useEffect(() => {
    async function fetchTasks() {
      try {
        setLoading(true);
        const response = await fetch('/api/tasks');
        if (!response.ok) {
          throw new Error('Failed to fetch tasks');
        }
        const data = await response.json();
        setTasks(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching tasks:', error);
        setTasks([]);
      } finally {
        setLoading(false);
      }
    }

    fetchTasks();
  }, []);

  const handleStatusChange = async (taskId: string, newStatus: Task['status']) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) => (task.id === taskId ? { ...task, status: newStatus } : task))
    );

    try {
      await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taskId, status: newStatus }),
      });
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const filteredTasks =
    filter === 'All' ? tasks : tasks.filter((t) => t.status === filter);

  const filters = ['All', 'To Do', 'In Progress', 'Done'];

  const toDoCount = tasks.filter((t) => t.status === 'To Do').length;
  const inProgressCount = tasks.filter((t) => t.status === 'In Progress').length;
  const doneCount = tasks.filter((t) => t.status === 'Done').length;

  return (
    <AuthGuard>
      <PageShell>
        <header className="mb-12">
          <h1 className="text-4xl font-black text-zinc-900 tracking-tight mb-2">Mission Control</h1>
          <p className="text-zinc-500 font-medium">Alle Aufgaben und Verantwortlichkeiten im Überblick.</p>
        </header>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <Circle className="w-5 h-5 text-zinc-400" />
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">To Do</span>
            </div>
            <div className="text-3xl font-black text-zinc-900">{toDoCount}</div>
          </div>
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-blue-500" />
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">In Progress</span>
            </div>
            <div className="text-3xl font-black text-zinc-900">{inProgressCount}</div>
          </div>
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Done</span>
            </div>
            <div className="text-3xl font-black text-zinc-900">{doneCount}</div>
          </div>
        </div>

        <div className="mb-8 flex gap-2 flex-wrap p-1 bg-zinc-100 rounded-xl w-fit">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${
                filter === f
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="bg-white rounded-3xl border border-zinc-200 p-12 text-center text-sm text-zinc-400 font-medium animate-pulse">
            Lade Missionen...
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-zinc-300 p-20 text-center text-zinc-400 font-bold">
            Keine Aufgaben gefunden.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTasks.map((task) => {
              const Icon = statusIcons[task.status];
              const isOverdue =
                task.status !== 'Done' &&
                task.dueDate &&
                new Date(task.dueDate) < new Date();

              return (
                <div
                  key={task.id}
                  className={`bg-white rounded-2xl border border-zinc-200 p-6 hover:border-zinc-300 hover:shadow-md transition-all group ${priorityColors[task.priority]}`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${categoryColors[task.category] || 'bg-zinc-100 text-zinc-500'}`}>
                      {task.category}
                    </span>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${statusColors[task.status]}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>

                  <h3 className="font-bold text-zinc-900 mb-2 leading-tight">{task.task}</h3>
                  <p className="text-xs text-zinc-500 mb-6 leading-relaxed line-clamp-3">{task.description}</p>

                  <div className="border-t border-zinc-100 pt-4 mt-auto">
                    <div className="flex justify-between items-center text-xs text-zinc-500 mb-4">
                      <span className="font-medium">{task.assignedTo || 'Unassigned'}</span>
                      <span className={`${isOverdue ? 'text-red-500 font-bold' : ''}`}>
                        {isOverdue && <AlertCircle className="w-3 h-3 inline mr-1" />}
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString('de-DE', { day: '2-digit', month: 'short' }) : ''}
                      </span>
                    </div>

                    <select
                      value={task.status}
                      onChange={(e) => handleStatusChange(task.id, e.target.value as Task['status'])}
                      className="w-full bg-zinc-50 border border-zinc-200 text-zinc-700 text-xs font-bold rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-zinc-900 cursor-pointer"
                    >
                      <option value="To Do">To Do</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Done">Done</option>
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </PageShell>
    </AuthGuard>
  );
}