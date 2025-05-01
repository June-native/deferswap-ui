import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SelectPoolSpreadPage from './pages/SelectPoolSpreadPage';
import SelectPoolLimitPage from './pages/SelectPoolLimitPage';
import TakerSpreadPage from './pages/TakerSpreadPage';
import MakerSpreadPage from './pages/MakerSpreadPage';
import TakerLimitPage from './pages/TakerLimitPage';
import MakerLimitPage from './pages/MakerLimitPage';
import DeployPoolSpreadPage from './pages/DeployPoolSpreadPage';
import DeployPoolLimitPage from './pages/DeployPoolLimitPage';
import AllPoolsPage from './pages/AllPoolsPage';


// function App() {
//   return <SwapDashboardPage />;
// }

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SelectPoolSpreadPage />} />
        <Route path="/swap" element={<TakerSpreadPage />} />
        <Route path="/mm" element={<MakerSpreadPage />} />
        <Route path="/deploy" element={<DeployPoolSpreadPage />} />
        {/* new routings */}
        <Route path="/spread-order" element={<SelectPoolSpreadPage />} />
        <Route path="/spread-order/take" element={<TakerSpreadPage />} />
        <Route path="/spread-order/make" element={<MakerSpreadPage />} />
        <Route path="/spread-order/deploy" element={<DeployPoolSpreadPage />} />
        <Route path="/limit-order" element={<SelectPoolLimitPage />} />
        <Route path="/limit-order/take" element={<TakerLimitPage />} />
        <Route path="/limit-order/make" element={<MakerLimitPage />} />
        <Route path="/limit-order/deploy" element={<DeployPoolLimitPage />} />
        <Route path="/all-pools" element={<AllPoolsPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
