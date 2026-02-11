import { useState } from "react";
import PredictionPlot from "./PredictionPlot";
import Controls from "./Controls";

function PredictImage({ model }) {
  const [file, setFile] = useState(null);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [progress, setProgress] = useState('');
  const [fraction, setFraction] = useState(0.0);

  const handleInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const predictEmotion = () => {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('model', model);

  fetch('http://localhost:5000/predict_image', {
      method: 'POST',
      body: formData
    })
    .then(response => response.json())
    .then(data => {
        let clientId = data.clientId;
        let interval = null;

        const fetchProgress = () => {
          fetch(`http://localhost:5000/progress?clientId=${clientId}`)
            .then(response => response.json())
            .then(({progress}) => {
              if (progress.error) {
                alert(progress.error)
                clearInterval(interval);
              }

              if (progress.predictions) {
                setPredictions(progress.predictions);
                setPreview(progress.face_img)
                setProgress('Complete');
                setFraction(1);
                clearInterval(interval);
              }

              setProgress(progress.msg);
              setFraction(progress.fraction);
            }).catch((e) => console.log(e));
        };
      
          interval = setInterval(fetchProgress, 1000);
        })
      .catch((e) => console.log(e));

      setFraction(0.00);
      setProgress('');
      setPreview(null);
      setPredictions(null);
  };

  const onExport = () => {
    const jsonData = JSON.stringify(predictions, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'predictions.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <main>
      <div className="container">
        <div className="sections">
          <div>
            <div className="inputs">
              <label htmlFor="file-upload" className="custom-file-upload">
                Upload Image...
              </label>
              <p>{file ? file.name : ""}</p>
            </div>
            <input id="file-upload" type="file" onChange={handleInputChange} />
            {image != null ? <img className="image-upload" src={image} alt="Uploaded" /> : <div className="image-upload"></div>}
            {preview != null ? <img className="image-preview" src={'data:image/jpeg;base64,' + preview} alt="Preview" /> : <div className="image-preview"></div>}
          </div>
          <PredictionPlot predictions={predictions} onExport={onExport}/>
        </div>
        <Controls predict={predictEmotion} progress={progress} fraction={fraction} enabled={file != null && (fraction == 0.0 || fraction == 1.0)}/>
        <div className="help">
          <h1>How to use</h1>
          <ol>
            <li>Click “Upload Image” and select a relevant file</li>
            <li>Click “Start Recognition” and wait for the model prediction</li>
            <li>Observe the predictions in the plot to the right</li>
          </ol>
        </div>
      </div>
    </main>
  );
}

export default PredictImage;
