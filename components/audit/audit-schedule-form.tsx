"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Switch } from "../../components/ui/switch";
import { Label } from "../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { CalendarClock, Info } from 'lucide-react';
import { toast } from '../../components/ui/use-toast';

interface AuditScheduleFormProps {
  projectId: string;
  currentSchedule?: {
    id: string;
    frequency: 'daily' | 'weekly' | 'monthly';
    isActive: boolean;
    nextRunAt: Date;
    lastRunAt?: Date;
  };
}

export default function AuditScheduleForm({ projectId, currentSchedule }: AuditScheduleFormProps) {
  const router = useRouter();
  const [isActive, setIsActive] = useState<boolean>(currentSchedule?.isActive || false);
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>(
    currentSchedule?.frequency || 'weekly'
  );
  const [loading, setLoading] = useState<boolean>(false);

  // Save audit schedule
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/projects/${projectId}/audit-schedule`, {
        method: currentSchedule ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          frequency,
          isActive,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to save audit schedule');
      }

      toast({
        title: "Schedule Saved",
        description: `Automated audits will run ${frequency} ${isActive ? 'starting from now' : 'when activated'}`,
      });

      // Refresh the page to show the updated schedule
      router.refresh();
    } catch (error) {
      console.error('Error saving audit schedule:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save audit schedule',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Get next run date display
  const getNextRunDisplay = () => {
    if (!isActive) return 'Not scheduled';
    
    if (currentSchedule?.nextRunAt) {
      const nextRun = new Date(currentSchedule.nextRunAt);
      return nextRun.toLocaleDateString() + ' at ' + nextRun.toLocaleTimeString();
    }
    
    // Calculate approximate next run based on frequency
    const now = new Date();
    let nextRun = new Date();
    
    switch (frequency) {
      case 'daily':
        // Next day, same time
        nextRun.setDate(now.getDate() + 1);
        break;
      case 'weekly':
        // Next week, same day and time
        nextRun.setDate(now.getDate() + 7);
        break;
      case 'monthly':
        // Next month, same day and time
        nextRun.setMonth(now.getMonth() + 1);
        break;
    }
    
    return nextRun.toLocaleDateString() + ' (estimated)';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5" />
          Automated Audit Schedule
        </CardTitle>
        <CardDescription>
          Set up regular automated audits for your website
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="schedule-active">Enable Automated Audits</Label>
              <p className="text-xs text-muted-foreground">
                Automatically run audits on a regular schedule
              </p>
            </div>
            <Switch
              id="schedule-active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="frequency">Frequency</Label>
            <Select
              value={frequency}
              onValueChange={(value: 'daily' | 'weekly' | 'monthly') => setFrequency(value)}
              disabled={!isActive}
            >
              <SelectTrigger id="frequency" className="w-full">
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              How often the audit will run automatically
            </p>
          </div>

          {currentSchedule && (
            <div className="rounded-md bg-primary-foreground/10 p-4">
              <div className="flex items-start gap-2">
                <Info className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium">Schedule Information</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Next scheduled audit: {getNextRunDisplay()}
                  </p>
                  {currentSchedule.lastRunAt && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Last automated audit: {new Date(currentSchedule.lastRunAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Saving...' : (currentSchedule ? 'Update Schedule' : 'Save Schedule')}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}