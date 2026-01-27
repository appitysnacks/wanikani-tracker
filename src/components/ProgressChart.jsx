import { useState, useMemo } from 'react';
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from 'recharts';

// JLPT level ranges mapped to WaniKani levels
const JLPT_LEVELS = [
  { name: 'N5', label: 'Beginner', y1: 1, y2: 10, color: '#FF0080' },
  { name: 'N4', label: 'Elementary', y1: 10, y2: 20, color: '#9B59B6' },
  { name: 'N3', label: 'Intermediate', y1: 20, y2: 30, color: '#5AC8FA' },
  { name: 'N2', label: 'Pre-Advanced', y1: 30, y2: 50, color: '#00AAFF' },
  { name: 'N1', label: 'Advanced', y1: 50, y2: 60, color: '#00D68F' },
];
import styles from './ProgressChart.module.css';

function analyzeProgress(levelTimeline, currentLevel) {
  if (levelTimeline.length < 2) return null;

  const levelData = [];
  let totalDays = 0;
  let fastestLevel = { level: 0, days: Infinity };
  let slowestLevel = { level: 0, days: 0 };

  for (let i = 1; i < levelTimeline.length; i++) {
    const prev = levelTimeline[i - 1];
    const curr = levelTimeline[i];
    const daysSpent = (curr.startedAt - prev.startedAt) / (1000 * 60 * 60 * 24);

    if (daysSpent > 0 && daysSpent < 365) {
      totalDays += daysSpent;
      levelData.push({
        level: prev.level,
        days: daysSpent,
        date: prev.startedAt.getTime(),
      });

      if (daysSpent < fastestLevel.days) {
        fastestLevel = { level: prev.level, days: daysSpent };
      }
      if (daysSpent > slowestLevel.days) {
        slowestLevel = { level: prev.level, days: daysSpent };
      }
    }
  }

  if (levelData.length === 0) return null;

  const avgDaysPerLevel = totalDays / levelData.length;
  const levelsRemaining = 60 - currentLevel;
  const startDate = levelTimeline[0].startedAt.getTime();
  const lastDataPoint = levelTimeline[levelTimeline.length - 1];
  const projectionStart = lastDataPoint.startedAt.getTime();

  // Calculate estimated completion
  const estimatedCompletionDate = new Date(
    projectionStart + levelsRemaining * avgDaysPerLevel * 24 * 60 * 60 * 1000
  );

  // Generate projection points
  const projectionData = [];
  for (let i = 0; i <= levelsRemaining; i++) {
    const projectedDate = projectionStart + i * avgDaysPerLevel * 24 * 60 * 60 * 1000;
    projectionData.push({
      level: currentLevel + i,
      date: projectedDate,
    });
  }

  // Calculate "ideal pace" line (straight line from start to level 60 at average pace)
  const idealEndDate = startDate + 60 * avgDaysPerLevel * 24 * 60 * 60 * 1000;

  return {
    levelData,
    avgDaysPerLevel,
    fastestLevel,
    slowestLevel,
    totalDays,
    levelsRemaining,
    estimatedCompletionDate,
    projectionData,
    startDate,
    idealEndDate,
  };
}

