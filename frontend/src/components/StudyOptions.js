import React from 'react';
import { useNavigate } from 'react-router-dom';

function StudyOptions() {
  const navigate = useNavigate();

  const handleOptionClick = (option) => {
    navigate(`/study/${option}`);
  };

  return (
    <div className="study-options">
      <h2>Select Study Option</h2>
      <button className="study-button" onClick={() => handleOptionClick('random')}>Random Question</button>
      <button className="study-button" onClick={() => handleOptionClick('practice-test')}>Practice Test</button>
      <button className="study-button" onClick={() => handleOptionClick('practice-worst')}>Practice Worst</button>
    </div>
  );
}

export default StudyOptions;
