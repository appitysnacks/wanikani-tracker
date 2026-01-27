import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import styles from './SrsBreakdown.module.css';

const SRS_COLORS = {
  'Apprentice 1': '#FF0080',
  'Apprentice 2': '#FF0080',
  'Apprentice 3': '#FF0080',
  'Apprentice 4': '#FF0080',
  'Guru 1': '#9B59B6',
  'Guru 2': '#9B59B6',
  'Master': '#5AC8FA',
  'Enlightened': '#00AAFF',
  'Burned': '#7A7A7A',
};

const CATEGORY_COLORS = {
  apprentice: '#FF0080',
  guru: '#9B59B6',
  master: '#5AC8FA',
  enlightened: '#00AAFF',
  burned: '#7A7A7A',
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
              label={({ name, percent, cx, cy, midAngle, outerRadius }) => {
                const RADIAN = Math.PI / 180;
                const radius = outerRadius + 25;
                const x = cx + radius * Math.cos(-midAngle * RADIAN);
                const y = cy + radius * Math.sin(-midAngle * RADIAN);
                return (
                  <text
                    x={x}
                    y={y}
                    fill="#E8E8E8"
                    textAnchor={x > cx ? 'start' : 'end'}
                    dominantBaseline="central"
                    fontSize={12}
                  >
                    {`${name} ${(percent * 100).toFixed(0)}%`}
                  </text>
                );
              }}
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
                boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                background: '#3D3D3D',
                color: '#E8E8E8',
              }}
              labelStyle={{ color: '#9A9A9A' }}
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
