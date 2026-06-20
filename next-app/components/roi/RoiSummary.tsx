import type { RoiResult, RoiParams } from '@/lib/types';

interface Props {
  roi: RoiResult;
  params: RoiParams;
  fk: (n: number) => string;
  fm: (n: number) => string;
}

export default function RoiSummary({ roi, params, fk }: Props) {
  const cards = [
    {
      label: 'Gross annual saving',
      value: fk(roi.grossSaving),
      sub: roi.fteSaved + ' FTE equivalent',
      color: 'text-green-600',
      bg: 'bg-green-50 border-green-100',
    },
    {
      label: 'Annual AI cost',
      value: fk(roi.totalCost),
      sub: fk(Math.round(roi.totalCost / params.fte)) + ' per FTE',
      color: 'text-blue-600',
      bg: 'bg-blue-50 border-blue-100',
    },
    {
      label: 'Net annual benefit',
      value: fk(roi.netBenefit),
      sub: roi.roiMultiple + 'x ROI multiple',
      color: roi.netBenefit >= 0 ? 'text-emerald-700' : 'text-red-600',
      bg: roi.netBenefit >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100',
    },
    {
      label: 'Payback period',
      value: roi.paybackMonths !== null ? '~' + Math.ceil(roi.paybackMonths) + ' mo' : 'No payback',
      sub: 'from training one-off',
      color: 'text-purple-600',
      bg: 'bg-purple-50 border-purple-100',
    },
    {
      label: 'Avg effort reduction',
      value: Math.round(roi.avgEffortReduction * 100) + '%',
      sub: 'across all SDLC phases',
      color: 'text-orange-600',
      bg: 'bg-orange-50 border-orange-100',
    },
    {
      label: 'Team size',
      value: params.fte + ' FTE',
      sub: Math.round(params.adopt * 100) + '% AI adoption',
      color: 'text-gray-700',
      bg: 'bg-gray-50 border-gray-200',
    },
  ];

  return (
    <section>
      <h2 className="text-base font-semibold text-gray-900 mb-4">Executive summary</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {cards.map((card) => (
          <div key={card.label} className={'rounded-xl border p-4 ' + card.bg}>
            <div className={'text-2xl font-bold ' + card.color}>{card.value}</div>
            <div className="text-xs font-medium text-gray-700 mt-1">{card.label}</div>
            <div className="text-xs text-gray-500 mt-0.5">{card.sub}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
