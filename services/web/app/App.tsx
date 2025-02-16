import './index.css';
import { Route, Routes } from 'react-router-dom';

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<div>Hello</div>}>
        <Route path="*" element={<div>Not Found</div>} />
      </Route>
    </Routes>
  );
};

export default App;
