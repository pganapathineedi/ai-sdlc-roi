import type { PhaseConfig, ModelDef, RoiParams } from '@/lib/types';
import { calcRoi } from '@/lib/calculations';

interface Props {
  params: RoiParams;
  phases: PhaseConfig[];
  models: ModelDef[];
  annualCost: number;
  fk: (n: number) => string;
}

export default function MaturityCards({ params, phases, models, annualCost, fk }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {models.map((model, i) => {
        const p = { ...params, level: i };
        const roi = calcRoi(p, phases, annualCost * model.saasScale);
        const isRec = model.rec;
        return (
          <div
            key={model.name}
            style={{ borderColor: isRec ? model.color : undefined }}
            className={'rounded-xl border-2 p-4 ' + (isRec ? '' : 'border-gray-200 bg-white')}
          >
            {isRec && (
              <div
                className="text-xs font-bold uppercase tracking-wide mb-1"
                style={{ color: model.color }}
              >
                Recommended
              </div>
            )}
            <div className="font-bold text-gray-900">{model.name}</div>
            <div className="text-xs text-gray-500 mb-3">{model.label}</div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Gross saving</span>
                <span className="font-semibold text-green-700">{fk(roi.grossSaving)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">AI cost</span>
                <span className="font-semibold text-blue-700">{fk(roi.totalCost)}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-gray-100 pt-1 mt-1">
                <span className="text-gray-500">Net</span>
                <span className={'font-bold ' + (roi.netBenefit >= 0 ? 'text-emerald-700' : 'text-red-600')}>
                  {fk(roi.netBenefit)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">ROI</span>
                <span className="font-semibold text-gray-800">{roi.roiMultiple}x</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
