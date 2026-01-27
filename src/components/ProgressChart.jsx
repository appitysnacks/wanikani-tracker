import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import styles from './ProgressChart.module.css';

function calculateProjection(levelTimeline, currentLevel) {
  if (levelTimeline.length < 2) return null;

  // Calculate time spent on each completed level
  const levelDurations = [];
  for (let i = 1; i < levelTimeline.length; i++) {
    const prev = levelTimeline[i - 1];
    const curr = levelTimeline[i];
    const daysSpent = (curr.startedAt - prev.startedAt) / (1000 * 60 * 60 * 24);
    if (daysSpent > 0 && daysSpent < 365) { // Filter out unreasonable values
      levelDurations.push(daysSpent);
    }
  }

  if (levelDurations.length === 0) return null;

  // Calculate average days per level
  const avgDaysPerLevel = levelDurations.reduce((a, b) => a + b, 0) / levelDurations.length;

  // Calculate median for comparison (more robust to outliers)
  const sorted = [...levelDurations].sort((a, b) => a - b);
  const medianDaysPerLevel = sorted[Math.floor(sorted.length / 2)];

  const levelsRemaining = 60 - currentLevel;
  const lastDataPoint = levelTimeline[levelTimeline.length - 1];
  const projectionStart = lastDataPoint.startedAt.getTime();

  // Generate projection points using average
  const projectionData = [];
  for (let i = 0; i <= levelsRemaining; i++) {
    const projectedDate = projectionStart + (i * avgDaysPerLevel * 24 * 60 * 60 * 1000);
    projectionData.push({
      level: currentLevel + i,
      date: projectedDate,
      isProjection: true,
    });
  }

  const estimatedCompletionDate = new Date(projectionStart + (levelsRemaining * avgDaysPerLevel * 24 * 60 * 60 * 1000));
  const estimatedCompletionDateMedian = new Date(projectionStart + (levelsRemaining * medianDaysPerLevel * 24 * 60 * 60 * 1000));

  return {
    projectionData,
    avgDaysPerLevel,
    medianDaysPerLevel,
    estimatedCompletionDate,
    estimatedCompletionDateMedian,
    levelsRemaining,
  };
}

export function ProgressChart({ levelTimeline, currentLevel }) {
  const [showProjection, setShowProjection] = useState(true);

  if (!levelTimeline || levelTimeline.length === 0) {
    return (
      <div className={styles.container}>
        <h3 className={styles.title}>Level Progression</h3>
        <p className={styles.empty}>No level data available yet</p>
      </div>
    );
  }

  const actualData = levelTimeline.map((lp) => ({
    level: lp.level,
    date: lp.startedAt.getTime(),
  }));

  const projection = calculateProjection(levelTimeline, currentLevel || levelTimeline[levelTimeline.length - 1].level);

  // Combine actual and projection data for the chart
  let combinedData = actualData.map(d => ({ ...d, actualLevel: d.level }));

  if (projection && showProjection) {
    // Add projection data points
    const projectionPoints = projection.projectionData.map(d => ({
      date: d.date,
      projectedLevel: d.level,
    }));

    // Merge datasets by date
    const allDates = new Set([
      ...combinedData.map(d => d.date),
      ...projectionPoints.map(d => d.date),
    ]);

    combinedData = Array.from(allDates).sort((a, b) => a - b).map(date => {
      const actual = combinedData.find(d => d.date === date);
      const projected = projectionPoints.find(d => d.date === date);
      return {
        date,
        actualLevel: actual?.actualLevel,
        projectedLevel: projected?.projectedLevel,
      };
    });
  }

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Generate quarterly ticks for X-axis
  const generateQuarterlyTicks = () => {
    const allDates = combinedData.map(d => d.date);
    const minDate = Math.min(...allDates);
    const maxDate = Math.max(...allDates);

    const ticks = [];
    const startDate = new Date(minDate);
    const endDate = new Date(maxDate);

    // Start from the first quarter boundary before or at minDate
    const quarterMonths = [0, 3, 6, 9]; // Jan, Apr, Jul, Oct
    let currentYear = startDate.getFullYear();
    let currentQuarterIdx = quarterMonths.findIndex(m => m >= startDate.getMonth());
    if (currentQuarterIdx === -1) {
      currentQuarterIdx = 0;
      currentYear++;
    }

    while (true) {
      const tickDate = new Date(currentYear, quarterMonths[currentQuarterIdx], 1);
      const tickTime = tickDate.getTime();

      if (tickTime > maxDate) break;
      if (tickTime >= minDate) {
        ticks.push(tickTime);
      }

      currentQuarterIdx++;
      if (currentQuarterIdx >= 4) {
        currentQuarterIdx = 0;
        currentYear++;
      }
    }

    return ticks;
  };

  const formatQuarter = (timestamp) => {
    const date = new Date(timestamp);
    const months = ['Jan', 'Apr', 'Jul', 'Oct'];
    const monthIdx = Math.floor(date.getMonth() / 3);
    const year = date.getFullYear().toString().slice(-2);
    return `${months[monthIdx]} '${year}`;
  };

  // Generate Y-axis ticks for levels 1-60 (every 5 levels for readability)
  const levelTicks = [1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Level Progression</h3>
        {projection && (
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={showProjection}
              onChange={(e) => setShowProjection(e.target.checked)}
            />
            Show projection
          </label>
        )}
      </div>

      <div className={styles.chartWrapper}>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={combinedData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis
              dataKey="date"
              type="number"
              domain={['dataMin', 'dataMax']}
              ticks={generateQuarterlyTicks()}
              tickFormatter={formatQuarter}
              stroke="#888"
              fontSize={11}
              angle={-45}
              textAnchor="end"
              height={50}
            />
            <YAxis
              domain={[1, 60]}
              ticks={levelTicks}
              stroke="#888"
              fontSize={11}
              width={40}
            />
            <Tooltip
              labelFormatter={formatDate}
              formatter={(value, name) => {
                if (name === 'actualLevel') return [`Level ${value}`, 'Actual'];
                if (name === 'projectedLevel') return [`Level ${value}`, 'Projected'];
                return [value, name];
              }}
              contentStyle={{
                borderRadius: '8px',
                border: 'none',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              }}
            />
            <ReferenceLine y={60} stroke="#00aa55" strokeDasharray="5 5" label={{ value: 'Level 60', position: 'right', fill: '#00aa55', fontSize: 12 }} />
            <Line
              type="stepAfter"
              dataKey="actualLevel"
              stroke="#aa00ff"
              strokeWidth={2}
              dot={{ fill: '#aa00ff', strokeWidth: 0, r: 4 }}
              activeDot={{ r: 6, fill: '#aa00ff' }}
              connectNulls={false}
            />
            {showProjection && projection && (
              <Line
                type="linear"
                dataKey="projectedLevel"
                stroke="#00aaff"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                activeDot={{ r: 6, fill: '#00aaff' }}
                connectNulls={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}
