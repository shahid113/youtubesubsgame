export default function ChannelCard({ channel, isRevealed, onClick, disabled, side }) {
  const accentColor =
    side === "left"
      ? "border-cyan-500 shadow-cyan-500/20"
      : "border-fuchsia-500 shadow-fuchsia-500/20";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative w-full flex flex-col items-center justify-center 
      p-4 sm:p-6 md:p-10 
      rounded-xl sm:rounded-2xl md:rounded-[2rem] 
      bg-slate-900/80 border-2 border-white/5 
      transition-all duration-500

      ${!disabled ? "hover:scale-[1.02] hover:bg-slate-800 cursor-pointer" : "cursor-default"}
      ${isRevealed ? "opacity-100" : "opacity-90"}
      `}
    >
      {/* CENTER CONTENT */}
      <div className="flex flex-col items-center justify-center text-center mt-5">

        {/* Channel Logo */}
        <div className="relative mb-3 sm:mb-5 md:mb-6">
          <img
            src={channel?.thumbnail}
            alt={channel?.name}
            className={`w-16 h-16 sm:w-28 sm:h-28 md:w-40 md:h-40 
            rounded-full object-cover 
            border-2 sm:border-3 md:border-4 
            ${accentColor} 
            shadow-lg sm:shadow-xl md:shadow-2xl`}
          />
        </div>

        {/* Channel Name */}
        <h3 className="text-sm sm:text-lg md:text-3xl font-black text-center uppercase tracking-tight leading-tight px-2">
          {channel?.name}
        </h3>

        {/* Subscriber Count */}
        <div
          className={`mt-3 sm:mt-4 md:mt-6 transition-all duration-700 transform ${
            isRevealed ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
        >
          <div className="text-lg sm:text-3xl md:text-5xl font-black text-amber-400 tabular-nums text-center">
            {channel?.subs.toLocaleString()}
          </div>

          <div className="text-[9px] sm:text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-[0.2em] sm:tracking-[0.3em] mt-1">
            Subscribers
          </div>
        </div>

      </div>
    </button>
  );
}