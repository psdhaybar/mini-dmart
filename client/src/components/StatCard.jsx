const StatCard = ({ icon, label, value, hint }) => (
  <div className="stat-card">
    <div className="stat-icon">{icon}</div>
    <div><span>{label}</span><strong>{value}</strong>{hint && <small>{hint}</small>}</div>
  </div>
);
export default StatCard;
