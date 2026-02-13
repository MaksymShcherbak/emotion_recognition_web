import { useEffect, useRef, useState } from "react";
import PredictionPlot from "./PredictionPlot";
import Controls from "./Controls";

function PredictVideo({ model }) {
  document.documentElement.style.cssText =
    "--accent: #5e86de; --accent-light: #d8e5ff";

  const [file, setFile] = useState(null);
  const [videoURL, setVideoURL] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [progress, setProgress] = useState("");
  const [fraction, setFraction] = useState(0.0);
  const [isPredicting, setIsPredicting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef(null);
  const videoRef = useRef();
  const intervalRef = useRef(null);

  const [currentFrame, setCurrentFrame] = useState(0);
  const [frameRate, setFrameRate] = useState(25);

  const handleFile = (file) => {
    if (!file) return;

    setFile(file);
    setPredictions(null);
    setProgress("");
    setFraction(0.0);
    setIsPredicting(false);

    const url = URL.createObjectURL(file);
    setVideoURL(url);
  };

  const handleInputChange = (e) => {
    handleFile(e.target.files[0]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (isPredicting) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isPredicting) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleClick = () => {
    if (isPredicting) return;
    fileInputRef.current.click();
  };

  const predictEmotion = () => {
    if (!file) return;

    setIsPredicting(true);
    setProgress("");
    setFraction(0.0);
    setPredictions(null);

    const formData = new FormData();
    formData.append("video", file);
    formData.append("model", model);

    fetch("/predict_video", {
      method: "POST",
      body: formData,
    })
      .then((res) => res.json())
      .then((data) => {
        const clientId = data.clientId;

        const fetchProgress = () => {
          fetch(`/progress?clientId=${clientId}`)
            .then((res) => res.json())
            .then(({ progress }) => {
              if (progress.error) {
                alert(progress.error);
                clearInterval(intervalRef.current);
                setIsPredicting(false);
                setFraction(0);
                return;
              }

              if (progress.predictions) {
                setPredictions(progress.predictions);
                setProgress("Complete");
                setFraction(1);
                setIsPredicting(false);
                clearInterval(intervalRef.current);
              } else {
                setProgress(progress.msg);
                setFraction(progress.fraction);
              }
            })
            .catch(() => {
              clearInterval(intervalRef.current);
              setIsPredicting(false);
            });
        };

        intervalRef.current = setInterval(fetchProgress, 2000);
      })
      .catch(() => {
        setIsPredicting(false);
      });
  };

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    const handleTimeUpdate = () => {
      if (!predictions) return;

      const duration = videoEl.duration;
      if (!duration) return;

      const ratio = videoEl.currentTime / duration;
      const index = Math.floor(ratio * predictions.length);

      setCurrentFrame(Math.min(index, predictions.length - 1));
    };

    videoEl.addEventListener("timeupdate", handleTimeUpdate);

    return () => {
      videoEl.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [frameRate, videoURL, predictions]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (videoURL) URL.revokeObjectURL(videoURL);
    };
  }, [videoURL]);

  const onExport = () => {
    if (!predictions) return;

    const exportData = {
      file_name: file.name,
      frames: predictions.length,
      predictions: predictions,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "predictions.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const dropZoneStyle = {
    cursor: isPredicting ? "not-allowed" : "pointer",
    opacity: isPredicting ? 0.6 : 1,
  };

  return (
    <main>
      <div className="container">
        <div
          className="drop-zone"
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          style={dropZoneStyle}
        >
          <img src="video.svg" />
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            style={{ display: "none" }}
            onChange={handleInputChange}
          />
          <p>{file ? file.name : "Click or drag to upload video"}</p>
        </div>

        <div className="sections">
          <div>
            {fraction === 1 && videoURL && (
              <div>
                <h2 className="frame">
                  Frame{" "}
                  {predictions
                    ? Math.min(currentFrame, predictions.length - 1)
                    : 0}
                  {predictions ? ` / ${predictions.length - 1}` : ""}
                </h2>
                <video
                  controls
                  ref={videoRef}
                  muted
                  className="video-upload"
                  src={videoURL}
                />
              </div>
            )}
          </div>

          <PredictionPlot
            predictions={predictions ? predictions[currentFrame] : null}
            onExport={onExport}
          />
        </div>

        <Controls
          predict={predictEmotion}
          progress={progress}
          fraction={fraction}
          enabled={file != null && !isPredicting}
        />

        <div className="help">
          <h1>How to Use</h1>
          <ol>
            <li>Click or drag a video into the drop zone</li>
            <li>Click “Start Recognition”</li>
            <li>Play the video to see frame-based predictions</li>
          </ol>
        </div>
      </div>
    </main>
  );
}

export default PredictVideo;
