import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import Cookies from 'js-cookie';
import { Analytics } from "@vercel/analytics/react"
import Summary from './Summary'; // Import the Summary component
import Schedule from './Schedule'; // Import the Schedule component
import ScheduleDTDC from './ScheduleDTDC'; // Import the Schedule component
import './App.css'; // Import the CSS file

const App = () => {
  const [url, setUrl] = useState('');
  const [points, setPoints] = useState(0);
  const [percentage, setPercentage] = useState(0);
  const [error, setError] = useState('');
  const [isValidUrl, setIsValidUrl] = useState(false);
  const [lastFetched, setLastFetched] = useState(null);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [codeTutor, setCodeTutor] = useState(0);
  const [codeTrack, setCodeTrack] = useState(0);
  const [codeTest, setCodeTest] = useState(0);
  const [dt, setDt] = useState(0);
  const [dc, setDc] = useState(0);
  const [showSchedule, setShowSchedule] = useState(false);
  const [showScheduleDTDC, setShowScheduleDTDC] = useState(false);

  const handleLogout = () => {
    setUrl('');
    setPoints(0);
    setPercentage(0);
    setError('');
    setIsValidUrl(false);
    setLastFetched(null);
    setName('');
    setCodeTutor(0);
    setCodeTrack(0);
    setCodeTest(0);
    setDt(0);
    setDc(0);
    setShowSchedule(false);
    setShowScheduleDTDC(false);
    Cookies.remove('lastUrl');
  };
  
  const calculatePoints = (data) => {
    const totalPoints = data.codeTrack * 2 + data.codeTest * 30 + data.dt * 20 + data.dc * 2;
    setPoints(totalPoints);
    setPercentage((totalPoints / 3000) * 100);
    setLastFetched(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    setCodeTutor(data.codeTutor);
    setCodeTrack(data.codeTrack);
    setCodeTest(data.codeTest);
    setDt(data.dt);
    setDc(data.dc);
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      const lastUrl = Cookies.get('lastUrl');
      
      if (lastUrl) {
        setLoading(true);
        try {
          const { data } = await axios.get(`/api/points/refresh?url=${encodeURIComponent(lastUrl)}`);
          if (data && data.name !== '') {
            calculatePoints(data);
            setIsValidUrl(true);
            setUrl(lastUrl);
            setName(data.name);
          }
        } catch (error) {
          console.error(error);
          // If there's an error, clear the cookie
          Cookies.remove('lastUrl');
        }
        setLoading(false);
      }
    };
  
    fetchInitialData();
  }, []);

  const isValidSkillRackUrl = (url) => {
    const regex = /^https?:\/\/www\.skillrack\.com/;
    return regex.test(url);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
  
    if (!isValidSkillRackUrl(url)) {
      setError('Invalid URL. Please enter a valid SkillRack Profile URL!!');
      return;
    }
  
    setLoading(true);
    try {
      const { data } = await axios.post('/api/points', { url });
      if (data && data.name !== '') {
        calculatePoints(data);
        setIsValidUrl(true);
        Cookies.set('lastUrl', data.redirectedUrl, { 
          expires: 365, // Set to expire in 1 year
          sameSite: 'Lax',
          secure: true // Use this if your site is served over HTTPS
        });
        setName(data.name);
      } else {
        setError('Invalid URL. Please enter a valid SkillRack Profile URL!!');
      }
    } catch (error) {
      setError('Invalid URL. Please enter a valid SkillRack Profile URL!!');
      console.error(error);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <h1>Loading...</h1>
      </div>
    );
  }

  const handleGenerateSchedule = () => {
    setShowSchedule(true);
  };

  const handleGenerateScheduleDTDC = () => {
    setShowScheduleDTDC(true);
  };

  return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      <h1>SkillRack Points Tracker</h1>
      <Analytics/>
      {!isValidUrl && (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
          <p>Login to <a href="https://www.skillrack.com/faces/candidate/manageprofile.xhtml" target="_blank" rel="noopener noreferrer"><b>SkillRack</b></a> -&gt; Profile -&gt; Enter Password -&gt; Click "View" -&gt; Copy the URL</p>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste Profile URL"
            name="profile_url"
            style={{ width: '100%', maxWidth: '300px', padding: '10px', boxSizing: 'border-box' }}
          />
          <button type="submit" className="submit-button">Submit</button>
        </form>
      )}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {isValidUrl && (
        <>
          <p>Last fetched: {lastFetched}</p>
          <br />
          <h2>Hi.. {name} 😊</h2>
          <div style={{ width: '200px', margin: '50px auto' }}>
            <CircularProgressbar
              value={percentage}
              text={points <= 3000 ? `${points}/3000` : `${points}`}
              styles={buildStyles({
                textColor: '#000',
                pathColor: '#4caf50',
                trailColor: '#d6d6d6',
                textSize: '16px'
              })}
            />
          </div>

          {points >= 3000 && (
            <>
              <h3>Congratulations 🎉 {name} on completing 3000 points!</h3>
              <br />
            </>
          )}
          <Summary codeTutor={codeTutor} codeTrack={codeTrack} codeTest={codeTest} dt={dt} dc={dc} totalPoints={points} />
          
          {((codeTutor + codeTrack) >= 600 && points < 3000) &&  (
            <>
              <button onClick={handleGenerateSchedule} className="generate-schedule-button">✨ Plan with AI ✨</button><br /><br />
              {showSchedule && (
                <Schedule
                  initialValues={{
                    codeTrack: codeTrack,
                    dt: dt,
                    dc: dc,
                    points: points
                  }}
                />
              )}
            </>
          )}
          {(codeTutor + codeTrack) < 600 && (
            <>
              <button onClick={handleGenerateScheduleDTDC} className="generate-schedule-button">✨ Plan with AI ✨</button><br /><br />
              {showScheduleDTDC && (
                <ScheduleDTDC
                  initialValues={{
                    codeTrack: codeTrack,
                    problems: codeTrack + codeTutor
                  }}
                />
              )}
            </>
          )}

          <br /><br />
          <button onClick={handleLogout} className="logout-button">Logout</button><br /><br />
        </>
      )}
      <footer style={{ marginTop: '50px' }}>
        <br /><br />
        Built with MERN stack by <a href="https://github.com/Guru-25" target="_blank" rel="noopener noreferrer"><b>Guru</b></a>
        <br /><br />
        Give a ⭐️ on <a href="https://github.com/Guru-25/skillrack-points-tracker" target="_blank" rel="noopener noreferrer"><b>GitHub</b></a>
      </footer>
    </div>
  );
};

export default App;