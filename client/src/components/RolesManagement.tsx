import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Trash2, Users } from "lucide-react";

const AVAILABLE_PERMISSIONS = [
  "create_threads",
  "create_comments",
  "edit_own_posts",
  "delete_own_posts",
  "moderate_comments",
  "edit_products",
  "delete_products",
  "view_admin_panel",
  "manage_users",
  "manage_roles",
];

export function RolesManagement() {
  const { data: roles } = trpc.roles.list.useQuery();
  const createRoleMutation = trpc.roles.create.useMutation();
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleColor, setNewRoleColor] = useState("#3b82f6");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) {
      toast.error("Nome do cargo é obrigatório");
      return;
    }

    try {
      await createRoleMutation.mutateAsync({
        name: newRoleName,
        color: newRoleColor,
        permissions: selectedPermissions,
      });
      setNewRoleName("");
      setSelectedPermissions([]);
      toast.success("Cargo criado com sucesso!");
    } catch (error) {
      toast.error("Erro ao criar cargo");
    }
  };

  const togglePermission = (permission: string) => {
    setSelectedPermissions(prev =>
      prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Gerenciar Cargos</h3>
        
        {/* Create New Role */}
        <Card className="p-6 mb-6">
          <h4 className="font-medium mb-4">Criar Novo Cargo</h4>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Nome do Cargo</label>
              <Input
                placeholder="Ex: Moderador, Editor, VIP"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Cor</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={newRoleColor}
                  onChange={(e) => setNewRoleColor(e.target.value)}
                  className="w-12 h-10 rounded cursor-pointer"
                />
                <Input
                  value={newRoleColor}
                  onChange={(e) => setNewRoleColor(e.target.value)}
                  placeholder="#3b82f6"
                  className="flex-1"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-3 block">Permissões</label>
              <div className="grid grid-cols-2 gap-2">
                {AVAILABLE_PERMISSIONS.map(permission => (
                  <label key={permission} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedPermissions.includes(permission)}
                      onChange={() => togglePermission(permission)}
                      className="rounded"
                    />
                    <span className="text-sm capitalize">{permission.replace(/_/g, " ")}</span>
                  </label>
                ))}
              </div>
            </div>

            <Button onClick={handleCreateRole} className="w-full gap-2">
              <Plus className="w-4 h-4" />
              Criar Cargo
            </Button>
          </div>
        </Card>

        {/* Roles List */}
        <div className="space-y-3">
          {roles && roles.length > 0 ? (
            roles.map((role: any) => (
              <Card key={role.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge style={{ backgroundColor: role.color }}>
                        {role.name}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {role.permissions?.length || 0} permissões
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {role.permissions?.map((perm: string) => (
                        <span
                          key={perm}
                          className="text-xs bg-secondary/50 px-2 py-1 rounded capitalize"
                        >
                          {perm.replace(/_/g, " ")}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum cargo criado ainda
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
