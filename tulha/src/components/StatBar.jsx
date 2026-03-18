import { useGameStore, SUITS } from '../store/gameStore';

export default function StatBar() {
  const { suits } = useGameStore();

  const totalRem = Object.values(suits).reduce((a, s) => a + (s.total - s.discarded), 0);
  const totalDisc = Object.values(suits).reduce((a, s) => a + s.discarded, 0);

  const danger = SUITS.reduce((a, b) => {
    const pA = suits[a.key] ? (suits[a.key].total - suits[a.key].discarded) / suits[a.key].total : 1;
    const pB = suits[b.key] ? (suits[b.key].total - suits[b.key].discarded) / suits[b.key].total : 1;
    return pA < pB ? a : b;
  });

  const stats = [
    { label: 'REMAINING', val: totalRem, color: 'text-success' },
    { label: 'DISCARDED', val: totalDisc, color: 'text-gold' },
    { label: 'DANGER', val: `${danger.symbol} ${danger.label}`, color: 'text-danger' },
  ];

  return (
    <div className="grid grid-cols-3 bg-bg-tertiary border-b border-border-light">
      {stats.map((s, i) => (
        <div
          key={s.label}
          className={`py-2.5 lg:py-3.5 px-1 lg:px-2 text-center ${i < stats.length - 1 ? 'border-r border-border-light' : ''}`}
        >
          <div className={`${s.color} text-lg lg:text-[22px] font-bold`}>{s.val}</div>
          <div className="text-text-darker text-[9px] tracking-[1px]">{s.label}</div>
        </div>
      ))}
    </div>
  );
}
