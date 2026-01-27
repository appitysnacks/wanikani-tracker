import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import styles from './SrsBreakdown.module.css';

const SRS_COLORS = {
  'Apprentice 1': '#ff00aa',
  'Apprentice 2': '#ff00aa',
  'Apprentice 3': '#ff00aa',
  'Apprentice 4': '#ff00aa',
  'Guru 1': '#aa00ff',
  'Guru 2': '#aa00ff',
  'Master': '#0088ff',
  'Enlightened': '#00aaff',
  'Burned': '#444',
};

const CATEGORY_COLORS = {
  apprentice: '#ff00aa',
  guru: '#aa00ff',
  master: '#0088ff',
  enlightened: '#00aaff',
  burned: '#444',
};

export function SrsBreakdown({ categoryTotals }) {
  const data = Object.entries(categoryTotals)
    .filter(([, count]) => count > 0)
    .map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: CATEGORY_COLORS[name],
    }));

  if (data.length === 0) {
    return (
      <div className={styles.container}>
        <h3 className={styles.title}>SRS Breakdown</h3>
        <p className={styles.empty}>No items in progress yet</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>SRS Breakdown</h3>
      <div className={styles.chartWrapper}>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
              label={({ name, percent }) =>
                `${name} ${(percent * 100).toFixed(0)}%`
              }
              labelLine={false}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => [value, 'Items']}
              contentStyle={{
                borderRadius: '8px',
                border: 'none',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className={styles.legend}>
        {data.map((item) => (
          <div key={item.name} className={styles.legendItem}>
            <span
              className={styles.legendDot}
              style={{ background: item.color }}
            />
            <span className={styles.legendLabel}>{item.name}</span>
            <span className={styles.legendValue}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
