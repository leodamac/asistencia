import './App.css'
import { BrowserRouter} from 'react-router-dom';
import Providers from './context/Providers';
import { AppRoutes } from "./routes";

function App() {
  return (
    <BrowserRouter>
      <Providers>
        <AppRoutes/>
      </Providers>
    </BrowserRouter>
  );
}

export default App
