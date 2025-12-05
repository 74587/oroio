import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Plus, Trash2, FileText, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { isElectron, listDroids, createDroid, deleteDroid, type Droid } from '@/utils/api';

export default function DroidsManager() {
  const [droids, setDroids] = useState<Droid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [droidToDelete, setDroidToDelete] = useState<string | null>(null);
  const [newDroidName, setNewDroidName] = useState('');
  const [adding, setAdding] = useState(false);

  const loadDroids = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await listDroids();
      setDroids(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load droids');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDroids();
  }, [loadDroids]);

  const handleAddDroid = async () => {
    if (!newDroidName.trim()) return;
    setAdding(true);
    try {
      await createDroid(newDroidName.trim());
      setNewDroidName('');
      setAddDialogOpen(false);
      await loadDroids();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create droid');
    }
    setAdding(false);
  };

  const handleDeleteDroid = async () => {
    if (!droidToDelete) return;
    try {
      await deleteDroid(droidToDelete);
      await loadDroids();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete droid');
    }
    setDroidToDelete(null);
  };

  const handleOpenDroid = async (droidPath: string) => {
    if (isElectron) {
      await window.oroio.openPath(droidPath);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-destructive">{error}</p>
        <Button onClick={loadDroids}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Droids</h1>
          <p className="text-muted-foreground">
            Custom sub-agents <span className="text-muted-foreground/50">·</span> {droids.length} {droids.length === 1 ? 'droid' : 'droids'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadDroids}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Droid
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Droid</DialogTitle>
                <DialogDescription>Enter a name for your new droid configuration.</DialogDescription>
              </DialogHeader>
              <Input
                placeholder="my-droid"
                value={newDroidName}
                onChange={(e) => setNewDroidName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddDroid()}
              />
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleAddDroid} disabled={adding || !newDroidName.trim()}>
                  {adding ? 'Creating...' : 'Create'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        {droids.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Bot className="h-12 w-12 mb-4 opacity-50" />
            <p>No droids found</p>
            <p className="text-sm">Create droids in ~/.factory/droids/</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Path</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {droids.map((droid) => (
                <TableRow key={droid.name}>
                  <TableCell className="font-medium">{droid.name}</TableCell>
                  <TableCell className="text-muted-foreground font-mono text-sm">{droid.path}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleOpenDroid(droid.path)}
                        title="Open in Editor"
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setDroidToDelete(droid.name)}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <AlertDialog open={droidToDelete !== null} onOpenChange={(open) => !open && setDroidToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete droid "{droidToDelete}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the droid configuration file.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDroid} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
