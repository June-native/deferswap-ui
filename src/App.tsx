import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PoolSelectorPage from './pages/PoolSelectorPage';
import SwapDashboardPage from './pages/SwapDashboardPage';

// function App() {
//   return <SwapDashboardPage />;
// }

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PoolSelectorPage />} />
        <Route path="/swap" element={<SwapDashboardPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
