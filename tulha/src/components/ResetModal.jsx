import { useGameStore } from '../store/gameStore';

export default function ResetModal({ onClose }) {
  const resetGame = useGameStore(s => s.resetGame);

  return (
    <div
      className="fixed inset-0 bg-black/80 z-[500] flex items-center justify-center p-5"
      onClick={onClose}
    >
      <div
        className="bg-bg-secondary border border-danger/25 rounded-2xl p-7 w-full max-w-[340px] animate-fadeIn"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-danger mt-0 mb-2 text-lg font-bold">Reset Game?</h3>
        <p className="text-text-dark mb-6 text-sm">All progress will be lost. This action cannot be undone.</p>
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={onClose}
            className="w-full py-3 bg-transparent border border-border rounded-[10px] text-text-dark font-bold text-sm cursor-pointer
              hover:border-text-muted/40 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => { resetGame(); onClose(); }}
            className="w-full py-3 bg-gradient-to-br from-danger to-[#b02030] border-none rounded-[10px] text-white font-bold text-sm cursor-pointer
              hover:shadow-[0_4px_16px_#e6394644] transition-all"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
