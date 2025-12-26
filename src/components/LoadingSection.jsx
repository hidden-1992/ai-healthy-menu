import React from 'react';

function LoadingSection({ text = 'AI正在识别食材中...' }) {
  return (
    <section className="loading-section">
      <div className="loading-spinner" />
      <p className="loading-text">{text}</p>
    </section>
  );
}

export default LoadingSection;
