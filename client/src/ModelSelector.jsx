function ModelSelector({ models, model, setModel, descriptions }) {
  function handleChange(e) {
    setModel(e.target.value);
  }

  return (
    <div className="model-selector">
      <h1>Selected Model:</h1>
      <select value={model} onChange={handleChange}>
        {models.map((m) => (
          <option value={m} key={m}>
            {m}
          </option>
        ))}
      </select>

      {model && descriptions[model] && (
        <div className="model-tooltip">
          <span className="tooltip-icon">?</span>
          <span className="tooltip-text">{descriptions[model]}</span>
        </div>
      )}
    </div>
  );
}

export default ModelSelector;
