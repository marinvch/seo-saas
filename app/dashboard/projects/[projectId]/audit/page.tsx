"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StartAudit } from "@/components/audits/start-audit";
import { AuditProgress } from "@/components/audits/audit-progress";
import { AuditResults } from "@/components/audits/audit-results";
import { AuditHistory } from "@/components/audits/audit-history";
import { AuditScheduleManager } from "@/components/audits/audit-schedule-manager";
import { useAppSelector } from "@/store/hooks";
import { selectCurrentAudit } from "@/store/slices/audit-slice";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export default function AuditDashboardPage({
  params: { projectId },
}: {
  params: { projectId: string };
}) {
  const [activeTab, setActiveTab] = useState("overview");
  const currentAudit = useAppSelector(selectCurrentAudit);

  return (
    <div className="container py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Site Audit Dashboard
        </h1>
        <p className="text-muted-foreground mt-2">
          Run comprehensive site audits and monitor your website&apos;s SEO
          health
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="audits">Audits</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {currentAudit ? (
            currentAudit.status === "COMPLETED" ? (
              <AuditResults audit={currentAudit} />
            ) : (
              <AuditProgress projectId={projectId} />
            )
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Welcome to Site Audits</CardTitle>
                <CardDescription>
                  Start your first audit to get detailed insights about your
                  website&apos;s SEO health, performance, and accessibility.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="audits">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              {currentAudit?.status === "COMPLETED" ? (
                <AuditResults audit={currentAudit} />
              ) : (
                <StartAudit projectId={projectId} />
              )}
            </div>
            <div>
              <AuditHistory projectId={projectId} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="schedule">
          <AuditScheduleManager />
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Audit History</CardTitle>
              <CardDescription>
                View past audits and track your website&apos;s SEO progress over
                time
              </CardDescription>
            </CardHeader>
            <AuditHistory projectId={projectId} className="mt-0" />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
