import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PoolSelectorPage from './pages/PoolSelectorPage';
import SwapDashboardPage from './pages/SwapDashboardPage';
import SwapMMPage from './pages/SwapMMPage';
import SwapMMPageV2 from './pages/SwapMMPageV2';
import DeployPoolPage from './pages/DeployPoolPage';
import TakerDashboardPage from './pages/TakerDashboardPage';
import LimitOrderPoolSelectorPage from './pages/LimitOrderPoolSelectorPage';
import DeployLimitOrderPoolPage from './pages/DeployLimitOrderPoolPage';


// function App() {
//   return <SwapDashboardPage />;
// }

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PoolSelectorPage />} />
        <Route path="/swap" element={<SwapDashboardPage />} />
        <Route path="/mm" element={<SwapMMPage />} />
        <Route path="/limitQuote" element={<SwapMMPageV2 />} />
        <Route path="/limitTake" element={<TakerDashboardPage />} />
        <Route path="/deploy" element={<DeployPoolPage />} />
        <Route path="/limit-order" element={<LimitOrderPoolSelectorPage />} />
        <Route path="/limit-order/take" element={<TakerDashboardPage />} />
        <Route path="/limit-order/make" element={<SwapMMPageV2 />} />
        <Route path="/limit-order/deploy" element={<DeployLimitOrderPoolPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
