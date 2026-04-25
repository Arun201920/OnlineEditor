import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const DEFAULT_CODE = {
  java: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}`,
  python: `print("Hello, World!")`,
  cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}`
};

function App() {
  const [lang, setLang] = useState('java');
  const [code, setCode] = useState(DEFAULT_CODE.java);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [status, setStatus] = useState('IDLE');
  const [loading, setLoading] = useState(false);
  
  const [activeTab, setActiveTab] = useState('editor');
  const [history, setHistory] = useState([]);
  
  const lineNumsRef = useRef(null);

  const handleScroll = (e) => {
    if (lineNumsRef.current) {
      lineNumsRef.current.scrollTop = e.target.scrollTop;
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await axios.get('http://localhost:8080/api/code/history');
      setHistory(res.data.reverse());
    } catch (err) {
      console.error("Error fetching history:", err);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab]);

  const runCode = async () => {
    setLoading(true);
    setStatus('RUNNING');
    try {
      const res = await axios.post('http://localhost:8080/api/code/run', {
        language: lang,
        code: code,
        input: input
      });
      setOutput(res.data.output || res.data.error);
      setStatus(res.data.status);
    } catch (err) {
      setStatus('ERROR');
      setOutput('Server connection failed.');
    }
    setLoading(false);
  };

  const lines = code.split('\n').length;

  return (
    <div className="app">
      <nav className="navbar">
        <div className="logo"><div className="logo-icon">{'>'}</div> CodeRun</div>
        <div className="nav-tabs">
          <button 
            className={`nav-tab ${activeTab === 'editor' ? 'active' : ''}`} 
            onClick={() => setActiveTab('editor')}
          >
            Editor
          </button>
          <button 
            className={`nav-tab ${activeTab === 'history' ? 'active' : ''}`} 
            onClick={() => setActiveTab('history')}
          >
            History
          </button>
        </div>
        <div className="nav-right"><span className="badge">● Server Online</span></div>
      </nav>

      {activeTab === 'editor' ? (
        <div className="editor-page">
          <div className="toolbar">
            <select value={lang} onChange={(e) => {setLang(e.target.value); setCode(DEFAULT_CODE[e.target.value])}}>
              <option value="java">Java</option>
              <option value="python">Python</option>
              <option value="cpp">C++</option>
            </select>
            <span className="file-name">Main.{lang === 'java' ? 'java' : lang === 'python' ? 'py' : 'cpp'}</span>
            <div style={{flex: 1}}></div>
            <button className="btn-run" onClick={runCode} disabled={loading}>
              {loading ? 'Executing...' : 'Run Code'}
            </button>
          </div>

          <div className="editor-split">
            <div className="editor-pane">
              <div className="editor-wrap">
                <div className="line-nums" ref={lineNumsRef}>
                  {Array.from({ length: lines }).map((_, i) => (
                    <div key={i} style={{paddingRight: '12px'}}>{i + 1}</div>
                  ))}
                </div>
                <textarea 
                  className="code-area" 
                  value={code}
                  onScroll={handleScroll}
                  onChange={(e) => setCode(e.target.value)}
                  spellCheck="false"
                />
              </div>
              <div style={{padding: '10px', background: 'var(--bg2)', borderTop: '1px solid var(--border)'}}>
                <div style={{fontSize: '11px', color: 'var(--text3)', marginBottom: '5px'}}>STDIN</div>
                <textarea 
                  className="stdin-area"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Program input..."
                />
              </div>
            </div>

            <div className="output-pane">
              <div className="output-header">
                <span className="output-title">CONSOLE</span>
                {/* Updated Console Status Badge */}
                <span className={`status-badge ${status === 'SUCCESS' ? 'status-success' : status === 'IDLE' ? 'status-idle' : 'status-error'}`}>
                  {status}
                </span>
              </div>
              <div className={`output-terminal ${status === 'SUCCESS' ? 'success' : 'error'}`}>
                {output || "Output will appear here..."}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="history-page">
          <div className="history-header">
            {/* <h2 className="page-title">Submission History</h2> */}
            <button className="btn-run" style={{padding:'5px 15px'}} onClick={fetchHistory}>Refresh</button>
          </div>
          <div className="submissions-list">
            {history.length === 0 ? (
              <div className="empty-history">No submissions found.</div>
            ) : (
              history.map((item) => (
                <div key={item.id} className="submission-card" onClick={() => {
                  setCode(item.code);
                  setLang(item.language);
                  setActiveTab('editor');
                }}>
                  <div className="sub-header">
                    <span className="sub-lang">{item.language.toUpperCase()}</span>
                    {/* Placed Status Badge in History Card */}
                    <span className={`status-badge ${item.status === 'SUCCESS' ? 'status-success' : 'status-error'}`}>
                      {item.status}
                    </span>
                  </div>
                  <div className="sub-code-preview">{item.code}</div>
                  <div className="sub-meta">
                    <span>Time: {item.executionTime}ms</span>
                    <span>•</span>
                    <span>ID: #{item.id}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;