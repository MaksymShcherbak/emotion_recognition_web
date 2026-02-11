function PredictionPlot({ predictions, onExport }) {
  const maxLabel = predictions != null ? predictions.reduce((max, obj) => obj.probability > max.probability ? obj : max).label : null;

    return <div className="predictions">
    {predictions != null && (
      <>
        <div className="predictions-title"><h1>Predicted Emotion: {maxLabel}</h1>{predictions && onExport ? <button onClick={onExport}>Export to JSON</button> : <></>}</div>
        <div className="results">
          {predictions.map(({ label, probability }) => (
            <div key={label}>
              <span className={maxLabel === label ? "results-bar selected" : "results-bar"} style={{ height: `${probability * 163}px` }}></span>
              <span className="emotion">{label}</span>
              <span className="probability">{(probability * 100).toFixed(2)}%</span>
            </div>
          ))}
        </div>
      </>
    )}
  </div>;
}

export default PredictionPlot;