export function ProgressChart({ levelTimeline, currentLevel }) {
  const [showProjection, setShowProjection] = useState(true);

  const analysis = useMemo(() => {
    return analyzeProgress(levelTimeline, currentLevel || levelTimeline?.[levelTimeline.length - 1]?.level || 1);
  }, [levelTimeline, currentLevel]);

  if (!levelTimeline || levelTimeline.length === 0) {
    return (
      <div className={styles.container}>
        <h3 className={styles.title}>Level Progression</h3>
        <p className={styles.empty}>No level data available yet</p>
      </div>
    );
  }

  // Build chart data with days per level for coloring
  const chartData = levelTimeline.map((lp, i) => {
    const nextLevel = levelTimeline[i + 1];
    const daysToNext = nextLevel
      ? (nextLevel.startedAt - lp.startedAt) / (1000 * 60 * 60 * 24)
      : null;

    return {
      date: lp.startedAt.getTime(),
      level: lp.level,
      daysToNext: daysToNext,
    };
  });

  // Add projection data
  let projectionData = [];
  if (analysis && showProjection) {
    projectionData = analysis.projectionData.map(d => ({
      date: d.date,
      projectedLevel: d.level,
    }));
  }

  // Merge actual and projection
  const allDates = new Set([
    ...chartData.map(d => d.date),
    ...projectionData.map(d => d.date),
  ]);

  const combinedData = Array.from(allDates)
    .sort((a, b) => a - b)
    .map(date => {
      const actual = chartData.find(d => d.date === date);
      const projected = projectionData.find(d => d.date === date);
      return {
        date,
        level: actual?.level,
        daysToNext: actual?.daysToNext,
        projectedLevel: projected?.projectedLevel,
      };
    });

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatMonth = (timestamp) => {
    const date = new Date(timestamp);
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const year = date.getFullYear().toString().slice(-2);
    return `${month} '${year}`;
  };

  // Generate ticks every 6 months
  const generateTicks = () => {
    const dates = combinedData.map(d => d.date);
    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);

    const ticks = [];
    const start = new Date(minDate);
    start.setDate(1);
    start.setMonth(Math.floor(start.getMonth() / 6) * 6);

    while (start.getTime() <= maxDate) {
      if (start.getTime() >= minDate) {
        ticks.push(start.getTime());
      }
      start.setMonth(start.getMonth() + 6);
    }

    return ticks;
  };

  const today = new Date().getTime();
  const levelTicks = [1, 10, 20, 30, 40, 50, 60];

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0]?.payload;
    const isProjection = data?.projectedLevel && !data?.level;

    return (
      <div className={styles.tooltip}>
        <div className={styles.tooltipDate}>{formatDate(label)}</div>
        {data?.level && (
          <>
            <div className={styles.tooltipLevel}>Level {data.level}</div>
            {data.daysToNext && (
              <div className={styles.tooltipDays}>
                {data.daysToNext.toFixed(1)} days to next level
              </div>
            )}
          </>
        )}
        {isProjection && (
          <div className={styles.tooltipProjection}>
            Projected: Level {data.projectedLevel}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>Level Progression</h3>
          {analysis && (
            <p className={styles.subtitle}>
              {analysis.totalDays.toFixed(0)} days total · {analysis.avgDaysPerLevel.toFixed(1)} days avg per level
            </p>
          )}
        </div>
        {analysis && (
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={showProjection}
              onChange={(e) => setShowProjection(e.target.checked)}
            />
            Projection
          </label>
        )}
      </div>

      <div className={styles.chartWrapper}>
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={combinedData} margin={{ top: 20, right: 35, left: 0, bottom: 20 }}>
            <XAxis
              dataKey="date"
              type="number"
              domain={['dataMin', 'dataMax']}
              ticks={generateTicks()}
              tickFormatter={formatMonth}
              stroke="#999"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#AAA' }}
              tick={{ fill: '#555' }}
            />
            <YAxis
              domain={[1, 60]}
              ticks={levelTicks}
              stroke="#999"
              fontSize={11}
              width={35}
              tickLine={false}
              axisLine={{ stroke: '#AAA' }}
              tick={{ fill: '#555' }}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* JLPT level bands */}
            {JLPT_LEVELS.map((jlpt) => (
              <ReferenceArea
                key={jlpt.name}
                y1={jlpt.y1}
                y2={jlpt.y2}
                fill={jlpt.color}
                fillOpacity={0.35}
                stroke="none"
                label={{
                  value: jlpt.name,
                  position: 'insideRight',
                  fill: '#333',
                  fontSize: 11,
                  fontWeight: 700,
                }}
              />
            ))}

            {/* Level 60 goal line */}
            <ReferenceLine y={60} stroke="#444" strokeWidth={1} />

            {/* Today marker */}
            <ReferenceLine
              x={today}
              stroke="#FF9500"
              strokeWidth={1}
              strokeDasharray="3 3"
            />

            {/* Projection area fill */}
            {showProjection && analysis && (
              <Area
                type="linear"
                dataKey="projectedLevel"
                stroke="none"
                fill="#00AAFF"
                fillOpacity={0.1}
                connectNulls={false}
              />
            )}

            {/* Projection line */}
            {showProjection && analysis && (
              <Line
                type="linear"
                dataKey="projectedLevel"
                stroke="#00AAFF"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
                connectNulls={false}
              />
            )}

            {/* Actual progress line */}
            <Line
              type="stepAfter"
              dataKey="level"
              stroke="#00AAFF"
              strokeWidth={2}
              dot={{ fill: '#00AAFF', strokeWidth: 0, r: 3 }}
              activeDot={{ r: 5, fill: '#5AC8FA' }}
              connectNulls={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* JLPT legend */}
      <div className={styles.jlptLegend}>
        {JLPT_LEVELS.map((jlpt) => (
          <span key={jlpt.name} className={styles.jlptItem}>
            <span className={styles.jlptDot} style={{ background: jlpt.color }} />
            <span className={styles.jlptName}>{jlpt.name}</span>
            <span className={styles.jlptLabel}>{jlpt.label}</span>
          </span>
        ))}
      </div>

    </div>
  );
}
