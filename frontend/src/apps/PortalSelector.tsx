import { useNavigate } from 'react-router-dom';
import { LayoutGrid, GraduationCap, ArrowRight } from 'lucide-react';

export default function PortalSelector() {
  const navigate = useNavigate();

  return (
    <div 
      className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6"
      style={{
        backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)'
      }}
    >
      {/* Header */}
      <div className="text-center mb-12 animate-fade-in">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
          University Systems
        </h1>
        <p className="mt-3 text-lg text-slate-400">
          Select a portal below to sign into your workspace
        </p>
      </div>

      {/* Cards Container */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
        {/* Card 1: University ERP Portal */}
        <div 
          onClick={() => navigate('/login')}
          className="group cursor-pointer bg-slate-800/50 hover:bg-slate-800/80 border border-slate-700/50 hover:border-rose-500/50 rounded-2xl p-8 shadow-xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-rose-950/20"
        >
          <div className="w-14 h-14 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500 group-hover:scale-110 transition-transform duration-300">
            <GraduationCap className="w-8 h-8" />
          </div>
          
          <h2 className="mt-6 text-2xl font-bold text-white group-hover:text-rose-400 transition-colors">
            University ERP Portal
          </h2>
          
          <p className="mt-3 text-slate-400 leading-relaxed text-sm">
            Access students, admissions, registrars, counsellors, faculty, HODs, and college administration resources.
          </p>

          <div className="mt-8 flex items-center gap-2 text-rose-500 font-semibold group-hover:gap-3 transition-all">
            <span>Enter Portal</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>

        {/* Card 2: ERP Studio (Designer) */}
        <div 
          onClick={() => navigate('/designer/login')}
          className="group cursor-pointer bg-slate-800/50 hover:bg-slate-800/80 border border-slate-700/50 hover:border-blue-500/50 rounded-2xl p-8 shadow-xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-blue-950/20"
        >
          <div className="w-14 h-14 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform duration-300">
            <LayoutGrid className="w-8 h-8" />
          </div>
          
          <h2 className="mt-6 text-2xl font-bold text-white group-hover:text-blue-400 transition-colors">
            ERP Studio (Designer)
          </h2>
          
          <p className="mt-3 text-slate-400 leading-relaxed text-sm">
            Design and construct university modules, dynamic fields, database columns, and metadata forms in real time.
          </p>

          <div className="mt-8 flex items-center gap-2 text-blue-500 font-semibold group-hover:gap-3 transition-all">
            <span>Launch Studio</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-16 text-center text-xs text-slate-500">
        <p>© 2026 University. Powered by SlashCurate Technologies.</p>
      </div>
    </div>
  );
}
