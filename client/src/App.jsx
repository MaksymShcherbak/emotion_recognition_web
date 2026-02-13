import "./App.css";
import { useEffect, useState } from "react";
import Nav from "./Nav";
import { Routes, Route, BrowserRouter } from "react-router-dom";
import PredictImage from "./PredictImage";
import PredictVideo from "./PredictVideo";
import PredictLive from "./PredictLive";
import ModelSelector from "./ModelSelector";

function App() {
  const [models, setModels] = useState([]);
  const [descriptions, setDescriptions] = useState({});
  const [model, setModel] = useState("");

  useEffect(() => {
    fetch(`${import.meta.env.VITE_SERVER_URL}/models`)
      .then((res) => res.json())
      .then((data) => {
        setDescriptions(data);
        const modelNames = Object.keys(data);
        setModels(modelNames);
        setModel(modelNames[modelNames.length - 1]);
      });
  }, []);

  return (
    <div className="app">
      <BrowserRouter>
        <Nav />
        <ModelSelector
          models={models}
          model={model}
          setModel={setModel}
          descriptions={descriptions}
        />
        <Routes>
          <Route index path="/" element={<PredictImage model={model} />} />
          <Route path="/image" element={<PredictImage model={model} />} />
          <Route path="/video" element={<PredictVideo model={model} />} />
          <Route path="/live" element={<PredictLive model={model} />} />
        </Routes>
        <div className="footer">
          <span>
            Thanks for trying out the App! Project source code is available at{" "}
            <a
              href="https://github.com/MaksymShcherbak/emotion_recognition_web"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
            . If you liked it, you can find me at:
          </span>
          <div>
            <a
              className="author-link"
              href="https://github.com/MaksymShcherbak"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img src="github.svg" alt="GitHub Logo" />
              GitHub
            </a>
          </div>

          <div>
            <a
              className="author-link"
              href="https://www.linkedin.com/in/maksym-shcherbak-11159b3a7/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img src="linkedin.svg" alt="LinkedIn Logo" />
              LinkedIn
            </a>
          </div>
        </div>
      </BrowserRouter>
    </div>
  );
}

export default App;
