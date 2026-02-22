import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { User, Upload } from "lucide-react";
import { toast } from "sonner";

interface ProfilePhotoUploadProps {
  currentPhotoUrl?: string;
  onPhotoUpdated?: (url: string) => void;
}

export function ProfilePhotoUpload({ currentPhotoUrl, onPhotoUpdated }: ProfilePhotoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentPhotoUrl || null);
  const [isLoading, setIsLoading] = useState(false);
  const uploadMutation = trpc.profile.uploadProfilePhoto.useMutation();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Arquivo muito grande (máximo 5MB)");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem");
      return;
    }

    setIsLoading(true);
    try {
      // Read file as base64
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        const base64Data = base64.split(",")[1];

        // Upload to server
        const result = await uploadMutation.mutateAsync({
          photoBase64: base64Data,
          mimeType: file.type,
        });

        setPreview(result.url);
        onPhotoUpdated?.(result.url);
        toast.success("Foto de perfil atualizada!");
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error("Erro ao fazer upload da foto");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Foto de Perfil</h3>
      
      <div className="flex items-center gap-6">
        {/* Current/Preview Photo */}
        <div className="flex-shrink-0">
          {preview ? (
            <img
              src={preview}
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover border-2 border-primary"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center border-2 border-dashed border-primary">
              <User className="w-12 h-12 text-primary/50" />
            </div>
          )}
        </div>

        {/* Upload Section */}
        <div className="flex-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="gap-2"
          >
            <Upload className="w-4 h-4" />
            {isLoading ? "Enviando..." : "Alterar Foto"}
          </Button>
          
          <p className="text-xs text-muted-foreground mt-2">
            JPG, PNG ou GIF. Máximo 5MB.
          </p>
        </div>
      </div>
    </Card>
  );
}
