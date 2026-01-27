'use client';

import { FC, useState } from 'react';
import { usePrivacyScore } from '@/hooks/usePrivacyScore';
import { getPrivacyLevel } from '@/lib/utils';

export const PrivacyScore: FC = () => {
  const { score, loading } = usePrivacyScore();
  const [showAllExposed, setShowAllExposed] = useState(false);
  const [showAllProtected, setShowAllProtected] = useState(false);

  if (loading || !score) {
    return (
      <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl">
        <div className="flex items-center justify-center h-32">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const privacyLevel = getPrivacyLevel(score.score);

  return (
    <div className="p-6 bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-xl">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold">Privacy Score</h3>
        <div className="text-right">
          <div className={`text-3xl font-bold ${privacyLevel.color}`}>{score.score}</div>
          <div className="text-sm text-zinc-400">out of 100</div>
        </div>
      </div>

      {/* Score Bar */}
      <div className="mb-6">
        <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
            style={{ width: `${score.score}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs text-zinc-500">
          <span>0</span>
          <span>25</span>
          <span>50</span>
          <span>75</span>
          <span>100</span>
        </div>
      </div>

      {/* Status */}
      <div className="p-4 bg-zinc-900/50 rounded-lg mb-6">
        <div className={`text-lg font-semibold ${privacyLevel.color} mb-1`}>
          {privacyLevel.level} Privacy
        </div>
        <p className="text-sm text-zinc-400">{privacyLevel.description}</p>
      </div>

      {/* Data Points */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {/* Exposed Data */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-red-400 flex items-center gap-2">
            <span>⚠️</span>
            Exposed ({score.exposedDataPoints.length})
          </h4>
          <div className="space-y-1">
            {(showAllExposed ? score.exposedDataPoints : score.exposedDataPoints.slice(0, 3)).map((point, i) => (
              <div key={i} className="text-xs text-zinc-400 pl-6">
                • {point}
              </div>
            ))}
            {score.exposedDataPoints.length > 3 && (
              <button
                onClick={() => setShowAllExposed(!showAllExposed)}
                className="text-xs text-purple-400 hover:text-purple-300 pl-6 transition-colors"
              >
                {showAllExposed ? '− Show less' : `+${score.exposedDataPoints.length - 3} more`}
              </button>
            )}
          </div>
        </div>

        {/* Protected Data */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-green-400 flex items-center gap-2">
            <span>🛡️</span>
            Protected ({score.protectedDataPoints.length})
          </h4>
          <div className="space-y-1">
            {(showAllProtected ? score.protectedDataPoints : score.protectedDataPoints.slice(0, 3)).map((point, i) => (
              <div key={i} className="text-xs text-zinc-400 pl-6">
                • {point}
              </div>
            ))}
            {score.protectedDataPoints.length > 3 && (
              <button
                onClick={() => setShowAllProtected(!showAllProtected)}
                className="text-xs text-purple-400 hover:text-purple-300 pl-6 transition-colors"
              >
                {showAllProtected ? '− Show less' : `+${score.protectedDataPoints.length - 3} more`}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {score.recommendations.length > 0 && (
        <div className="pt-4 border-t border-zinc-800">
          <h4 className="text-sm font-semibold text-purple-400 mb-3">Recommendations</h4>
          <div className="space-y-2">
            {score.recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-zinc-400">
                <span className="text-purple-500 mt-0.5">→</span>
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
