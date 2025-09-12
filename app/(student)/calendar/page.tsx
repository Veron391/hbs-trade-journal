import TradeCalendar from '../../components/forms/TradeCalendar';
import ProtectedRoute from '../../components/layout/ProtectedRoute';

export default function CalendarPage() {
  return (
    <ProtectedRoute>
      <div className="py-6">
        <h1 className="text-2xl font-bold mb-8 text-white">Trade Calendar</h1>
        <TradeCalendar />
      </div>
    </ProtectedRoute>
  );
} 