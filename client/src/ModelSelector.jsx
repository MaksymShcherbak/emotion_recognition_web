function ModelSelector({models, model, setModel}) {  

  function handleChange(e) {
    setModel(e.target.value);
  }

return <div className="model-selector"><h1>Selected Model:</h1>
        <select value={model} onChange={handleChange}>
          {models.map(m => <option value={m} key={m}>{m}</option>)}
        </select>
        </div>
}

export default ModelSelector;