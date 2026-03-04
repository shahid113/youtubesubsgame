export default function ChannelCard({ channel, isRevealed, onClick, disabled, side }) {
  const accentColor = side === 'left' ? 'border-cyan-500 shadow-cyan-500/20' : 'border-fuchsia-500 shadow-fuchsia-500/20';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative flex-1 flex flex-col items-center justify-center p-4 md:p-8 rounded-[2rem] bg-slate-900/80 border-2 border-white/5 transition-all duration-500 
        ${!disabled ? 'hover:scale-[1.02] hover:bg-slate-800 cursor-pointer' : 'cursor-default'}
        ${isRevealed ? 'opacity-100' : 'opacity-90'}`}
    >
      <div className="relative mb-6">
        <img
          src={channel?.thumbnail}
          alt={channel?.name}
          className={`w-24 h-24 md:w-44 md:h-44 rounded-full object-cover border-4 ${accentColor} shadow-2xl`}
        />
      </div>

      <h3 className="text-lg md:text-3xl font-black text-center uppercase tracking-tighter leading-tight h-16 line-clamp-2">
        {channel?.name}
      </h3>

      <div className={`mt-6 transition-all duration-700 transform ${isRevealed ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
        <div className="text-2xl md:text-5xl font-black text-amber-400 tabular-nums">
          {channel?.subs.toLocaleString()}
        </div>
        <div className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-[0.3em] mt-1">Subscribers</div>
      </div>
    </button>
  );
}