import { SparkleIcon } from './icons';

export default function AIBadge({ label = 'AI' }: { label?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold text-white"
      style={{ background: 'linear-gradient(135deg, #7B61FF 0%, #4FD1C5 100%)' }}
    >
      <SparkleIcon className="w-3 h-3" />
      {label}
    </span>
  );
}
