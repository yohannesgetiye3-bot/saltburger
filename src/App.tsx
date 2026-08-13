import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ShopProvider } from '@/context/ShopContext';
import BranchSelect from '@/pages/BranchSelect';
import Menu from '@/pages/Menu';
import Checkout from '@/pages/Checkout';
import Receipt from '@/pages/Receipt';
import Admin from '@/pages/Admin';

function App() {
  return (
    <ShopProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<BranchSelect />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/receipt" element={<Receipt />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ShopProvider>
  );
}

export default App;
