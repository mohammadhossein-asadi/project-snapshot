import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Flame,
  Zap,
  TrendingUp,
  GitCommit,
  Plus,
  Minus,
} from 'lucide-react';
import { ScannedFile, GitInfo } from '../types';
import { generateActivityData, DayActivity } from '../lib/activityTimeline';

interface ActivityHeatmapProps {
  files: ScannedFile[];
  gitInfo?: GitInfo;
}

const LEVEL_COLORS: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: 'bg-slate-800/60 border-slate-750 hover:border-slate-600',
  1: 'bg-emerald-950/80 border-emerald-800 text-emerald-300 hover:border-emerald-500',
  2: 'bg-emerald-800 border-emerald-600 text-emerald-200 hover:border-emerald-400',
  3: 'bg-emerald-600 border-emerald-500 text-white hover:border-emerald-300',
  4: 'bg-emerald-400 border-emerald-300 text-slate-950 font-bold hover:border-white shadow-sm shadow-emerald-400/20',
};

export const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({ files, gitInfo }) => {
  const [weeksRange, setWeeksRange] = useState<number>(16); // 16 weeks (~4 months)
  const [hoveredDay, setHoveredDay] = useState<DayActivity | null>(null);
  const [selectedDay, setSelectedDay] = useState<DayActivity | null>(null);

  const daysBack = weeksRange * 7;

  const activityData = useMemo(() => {
    return generateActivityData(files, gitInfo, daysBack);
  }, [files, gitInfo, daysBack]);

  const activeFocus = hoveredDay || selectedDay;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col gap-4">
      {/* Header Bar */}
      <div className="flex items-center justify-between flex-wrap gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Git Activity Timeline & Contribution Matrix
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 font-mono border border-emerald-500/20 font-semibold">
                Daily Commit Heatmap
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Visualizes daily codebase modifications, commit frequencies, and development momentum
            </p>
          </div>
        </div>

        {/* Timeframe Selector */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
          {[
            { label: '8 Weeks', weeks: 8 },
            { label: '16 Weeks', weeks: 16 },
            { label: '24 Weeks', weeks: 24 },
          ].map((tf) => (
            <button
              key={tf.weeks}
              onClick={() => setWeeksRange(tf.weeks)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                weeksRange === tf.weeks
                  ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3 flex flex-col justify-between">
          <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider flex items-center gap-1">
            <GitCommit className="w-3.5 h-3.5 text-blue-400" />
            Contributions
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-white">
              {activityData.totalContributions}
            </span>
            <span className="text-[10px] text-slate-400">commits in range</span>
          </div>
        </div>

        <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3 flex flex-col justify-between">
          <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            Current Streak
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-amber-300">
              {activityData.currentStreak} {activityData.currentStreak === 1 ? 'day' : 'days'}
            </span>
            <span className="text-[10px] text-slate-400">active</span>
          </div>
        </div>

        <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3 flex flex-col justify-between">
          <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            Longest Streak
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-emerald-300">
              {activityData.longestStreak} {activityData.longestStreak === 1 ? 'day' : 'days'}
            </span>
            <span className="text-[10px] text-slate-400">record</span>
          </div>
        </div>

        <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3 flex flex-col justify-between">
          <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            Peak Day
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-indigo-300">
              {activityData.busiestDay ? `${activityData.busiestDay.count} commits` : '0 commits'}
            </span>
            {activityData.busiestDay && (
              <span className="text-[10px] text-slate-400 truncate">
                ({activityData.busiestDay.date.substring(5)})
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Heatmap Matrix Display */}
      <div className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-4 overflow-x-auto">
        <div className="min-w-[640px] flex flex-col gap-2">
          {/* Day of Week Row + Weeks Grid */}
          <div className="flex gap-2">
            {/* Day Labels (Mon, Wed, Fri) */}
            <div className="flex flex-col justify-between text-[10px] font-mono text-slate-400 pr-1 select-none pt-0.5 h-[108px]">
              <div className="h-3">Mon</div>
              <div className="h-3">Wed</div>
              <div className="h-3">Fri</div>
            </div>

            {/* Weeks Columns */}
            <div className="flex gap-1.5 flex-1">
              {activityData.weeks.map((week, wIdx) => (
                <div key={wIdx} className="flex flex-col gap-1.5 flex-1">
                  {week.map((day) => {
                    const isHovered = hoveredDay?.date === day.date;
                    const isSelected = selectedDay?.date === day.date;

                    return (
                      <div
                        key={day.date}
                        onMouseEnter={() => setHoveredDay(day)}
                        onMouseLeave={() => setHoveredDay(null)}
                        onClick={() => setSelectedDay(day)}
                        className={`h-3 rounded-[3px] border transition-all duration-150 cursor-pointer relative ${
                          LEVEL_COLORS[day.level]
                        } ${
                          isSelected
                            ? 'ring-2 ring-white scale-110 z-10'
                            : isHovered
                            ? 'scale-125 z-10'
                            : ''
                        }`}
                        title={`${day.date}: ${day.count} contributions`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Legend & Details Footer */}
          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-900 flex-wrap gap-2">
            <div className="flex items-center gap-1.5 text-[11px] font-mono">
              <span className="text-slate-400">Less</span>
              <span className="w-2.5 h-2.5 rounded-[2px] bg-slate-800 border border-slate-700" />
              <span className="w-2.5 h-2.5 rounded-[2px] bg-emerald-950 border border-emerald-800" />
              <span className="w-2.5 h-2.5 rounded-[2px] bg-emerald-800 border border-emerald-600" />
              <span className="w-2.5 h-2.5 rounded-[2px] bg-emerald-600 border border-emerald-500" />
              <span className="w-2.5 h-2.5 rounded-[2px] bg-emerald-400 border border-emerald-300" />
              <span className="text-slate-400">More</span>
            </div>

            <div className="text-[11px] font-mono text-slate-400">
              Showing active commit cadence across {weeksRange} calendar weeks
            </div>
          </div>
        </div>
      </div>

      {/* Active Day Detail Inspection Drawer */}
      {activeFocus && (
        <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs animate-in fade-in duration-150">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-semibold text-white font-mono">
                {new Date(activeFocus.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
              <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-500/10 text-emerald-400 font-mono font-medium border border-emerald-500/20">
                {activeFocus.count} {activeFocus.count === 1 ? 'commit' : 'commits'}
              </span>
            </div>

            {activeFocus.commits.length > 0 ? (
              <div className="text-[11px] text-slate-300 flex items-center gap-2 truncate max-w-lg">
                <GitCommit className="w-3 h-3 text-slate-500 shrink-0" />
                <span className="truncate">{activeFocus.commits[0].message}</span>
                <span className="text-slate-400">by {activeFocus.commits[0].author}</span>
              </div>
            ) : (
              <p className="text-[11px] text-slate-400">No code commits recorded on this date.</p>
            )}
          </div>

          <div className="flex items-center gap-3 font-mono text-xs shrink-0">
            <span className="text-emerald-400 flex items-center gap-0.5">
              <Plus className="w-3 h-3" />
              {activeFocus.insertions} lines
            </span>
            <span className="text-rose-400 flex items-center gap-0.5">
              <Minus className="w-3 h-3" />
              {activeFocus.deletions} lines
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityHeatmap;
