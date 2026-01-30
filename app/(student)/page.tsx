import ProtectedRoute from '../components/layout/ProtectedRoute';
import TradeList from '../components/forms/TradeList';

export default function Home() {
  return (
    <ProtectedRoute>
      <div className="py-4 sm:py-6 w-full max-w-none px-0">
        <div className="mb-4 sm:mb-6" />
        <div className="w-full">
          <TradeList />
        </div>
      </div>
    </ProtectedRoute>
  );
}
