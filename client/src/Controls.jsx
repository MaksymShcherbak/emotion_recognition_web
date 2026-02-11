import { useRef, useEffect } from "react";

function Controls({progress, fraction, enabled, predict}) {
    
    // Animate progress bar
    const progressRef = useRef();
    useEffect(()=>{
    if (fraction == 0.0) progressRef.current.value = 0.0;
    const interval = setInterval(() => {
      let value = progressRef.current.value;
      if (value < fraction) {
        if (fraction == 1.0) value += 0.1;
        else value += 0.005;
        progressRef.current.value = Math.min(value, 1.0);
      }
    }, 20);
    return () => clearInterval(interval);
  }, [progressRef, fraction]);

    return <div className="controls">
    <p>{progress}</p>
    <progress ref={progressRef} max="1"></progress>
    <button className={!enabled ? "disabled" : ""} onClick={predict}>Start Recognition</button>
  </div>;
}

export default Controls;