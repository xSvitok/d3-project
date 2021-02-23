import logo from './logo.svg';
import './App.css';
import LineChart from './components/Chart/LineChart';
import data from './data/data';

function App() {
  return (
    <div className="App">
      <LineChart data={data} />
    </div>
  );
}

export default App;
