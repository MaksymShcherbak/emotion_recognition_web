import { useEffect, useRef, useState } from "react";
import PredictionPlot from "./PredictionPlot";
import Controls from "./Controls";

function PredictVideo({ model }) {
  const [file, setFile] = useState(null);
  const [video, setVideo] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [progress, setProgress] = useState('');
  const [fraction, setFraction] = useState(0.0);

  const handleInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setVideo(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const predictEmotion = () => {
  const formData = new FormData();
  formData.append('video', file);
  formData.append('model', model);

  fetch('http://localhost:5000/predict_video', {
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
                setProgress('Complete');
                setFraction(1);
                clearInterval(interval);
              }

              setProgress(progress.msg);
              setFraction(progress.fraction);
            }).catch((e) => console.log(e));
        };
      
          interval = setInterval(fetchProgress, 2500);
        })
      .catch((e) => console.log(e));

      setFraction(0.00);
      setProgress('');
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

  const videoRef = useRef();
  const [currentFrame, setCurrentFrame] = useState(0);
  const [frameRate, setFrameRate] = useState(0);
  
  useEffect(() => {
    const video = videoRef.current;

    if (video) {

    const handleLoadedMetadata = () => {
      setFrameRate(video.frameRate || 25);
    };

    const handleTimeUpdate = () => {
      const currentTime = video.currentTime;
      const frameIndex = Math.floor(currentTime * frameRate);
      setCurrentFrame(frameIndex);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }
  }, [frameRate, file, video]);

  return (
    <main>
      <div className="container">
        <div className="sections">
          <div>
            <div className="inputs">
              <label htmlFor="file-upload" className="custom-file-upload">
                Upload Video...
              </label>
              <p>{file ? file.name : ""}</p>
            </div>
            <input id="file-upload" type="file" onChange={handleInputChange} />
            {video != null ? <video controls={true} ref={videoRef} muted className="video-upload" src={video} alt="Uploaded" /> : <div className="video-upload"></div>}
            </div>
          <PredictionPlot predictions={predictions ? predictions[currentFrame] : null} onExport={onExport}/>
        </div>
        <Controls predict={predictEmotion} progress={progress} fraction={fraction} enabled={file != null && (fraction == 0.0 || fraction == 1.0)}/>
        <div className="help">
          <h1>How to use</h1>
          <ol>
            <li>Click “Upload Video” and select a relevant file</li>
            <li>Click “Start Recognition” and wait for the model prediction</li>
            <li>Play the video to see predictions for each frame</li>
          </ol>
        </div>
      </div>
    </main>
  );
}

export default PredictVideo;
