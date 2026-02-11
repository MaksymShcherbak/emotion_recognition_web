import './App.css';
import {useEffect, useState} from 'react';
import Nav from './Nav';
import { Routes, Route, BrowserRouter } from "react-router-dom";
import PredictImage from './PredictImage';
import PredictVideo from './PredictVideo';
import PredictLive from './PredictLive';
import ModelSelector from './ModelSelector';

function App() {
  const [models, setModels] = useState([]);
  const [model, setModel] = useState("");

  useEffect(() => {
    fetch('http://localhost:5000/models')
      .then(response => response.json())
      .then(models => {
        setModels(models);
        setModel(models[models.length -1]);
    });
  }, []);

  return (
    <div className="app">
      <BrowserRouter>
        <Nav/>
        <ModelSelector models={models} model={model} setModel={setModel} />
          <Routes>
            <Route index path="/" element={<PredictImage model={model} />}/>
            <Route path="/image" element={<PredictImage model={model} />}/>
            <Route path="/video" element={<PredictVideo model={model} />}/>
            <Route path="/live" element={<PredictLive model={model} />}/>
          </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
