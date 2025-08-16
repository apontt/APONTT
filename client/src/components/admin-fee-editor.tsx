import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Edit, Check, X } from "lucide-react";
import type { Partner } from "@shared/schema";

interface AdminFeeEditorProps {
  partner: Partner;
  onUpdate: (updatedPartner: Partner) => void;
}

export default function AdminFeeEditor({ partner, onUpdate }: AdminFeeEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(partner.adminFeeRate || "5.00");
  const { toast } = useToast();

  const updateAdminFeeMutation = useMutation({
    mutationFn: async (newRate: string) => {
      const response = await apiRequest("PATCH", `/api/partners/${partner.id}/admin-fee`, {
        adminFeeRate: newRate
      });
      return response.json();
    },
    onSuccess: (updatedPartner) => {
      toast({
        title: "Taxa atualizada!",
        description: `Taxa administrativa de ${partner.name} atualizada para ${tempValue}%`,
      });
      setIsEditing(false);
      onUpdate(updatedPartner);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a taxa administrativa",
        variant: "destructive",
      });
      setTempValue(partner.adminFeeRate || "5.00");
      setIsEditing(false);
    },
  });

  const handleSave = () => {
    const numericValue = parseFloat(tempValue);
    if (isNaN(numericValue) || numericValue < 0 || numericValue > 100) {
      toast({
        title: "Valor inválido",
        description: "Digite um valor entre 0 e 100",
        variant: "destructive",
      });
      return;
    }
    updateAdminFeeMutation.mutate(tempValue);
  };

  const handleCancel = () => {
    setTempValue(partner.adminFeeRate || "5.00");
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex items-center space-x-2">
        <Input
          type="number"
          step="0.01"
          min="0"
          max="100"
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          className="w-20 h-8 text-sm"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") handleCancel();
          }}
        />
        <Button
          size="sm"
          onClick={handleSave}
          disabled={updateAdminFeeMutation.isPending}
          className="h-8 w-8 p-0 bg-green-600 hover:bg-green-700"
        >
          <Check className="h-3 w-3" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleCancel}
          className="h-8 w-8 p-0"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <span className="font-medium text-gray-900 min-w-[60px]">
        {parseFloat(partner.adminFeeRate || "5.00").toFixed(2)}%
      </span>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setIsEditing(true)}
        className="h-6 w-6 p-0 hover:bg-blue-100"
        title="Editar taxa administrativa"
      >
        <Edit className="h-3 w-3" />
      </Button>
    </div>
  );
}