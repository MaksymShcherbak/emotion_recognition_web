import { useEffect, useRef, useState } from "react";
import PredictionPlot from "./PredictionPlot";

function PredictLive({ model }) {
  const [predictions, setPredictions] = useState(null);
  const [waiting, setWaiting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const predictEmotion = async () => {
    if (waiting || !canvasRef.current || isPaused) return;

    setWaiting(true);

    const canvas = canvasRef.current;
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg'));

    const formData = new FormData();
    formData.append('image', blob, 'frame.jpg');
    formData.append('model', model);

    try {
      const response = await fetch('http://localhost:5000/predict_image', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      const clientId = data.clientId;

      const fetchProgress = async () => {
        try {
          const response = await fetch(`http://localhost:5000/progress?clientId=${clientId}`);
          const { progress } = await response.json();

          if (progress.error) {
            console.error(progress.error);
            setWaiting(false);
          } else if (progress.predictions) {
            setPredictions(progress.predictions);
            setWaiting(false);
          } else {
            setTimeout(fetchProgress, 1000);
          }
        } catch (e) {
          console.error(e);
          setWaiting(false);
        }
      };

      fetchProgress();
    } catch (e) {
      console.error(e);
      setWaiting(false);
    }
  };

  const handleTogglePause = () => {
    const video = videoRef.current;
  
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  
    setIsPaused(!isPaused);
  };

  useEffect(() => {
    const getUserMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing the camera: ", err);
      }
    };

    getUserMedia();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(predictEmotion, 5000);
    return () => clearInterval(interval);
  }, [waiting, isPaused]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');

    const drawFrame = () => {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      requestAnimationFrame(drawFrame);
    };

    if (!isPaused) {
      drawFrame();
    }

    return () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [isPaused]);
  
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
            <button className="pause-button" onClick={handleTogglePause}>
              {isPaused ? 'Play' : 'Pause'}
            </button>
            <video ref={videoRef} autoPlay={!isPaused} playsInline className="video-upload" alt="" />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </div>
          <PredictionPlot predictions={predictions} onExport={onExport}/>
        </div>
        <div className="help">
          <h1>How to use</h1>
          <ol>
            <li>Give Camera permission</li>
            <li>Observe the live predictions in the plot to the right</li>
            <li>Press “Pause” to stop prediction if needed</li>
          </ol>
        </div>
      </div>
    </main>
  );
}

export default PredictLive;
