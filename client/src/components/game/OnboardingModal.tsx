import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getRandomTrainer } from "@/constants/trainers";
import { useLocation } from "wouter";

interface OnboardingModalProps {
  open: boolean;
  onClose: () => void;
}

export function OnboardingModal({ open, onClose }: OnboardingModalProps) {
  const [pathname] = useLocation();

  // Disable the onboarding modal on any officer track pages
  if (pathname.startsWith('/officer-track')) {
    return null;
  }
  const trainer = getRandomTrainer();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-800 border-cyan-400 text-slate-50">
        <DialogTitle className="sr-only">Mission Control 2050 Onboarding</DialogTitle>
        <div className="text-center space-y-4 p-2 sm:p-4">
          <div>
            <div className="flex justify-center mb-4">
              <img 
                src={trainer.image} 
                alt={`${trainer.rank} ${trainer.name}`} 
                className="w-48 h-48 sm:w-64 sm:h-64 rounded-full border-4 border-cyan-400 object-cover transition-transform duration-300 hover:scale-105" 
              />
            </div>
            <h1 className="text-3xl font-bold text-cyan-400 mb-2">Mission Control 2050</h1>
            <p className="text-amber-400 font-mono text-sm">SPACE FORCE OPERATIONS CENTER</p>
          </div>
          
          <div className="space-y-4 px-2">
            <div className="bg-slate-900 border border-slate-600 rounded p-3 sm:p-4">
              <h3 className="text-green-400 font-semibold mb-2">Welcome, Cadet! I'm your trainer. I'll be here if you need hints!</h3>
              <div className="text-slate-200 text-base leading-relaxed space-y-3">
                <p>
                  You are now part of the <span className="text-cyan-400 font-bold">Space Force Operations Center</span> — where we need the kind of thinking that <em className="text-red-300">AI 🤖 still can't do</em>.
                </p>
                <p>
                  Sure, they can chat like a human and even pass hard exams — like the ones to become a lawyer or a doctor. But that's because those tests follow patterns, and <strong className="text-yellow-300">AI 🤖 are pattern masters</strong>.
                </p>
                <p>
                  What they're <em>not</em>? <strong className="text-red-400">Real problem-solvers</strong>. Give them something brand new — something they've never seen, with no clear answer in their memory — and they freeze. Or worse: <em className="text-red-300">they make up confident-sounding nonsense</em>.
                </p>
                <p>
                  In officer training, you'll learn how to spot those <strong className="text-red-400">fake-smart answers</strong> before they cause real damage.
                </p>
                <p>
                  For now? We're testing your <span className="text-amber-400 font-bold text-lg">Fluid Intelligence Quotient</span> — your ability to <strong>think on your feet, adapt, and solve what's never been solved before</strong>.
                </p>
                <p className="text-green-300">
                  Don't worry if you get a low score at first.  This is like a gym for your brain, we don't expect you to be a master of the hardest problems right away. Like muscles, your FIQ gets <em>stronger</em> the more you use it.
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-slate-900 border border-slate-600 rounded p-3">
                <h4 className="text-amber-400 font-semibold text-sm mb-1">Your Role</h4>
                <p className="text-slate-400 text-xs">Ground Control Specialist</p>
              </div>
              <div className="bg-slate-900 border border-slate-600 rounded p-3">
                <h4 className="text-amber-400 font-semibold text-sm mb-1">Starting Rank</h4>
                <p className="text-slate-400 text-xs">🎖 Specialist 1 (E-1)</p>
              </div>
            </div>
          </div>
          
          <Button 
            onClick={onClose}
            className="w-full max-w-xs mx-auto bg-cyan-400 hover:bg-blue-500 text-slate-900 font-semibold py-3 px-6 text-sm sm:text-base"
          >
            ENTER OPERATIONS CENTER
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
