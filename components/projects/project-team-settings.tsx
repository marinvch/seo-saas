"use client";

import { useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Role, type User, type OrganizationUser } from "@prisma/client";
import { MoreHorizontal, Loader2, UserPlus, Mail } from "lucide-react";
import { useEffect } from "react";

interface TeamMember extends OrganizationUser {
  user: User;
}

interface ProjectTeamSettingsProps {
  projectId: string;
  organizationId: string;
}

export function ProjectTeamSettings({ projectId, organizationId }: ProjectTeamSettingsProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [inviteEmail, setInviteEmail] = useState<string>("");
  const [isInviting, setIsInviting] = useState<boolean>(false);

  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        const response = await fetch(`/api/organizations/${organizationId}/members`);
        if (!response.ok) {
          throw new Error("Failed to fetch team members");
        }
        const data = await response.json();
        setMembers(data);
      } catch (error) {
        console.error("Error fetching team members:", error);
        toast({
          title: "Error",
          description: "Failed to load team members. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeamMembers();
  }, [organizationId]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    
    setIsInviting(true);
    try {
      const response = await fetch(`/api/organizations/${organizationId}/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: inviteEmail,
          role: "AGENCY_MEMBER",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send invitation");
      }

      toast({
        title: "Invitation sent",
        description: `An invitation has been sent to ${inviteEmail}`,
      });
      setInviteEmail("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send invitation. Please try again.",
        variant: "destructive",
      });
      console.error(error);
    } finally {
      setIsInviting(false);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: Role) => {
    try {
      const response = await fetch(`/api/organizations/${organizationId}/members/${memberId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: newRole,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update member role");
      }

      setMembers(
        members.map((member) =>
          member.id === memberId
            ? { ...member, role: newRole }
            : member
        )
      );

      toast({
        title: "Role updated",
        description: "The member's role has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update role. Please try again.",
        variant: "destructive",
      });
      console.error(error);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this team member?")) {
      return;
    }
    
    try {
      const response = await fetch(`/api/organizations/${organizationId}/members/${memberId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to remove member");
      }

      setMembers(members.filter((member) => member.id !== memberId));

      toast({
        title: "Member removed",
        description: "The team member has been removed successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove member. Please try again.",
        variant: "destructive",
      });
      console.error(error);
    }
  };

  const getRoleLabel = (role: Role) => {
    switch (role) {
      case "AGENCY_OWNER":
        return "Owner";
      case "AGENCY_MEMBER":
        return "Member";
      case "CLIENT":
        return "Client";
      default:
        return role;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Members</CardTitle>
        <CardDescription>
          Manage who has access to this project and their roles
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form className="flex gap-2" onSubmit={handleInvite}>
          <Input
            type="email"
            placeholder="team@example.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            className="flex-1"
            disabled={isInviting}
          />
          <Button type="submit" disabled={isInviting}>
            {isInviting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Inviting...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Invite
              </>
            )}
          </Button>
        </form>

        <div className="rounded-md border">
          {isLoading ? (
            <div className="flex justify-center items-center p-6">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="divide-y">
              {members.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  No team members found
                </div>
              ) : (
                members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarImage src={member.user.image || undefined} alt={member.user.name || "Team member"} />
                        <AvatarFallback>
                          {member.user.name?.charAt(0) || member.user.email.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member.user.name || "Unnamed User"}</p>
                        <p className="text-sm text-muted-foreground">
                          <Mail className="inline h-3 w-3 mr-1" />
                          {member.user.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {getRoleLabel(member.role)}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleRoleChange(member.id, "AGENCY_OWNER")}>
                            Make Owner
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleRoleChange(member.id, "AGENCY_MEMBER")}>
                            Make Member
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleRoleChange(member.id, "CLIENT")}>
                            Make Client
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleRemoveMember(member.id)}
                          >
                            Remove Member
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
