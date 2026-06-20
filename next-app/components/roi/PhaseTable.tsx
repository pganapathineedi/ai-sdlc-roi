import type { PhaseConfig, RoiParams } from '@/lib/types';

interface Props {
  phases: PhaseConfig[];
  params: RoiParams;
  fm: (n: number) => string;
}

export default function PhaseTable({ phases, params, fm }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Phase</th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Effort %</th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">AI reduction</th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Time saved</th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Annual $ saving</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Key tools</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {phases.map((ph) => {
            const phaseSaving = ph.pct * params.fte * ph.aiR * params.adopt * (1 - params.overhead) * params.rate;
            return (
              <tr key={ph.name} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{ph.name}</td>
                <td className="px-4 py-3 text-right text-gray-600">{Math.round(ph.pct * 100)}%</td>
                <td className="px-4 py-3 text-right">
                  <span className="inline-block bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded-full">
                    {Math.round(ph.aiR * 100)}%
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-gray-600">{ph.time}%</td>
                <td className="px-4 py-3 text-right font-medium text-gray-900 hidden sm:table-cell">{fm(phaseSaving)}</td>
                <td className="px-4 py-3 text-gray-500 text-xs hidden md:table-cell">{ph.tools}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
