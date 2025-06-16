import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface OnboardingModalProps {
  open: boolean;
  onClose: () => void;
}

export function OnboardingModal({ open, onClose }: OnboardingModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-slate-800 border-cyan-400 text-slate-50">
        <div className="text-center space-y-6">
          <div>
            <div className="text-cyan-400 text-6xl mb-4">🚀</div>
            <h1 className="text-3xl font-bold text-cyan-400 mb-2">Mission Control 2045</h1>
            <p className="text-amber-400 font-mono text-sm">US SPACE FORCE OPERATIONS CENTER</p>
          </div>
          
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-600 rounded p-4">
              <h3 className="text-green-400 font-semibold mb-2">Welcome, Cadet Wyatt!</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                You are now part of the <span className="text-cyan-400 font-semibold">US Space Force Operations Center</span> where computers do math, but we need humans to perceive the bigger picture. Let's start you with some basic tasks to make you a useful member of the team. This training will take you all the way to the highest enlisted rank: <span className="text-amber-400 font-semibold">Chief Master Sergeant of the Space Force!</span>
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900 border border-slate-600 rounded p-3">
                <h4 className="text-amber-400 font-semibold text-sm mb-1">Your Role</h4>
                <p className="text-slate-400 text-xs">Ground Control Specialist</p>
              </div>
              <div className="bg-slate-900 border border-slate-600 rounded p-3">
                <h4 className="text-amber-400 font-semibold text-sm mb-1">Starting Rank</h4>
                <p className="text-slate-400 text-xs">🪖 Specialist 1 (E-1)</p>
              </div>
            </div>
          </div>
          
          <Button 
            onClick={onClose}
            className="w-full bg-cyan-400 hover:bg-blue-500 text-slate-900 font-semibold py-3 px-6"
          >
            ENTER OPERATIONS CENTER
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
