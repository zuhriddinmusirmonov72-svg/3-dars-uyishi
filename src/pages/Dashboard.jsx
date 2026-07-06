import { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { FaUserGraduate, FaUsers, FaCreditCard, FaUserTimes, FaPauseCircle, FaArchive, FaChevronDown } from 'react-icons/fa';

const StatCard = ({ icon, title, value }) => (
  <div className="stat-card">
    <div className="stat-icon">
      {icon}
    </div>
    <p className="stat-title">{title}</p>
    <h3 className="stat-value">{value}</h3>
  </div>
);

const Accordion = ({ title }) => (
  <div className="accordion">
    <span className="accordion-title">{title}</span>
    <FaChevronDown className="accordion-icon" />
  </div>
);

const Dashboard = () => {
  const { user, t } = useContext(AppContext);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">{t.hello}, {user.name}!</h1>
        <p className="page-subtitle">{t.welcomeTo}</p>
      </div>

      <div className="stats-grid">
        <StatCard icon={<FaUserGraduate size={24} />} title={t.activeStudents} value="52" />
        <StatCard icon={<FaUsers size={24} />} title={t.groupsCount} value="23" />
        <StatCard icon={<FaCreditCard size={24} />} title={t.monthlyPayments} value="0" />
        <StatCard icon={<FaUserTimes size={24} />} title={t.debtors} value="104" />
        <StatCard icon={<FaPauseCircle size={24} />} title={t.frozen} value="0" />
        <StatCard icon={<FaArchive size={24} />} title={t.archived} value="23" />
      </div>

      <div style={{ width: '100%' }}>
        <Accordion title={t.currentMonthPayments} />
        <Accordion title={t.annualProfit} />
        <Accordion title={t.schedule} />
      </div>
    </div>
  );
};

export default Dashboard;
