'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CalendarIcon, Loader2, SaveIcon, TrashIcon } from 'lucide-react';
import { formatDistance } from 'date-fns';
import { RankTrackingFrequency } from '@prisma/client';

interface AuditSchedule {
  id: string;
  frequency: RankTrackingFrequency;
  lastRunAt?: Date;
  nextRunAt: Date;
  isActive: boolean;
  options: {
    maxDepth?: number;
    emulateDevice?: 'desktop' | 'mobile';
    includeScreenshots?: boolean;
    respectRobotsTxt?: boolean;
  };
}

export function AuditScheduleManager() {
  const { projectId } = useParams();
  const { toast } = useToast();
  const [schedules, setSchedules] = useState<AuditSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [newSchedule, setNewSchedule] = useState({
    frequency: 'WEEKLY' as RankTrackingFrequency,
    isActive: true,
    options: {
      maxDepth: 3,
      emulateDevice: 'desktop' as const,
      includeScreenshots: false,
      respectRobotsTxt: true,
    },
  });

  useEffect(() => {
    loadSchedules();
  }, [projectId]);

  const loadSchedules = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/audit/schedules`);
      if (!response.ok) throw new Error('Failed to load audit schedules');
      const data = await response.json();
      setSchedules(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load audit schedules',
        variant: 'destructive',
      });
    } finally {
      setLoading = false;
    }
  };

  const handleCreateSchedule = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/audit/schedules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSchedule),
      });

      if (!response.ok) throw new Error('Failed to create audit schedule');

      const data = await response.json();
      setSchedules([...schedules, data]);
      toast({
        title: 'Success',
        description: 'Audit schedule created successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create audit schedule',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateSchedule = async (scheduleId: string, updates: Partial<AuditSchedule>) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/audit/schedules/${scheduleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) throw new Error('Failed to update audit schedule');

      const updatedSchedule = await response.json();
      setSchedules(schedules.map(s => s.id === scheduleId ? updatedSchedule : s));
      toast({
        title: 'Success',
        description: 'Audit schedule updated successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update audit schedule',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/audit/schedules/${scheduleId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete audit schedule');

      setSchedules(schedules.filter(s => s.id !== scheduleId));
      toast({
        title: 'Success',
        description: 'Audit schedule deleted successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete audit schedule',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Create New Schedule</CardTitle>
          <CardDescription>Set up automated recurring site audits</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Frequency</Label>
              <Select
                value={newSchedule.frequency}
                onValueChange={(value: RankTrackingFrequency) =>
                  setNewSchedule({ ...newSchedule, frequency: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DAILY">Daily</SelectItem>
                  <SelectItem value="WEEKLY">Weekly</SelectItem>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Take Screenshots</Label>
                  <p className="text-sm text-muted-foreground">
                    Capture page screenshots during audit
                  </p>
                </div>
                <Switch
                  checked={newSchedule.options.includeScreenshots}
                  onCheckedChange={(checked) =>
                    setNewSchedule({
                      ...newSchedule,
                      options: { ...newSchedule.options, includeScreenshots: checked },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Respect robots.txt</Label>
                  <p className="text-sm text-muted-foreground">
                    Follow website crawling rules
                  </p>
                </div>
                <Switch
                  checked={newSchedule.options.respectRobotsTxt}
                  onCheckedChange={(checked) =>
                    setNewSchedule({
                      ...newSchedule,
                      options: { ...newSchedule.options, respectRobotsTxt: checked },
                    })
                  }
                />
              </div>
            </div>

            <Button onClick={handleCreateSchedule} disabled={saving} className="w-full">
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Schedule...
                </>
              ) : (
                <>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  Create Schedule
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Schedules</CardTitle>
          <CardDescription>Manage your automated audit schedules</CardDescription>
        </CardHeader>
        <CardContent>
          {schedules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No audit schedules configured yet
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Last Run</TableHead>
                  <TableHead>Next Run</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.map((schedule) => (
                  <TableRow key={schedule.id}>
                    <TableCell className="font-medium">{schedule.frequency}</TableCell>
                    <TableCell>
                      {schedule.lastRunAt
                        ? formatDistance(new Date(schedule.lastRunAt), new Date(), {
                            addSuffix: true,
                          })
                        : 'Never'}
                    </TableCell>
                    <TableCell>
                      {formatDistance(new Date(schedule.nextRunAt), new Date(), {
                        addSuffix: true,
                      })}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={schedule.isActive}
                        onCheckedChange={(checked) =>
                          handleUpdateSchedule(schedule.id, { isActive: checked })
                        }
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSchedule(schedule.id)}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}