import React from 'react';

function Header() {
  return (
    <header className="header">
      <div className="logo">
        <span className="logo-icon">🍳</span>
        <h1>AI智能菜谱</h1>
      </div>
      <p className="tagline">拍照识别食材，智能推荐美味佳肴</p>
    </header>
  );
}

export default Header;
