import { useState, useRef, useEffect } from "react";
import PredictionPlot from "./PredictionPlot";
import Controls from "./Controls";

function PredictImage({ model }) {
  document.documentElement.style.cssText =
    "--accent: #37b24d; --accent-light: #cdffd6";

  const [file, setFile] = useState(null);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [progress, setProgress] = useState("");
  const [fraction, setFraction] = useState(0.0);
  const [isPredicting, setIsPredicting] = useState(false);
  const [gallery, setGallery] = useState([]);
  const [selectedExample, setSelectedExample] = useState(null);

  const fileInputRef = useRef(null);

  useEffect(() => {
    const nums = new Set();
    while (nums.size < 5) {
      nums.add(Math.floor(Math.random() * 8) + 1);
    }
    setGallery([...nums]);
  }, []);

  const handleGallerySelect = async (num) => {
    if (isPredicting) return;

    setSelectedExample(num);

    const response = await fetch(`/examples/${num}.jpg`);
    const blob = await response.blob();
    const file = new File([blob], `${num}.jpg`, { type: "image/jpeg" });

    handleFile(file, true);
  };

  const handleFile = (file, fromGallery = false) => {
    if (!file) return;

    if (!fromGallery) setSelectedExample(null);

    setFile(file);
    setImage(null);
    setPreview(null);
    setPredictions(null);
    setProgress("");
    setFraction(0.0);
    setIsPredicting(false);

    const reader = new FileReader();
    reader.onloadend = () => setImage(reader.result);
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e) => {
    handleFile(e.target.files[0]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isPredicting) return;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
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
    setPreview(null);
    setPredictions(null);

    const formData = new FormData();
    formData.append("image", file);
    formData.append("model", model);

    fetch(`${import.meta.env.VITE_SERVER_URL}/predict_image`, {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        const clientId = data.clientId;
        let interval = null;

        const fetchProgress = () => {
          fetch(
            `${import.meta.env.VITE_SERVER_URL}/progress?clientId=${clientId}`,
          )
            .then((response) => response.json())
            .then(({ progress }) => {
              if (progress.error) {
                alert(progress.error);
                clearInterval(interval);
                setIsPredicting(false);
                setFraction(0.0);
                setProgress(progress.error);
                return;
              }

              if (progress.predictions) {
                setPredictions(progress.predictions);
                setPreview(progress.face_img);
                setProgress("Complete");
                setFraction(1);
                setIsPredicting(false);
                clearInterval(interval);
              } else {
                setProgress(progress.msg);
                setFraction(progress.fraction);
              }
            })
            .catch((e) => {
              console.log(e);
              clearInterval(interval);
              setIsPredicting(false);
            });
        };

        interval = setInterval(fetchProgress, 1000);
      })
      .catch((e) => {
        console.log(e);
        setIsPredicting(false);
      });
  };

  const onExport = () => {
    if (!predictions) return;

    const exportData = {
      file_name: file.name,
      predictions: predictions,
    };

    const jsonData = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "predictions.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const dropZoneStyle = {
    cursor: isPredicting ? "not-allowed" : "pointer",
    opacity: isPredicting ? 0.6 : 1,
  };

  return (
    <main>
      <div className="container">
        <div className="upload-gallery-row">
          <div
            className="drop-zone"
            onClick={handleClick}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            style={dropZoneStyle}
          >
            <img src="img.svg" />
            <input
              ref={fileInputRef}
              id="file-upload"
              type="file"
              name="image"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleInputChange}
            />
            <p>{file ? file.name : "Drag & Drop Your Image"}</p>
          </div>

          <div className="gallery-column">
            <h2 className="gallery-title">
              Or, choose from the Example Gallery:
            </h2>
            <div className="gallery-row">
              {gallery.map((num) => (
                <img
                  key={num}
                  src={`/examples/${num}.jpg`}
                  className={`gallery-thumb ${
                    selectedExample === num ? "selected" : ""
                  }`}
                  onClick={() => handleGallerySelect(num)}
                  style={{ cursor: isPredicting ? "not-allowed" : "pointer" }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="sections">
          <div>
            {fraction === 1 && image && (
              <img className="image-upload" src={image} alt="Uploaded" />
            )}
            {fraction === 1 && preview && (
              <img
                className="image-preview"
                src={"data:image/jpeg;base64," + preview}
                alt="Preview"
              />
            )}
          </div>

          <PredictionPlot predictions={predictions} onExport={onExport} />
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
            <li>Click or drag an image into the drop zone</li>
            <li>Or select an image from the gallery</li>
            <li>Click “Start Recognition” and wait for the model prediction</li>
            <li>Observe the predictions in the plot to the right</li>
          </ol>
        </div>
      </div>
    </main>
  );
}

export default PredictImage;
