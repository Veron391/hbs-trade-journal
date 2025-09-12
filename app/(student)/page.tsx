import ProtectedRoute from '../components/layout/ProtectedRoute';
import TradeList from '../components/forms/TradeList';

export default function Home() {
  return (
    <ProtectedRoute>
      <div className="py-6 rounded-20 p-6">
        <div className="mb-8"></div>
        <div className="rounded-20 p-2">
          <TradeList />
        </div>
      </div>
    </ProtectedRoute>
  );
}
