import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PoolSelectorPage from './pages/PoolSelectorPage';
import SwapDashboardPage from './pages/SwapDashboardPage';
import SwapMMPage from './pages/SwapMMPage';
import DeployPoolPage from './pages/DeployPoolPage';


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
        <Route path="/deploy" element={<DeployPoolPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
