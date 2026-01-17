'use client';

import { useEffect, useState } from 'react';
import Header from '@/app/components/Header';
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
  'To Do': 'bg-gray-100 text-gray-700',
  'In Progress': 'bg-blue-100 text-blue-700',
  'Done': 'bg-green-100 text-green-700',
};

const priorityColors = {
  High: 'border-l-4 border-red-500',
  Medium: 'border-l-4 border-yellow-500',
  Low: 'border-l-4 border-gray-300',
};

const categoryColors = {
  Legal: 'bg-purple-100 text-purple-700',
  WMS: 'bg-blue-100 text-blue-700',
  Marketing: 'bg-pink-100 text-pink-700',
  Operations: 'bg-green-100 text-green-700',
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
      <div className="min-h-screen bg-gray-50">
        <Header />

        <div className="max-w-6xl mx-auto px-6 py-12 pt-32">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <CheckSquare className="w-8 h-8 text-gray-700" />
              <h1 className="text-4xl font-bold text-gray-900">Tasks & Action Items</h1>
            </div>
            <p className="text-lg text-gray-600">
              Alle Aufgaben und Verantwortlichkeiten im Überblick.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-2">
                <Circle className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-600">To Do</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{toDoCount}</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-600">In Progress</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{inProgressCount}</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-gray-600">Done</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{doneCount}</div>
            </div>
          </div>

          <div className="mb-6 flex gap-2 flex-wrap">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === f
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-500">
              Lade Tasks...
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-500">
              Noch keine Tasks vorhanden.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map((task) => {
                const Icon = statusIcons[task.status];
                const isOverdue =
                  task.status !== 'Done' &&
                  task.dueDate &&
                  new Date(task.dueDate) < new Date();

                return (
                  <div
                    key={task.id}
                    className={`bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 transition-colors ${
                      priorityColors[task.priority]
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            statusColors[task.status]
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">{task.task}</h3>
                          <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs text-gray-500">
                              <strong>Assigned:</strong> {task.assignedTo}
                            </span>
                            <span className="text-xs text-gray-400">•</span>
                            <span
                              className={`text-xs ${
                                isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'
                              }`}
                            >
                              {isOverdue && (
                                <AlertCircle className="w-3 h-3 inline mr-1" />
                              )}
                              <strong>Due:</strong>{' '}
                              {new Date(task.dueDate).toLocaleDateString('de-DE')}
                            </span>
                            <span className="text-xs text-gray-400">•</span>
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                                categoryColors[task.category]
                              }`}
                            >
                              {task.category}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 ml-3">
                        <select
                          value={task.status}
                          onChange={(e) =>
                            handleStatusChange(task.id, e.target.value as Task['status'])
                          }
                          className={`px-3 py-1 rounded-lg text-xs font-medium border border-gray-200 focus:outline-none focus:border-gray-900 ${
                            statusColors[task.status]
                          }`}
                        >
                          <option value="To Do">To Do</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Done">Done</option>
                        </select>
                        <span
                          className={`inline-flex items-center justify-center px-2 py-1 rounded-md text-xs font-medium ${
                            task.priority === 'High'
                              ? 'bg-red-100 text-red-700'
                              : task.priority === 'Medium'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {task.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
