import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Search, Plus, X, Loader2 } from "lucide-react";

export function UserRolesAssignment() {
  const { data: users } = trpc.admin.users.useQuery();
  const { data: roles } = trpc.roles.list.useQuery();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const assignRoleMutation = trpc.roles.assignToUser.useMutation();
  const removeRoleMutation = trpc.roles.removeFromUser.useMutation();

  const filteredUsers = users?.filter((u: any) =>
    u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const selectedUser = users?.find((u: any) => u.id === selectedUserId);
  const userRoles = (selectedUser as any)?.userRoles || [];

  const handleAssignRole = async (roleId: number) => {
    if (!selectedUserId) return;

    try {
      await assignRoleMutation.mutateAsync({
        userId: selectedUserId,
        roleId,
      });
      toast.success("Cargo atribuído com sucesso!");
    } catch (error) {
      toast.error("Erro ao atribuir cargo");
    }
  };

  const handleRemoveRole = async (roleId: number) => {
    if (!selectedUserId) return;

    try {
      await removeRoleMutation.mutateAsync({
        userId: selectedUserId,
        roleId,
      });
      toast.success("Cargo removido com sucesso!");
    } catch (error) {
      toast.error("Erro ao remover cargo");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Atribuir Cargos a Usuários</h3>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Users List */}
          <div className="lg:col-span-1">
            <Card className="p-4">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar usuário..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user: any) => (
                    <button
                      key={user.id}
                      onClick={() => setSelectedUserId(user.id)}
                      className={`w-full text-left px-3 py-2 rounded transition ${
                        selectedUserId === user.id
                          ? "bg-primary/20 border border-primary"
                          : "bg-secondary/50 hover:bg-secondary border border-transparent"
                      }`}
                    >
                      <p className="text-sm font-medium">{user.displayName || user.username}</p>
                      <p className="text-xs text-muted-foreground">@{user.username}</p>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum usuário encontrado
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Role Assignment */}
          <div className="lg:col-span-2">
            {selectedUser ? (
              <Card className="p-6">
                <h4 className="font-semibold mb-4">
                  Cargos de {selectedUser.displayName || selectedUser.username}
                </h4>

                {/* Current Roles */}
                <div className="mb-6">
                  <p className="text-sm font-medium mb-3">Cargos Atuais:</p>
                  {userRoles && userRoles.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {userRoles.map((role: any) => (
                        <Badge
                          key={role.id}
                          style={{ backgroundColor: role.color || "#8b5cf6" }}
                          className="flex items-center gap-2 pr-1"
                        >
                          {role.name}
                          <button
                            onClick={() => handleRemoveRole(role.id)}
                            className="hover:opacity-70 transition"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Nenhum cargo atribuído</p>
                  )}
                </div>

                {/* Available Roles */}
                <div>
                  <p className="text-sm font-medium mb-3">Adicionar Cargo:</p>
                  <div className="space-y-2">
                    {roles && roles.length > 0 ? (
                      roles.map((role: any) => {
                        const hasRole = userRoles?.some((r: any) => r.id === role.id);
                        return (
                          <div
                            key={role.id}
                            className="flex items-center justify-between p-3 bg-secondary/50 rounded border border-border/30"
                          >
                            <div>
                              <p className="text-sm font-medium">{role.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {role.permissions?.length || 0} permissões
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant={hasRole ? "outline" : "default"}
                              onClick={() => handleAssignRole(role.id)}
                              disabled={hasRole || assignRoleMutation.isPending}
                              className="gap-1"
                            >
                              {assignRoleMutation.isPending ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Plus className="w-3 h-3" />
                              )}
                              {hasRole ? "Atribuído" : "Adicionar"}
                            </Button>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-xs text-muted-foreground">Nenhum cargo disponível</p>
                    )}
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="p-6 text-center text-muted-foreground">
                Selecione um usuário para gerenciar seus cargos
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
