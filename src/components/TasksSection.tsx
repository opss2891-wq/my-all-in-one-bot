import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, CheckSquare, Square, Loader2 } from 'lucide-react';
import { addTask, getTasks, updateTask, deleteTask, Task } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const TasksSection: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (user) loadTasks();
  }, [user?.id]);

  const getAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  };

  const playSound = (isComplete: boolean) => {
    try {
      const ctx = getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      if (isComplete) {
        // Success sound - ascending
        oscillator.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        oscillator.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
        oscillator.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
      } else {
        // Undo sound - descending
        oscillator.frequency.setValueAtTime(392, ctx.currentTime); // G4
        oscillator.frequency.setValueAtTime(329.63, ctx.currentTime + 0.1); // E4
      }
      
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.3);
    } catch (e) {
      console.log('Audio not supported');
    }
  };

  const loadTasks = async () => {
    if (!user) return;
    try {
      const data = await getTasks(user.id);
      setTasks(data);
    } catch (error) {
      toast({ title: 'Error loading tasks', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async () => {
    if (!newTask.trim() || !user) return;
    setAdding(true);
    try {
      await addTask(user.id, newTask);
      setNewTask('');
      await loadTasks();
      toast({ title: 'Task added successfully' });
    } catch (error) {
      toast({ title: 'Error adding task', variant: 'destructive' });
    } finally {
      setAdding(false);
    }
  };

  const handleToggleTask = async (id: string, completed: boolean) => {
    try {
      playSound(!completed);
      await updateTask(id, !completed);
      await loadTasks();
    } catch (error) {
      toast({ title: 'Error updating task', variant: 'destructive' });
    }
  };

  const handleDeleteTask = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteTask(id);
      await loadTasks();
      toast({ title: 'Task deleted' });
    } catch (error) {
      toast({ title: 'Error deleting task', variant: 'destructive' });
    }
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const progress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

  return (
    <section id="tasks" className="snap-section p-6 flex flex-col">
      <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-warning/20">
            <CheckSquare className="w-6 h-6 text-warning" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Tasks</h2>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">Progress</span>
            <span className="text-sm font-medium text-primary">{completedCount}/{tasks.length}</span>
          </div>
          <div className="h-3 bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full gradient-primary transition-all duration-500 ease-out rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex gap-3 mb-6">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
            placeholder="Add a new task..."
            className="flex-1 bg-card border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
          />
          <button
            onClick={handleAddTask}
            disabled={adding || !newTask.trim()}
            className="px-4 bg-warning hover:bg-warning/90 disabled:opacity-50 rounded-lg transition-all flex items-center justify-center"
          >
            {adding ? <Loader2 className="w-5 h-5 animate-spin text-warning-foreground" /> : <Plus className="w-5 h-5 text-warning-foreground" />}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No tasks yet
            </div>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                onClick={() => handleToggleTask(task.id!, task.completed)}
                className={`bg-card border rounded-lg p-4 animate-slide-up group flex items-center gap-3 transition-all cursor-pointer select-none active:scale-[0.98] ${
                  task.completed ? 'border-success/50 bg-success/5' : 'border-border hover:border-warning/50'
                }`}
              >
                <div className="flex-shrink-0">
                  {task.completed ? (
                    <CheckSquare className="w-5 h-5 text-success" />
                  ) : (
                    <Square className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  )}
                </div>
                <span 
                  className={`flex-1 text-foreground ${task.completed ? 'line-through text-muted-foreground' : ''}`}
                >
                  {task.title}
                </span>
                <button
                  onClick={(e) => handleDeleteTask(task.id!, e)}
                  className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default TasksSection;
