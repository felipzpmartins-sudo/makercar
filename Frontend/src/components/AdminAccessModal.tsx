import { ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AdminAccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUnlock: () => void;
}

export function AdminAccessModal({ open, onOpenChange, onUnlock }: AdminAccessModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Acesso administrativo</DialogTitle>
          <DialogDescription>
            O acesso administrativo agora usa o cargo da conta logada.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button
            type="button"
            onClick={() => {
              onUnlock();
              onOpenChange(false);
            }}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            <ShieldCheck className="h-4 w-4" />
            Continuar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
