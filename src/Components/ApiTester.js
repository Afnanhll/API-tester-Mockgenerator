import React, { useState } from 'react';
import axios from 'axios';
import DashboardAnalytics from './DashboardAnalytics';
import { v4 as uuidv4 } from 'uuid';

const categorizedApis = {
  SIM: [
    { name: "SIM Info Success", method: "GET", url: "https://jsonplaceholder.typicode.com/posts/1" },
    { name: "SIM Info Fail", method: "GET", url: "https://jsonplaceholder.typicode.com/404" },
  ],
  OTP: [
    { name: "Send OTP", method: "POST", url: "https://jsonplaceholder.typicode.com/posts", body: { phone: "1234567890", message: "Your OTP is 1234" } },
  ],
  Send: [
    { name: "Send Message", method: "POST", url: "https://jsonplaceholder.typicode.com/posts", body: { user: "areej", text: "hello" } },
  ],
  Valid: [
    { name: "Validate Email", method: "GET", url: "https://jsonplaceholder.typicode.com/comments/1" },
  ],
};

export default function ApiTester() {
  const [activeTab, setActiveTab] = useState('SIM');
  const [results, setResults] = useState({});
  const [customUrl, setCustomUrl] = useState('');
  const [customMethod, setCustomMethod] = useState('GET');
  const [customBody, setCustomBody] = useState('');
  const [customResult, setCustomResult] = useState(null);

  const [mockDescription, setMockDescription] = useState('');
  const [mockLoading, setMockLoading] = useState(false);
  const [generatedMockUrl, setGeneratedMockUrl] = useState('');
  const [mockBodyPreview, setMockBodyPreview] = useState('');
const [customHistory, setCustomHistory] = useState([]);


  const updateResult = (category, apiName, newResult) => {
    setResults(prev => {
      const updatedCategory = prev[category]?.filter(r => r.name !== apiName) || [];
      return {
        ...prev,
        [category]: [...updatedCategory, newResult]
      };
    });
  };

const testApi = async (category, api) => {
  const correlationId = uuidv4();
  try {
    const res = await axios({
      method: api.method,
      url: api.url,
      data: api.method === 'POST' ? api.body : null,
      headers: {
        'x-correlation-id': correlationId,
      },
    });
    updateResult(category, api.name, {
      name: api.name,
      status: res.status,
      success: true,
      data: res.data,
      correlationId,
    });
  } catch (err) {
    updateResult(category, api.name, {
      name: api.name,
      status: err.response?.status || 'Error',
      success: false,
      error: err.message,
      correlationId,
    });
  }
};


const testCustomApi = async () => {
  const correlationId = uuidv4();
  try {
    const body = customBody ? JSON.parse(customBody) : undefined;
    const res = await axios({
      method: customMethod,
      url: customUrl,
      data: body,
      headers: {
        'x-correlation-id': correlationId,
      },
    });

    const newResult = {
      category: 'Custom',
      name: customUrl,
      method: customMethod,
      status: res.status,
      success: true,
      data: res.data,
      timestamp: new Date().toISOString(),
      correlationId,
    };

    setCustomResult(newResult);
    setCustomHistory(prev => [...prev, newResult]);

  } catch (err) {
    const newResult = {
      category: 'Custom',
      name: customUrl,
      method: customMethod,
      status: err.response?.status || 'Error',
      success: false,
      error: err.message,
      timestamp: new Date().toISOString(),
      correlationId,
    };

    setCustomResult(newResult);
    setCustomHistory(prev => [...prev, newResult]);
  }
};


const createMockApi = async () => {
  setMockLoading(true);
  try {
    const response = await axios.post('http://localhost:5000/api/generate-mock', {
      description: mockDescription
    });

    const mockData = response.data;

    // Save your actual backend URL here
    const fakeUrl = `http://localhost:5000/api/generate-mock`;

    setGeneratedMockUrl(fakeUrl);
    setMockBodyPreview(JSON.stringify(mockData, null, 2));
  } catch (err) {
    alert("Mock API generation failed.");
    console.error(err);
  } finally {
    setMockLoading(false);
  }
};

  return (
    <div className="api-container">
      <div className="logo-row">
        <img src={process.env.PUBLIC_URL + '/Omantel_Logo(1).png'} alt="Omantel Logo" className="omantel-logo" />
        <img src={process.env.PUBLIC_URL + '/Omantel_Logo(2).png'} alt="Omantel Logo" className="omantel-logo2" />
      </div>
      <h1>API Testing</h1>
      <div className="tabs">
        {Object.keys(categorizedApis).map((cat) => {
          const categoryPassed = results[cat]?.length > 0 && results[cat].every((r) => r.success);
          const categoryFailed = results[cat]?.some((r) => !r.success);
          return (
            <button
              key={cat}
              className={`tab-btn ${activeTab === cat ? 'active' : ''}`}
              onClick={() => setActiveTab(cat)}
            >
              {cat}
              {categoryPassed && <i className="fa fa-check-circle status success" style={{ marginLeft: 5, color: '#38a169' }}></i>}
              {categoryFailed && !categoryPassed && <i className="fa fa-times-circle status error" style={{ marginLeft: 5, color: '#e53e3e' }}></i>}
            </button>
          );
        })}
        <button
          className={`tab-btn ${activeTab === 'custom' ? 'active' : ''}`}
          onClick={() => setActiveTab('custom')}
        >
          Custom API
        </button>
        <button
          onClick={() => {
            Object.entries(categorizedApis).forEach(([cat, apis]) => {
              apis.forEach(api => testApi(cat, api));
            });
          }}
          className="tab-btn"
          style={{ backgroundColor: '#007bff', color: 'white' }}
        >
          Test All
        </button>
      </div>

{activeTab !== 'custom' && (
  <div className="tab-panel">
    {activeTab === 'SIM' ? (
      <div className="api-block">
        <h4>SIM Info</h4>
        <button
          className="run-btn"
          onClick={() => {
            categorizedApis['SIM'].forEach(api => testApi('SIM', api));
          }}
        >
          Run
        </button>

{results['SIM']?.length > 0 && (
  <div className="result" style={{ marginTop: '15px' }}>
    {results['SIM'].map((res, idx) => (
      <div key={idx} style={{ marginBottom: '20px' }}>
        <p>Status: {res.status}</p>
        <p><strong>Correlation ID:</strong> {res.correlationId || 'N/A'}</p> {/* ✅ ADD THIS */}
        <pre>
          {res.success
            ? JSON.stringify(res.data, null, 2)
            : JSON.stringify({ error: res.error }, null, 2)}
        </pre>
      </div>
    ))}
  </div>
)}

      </div>
    ) : (
      categorizedApis[activeTab].map((api, idx) => (
        <div key={idx} className="api-block">
          <h4>{api.name}</h4>
          {!results[activeTab]?.some(r => r.name === api.name) && (
            <button className="run-btn" onClick={() => testApi(activeTab, api)}>Run</button>
          )}
{results[activeTab]?.find(r => r.name === api.name) && (() => {
  const res = results[activeTab].find(r => r.name === api.name);
  return (
    <div className="result">
      <p>Status: {res.status}</p>
      <p><strong>Correlation ID:</strong> {res.correlationId || 'N/A'}</p> {/* ✅ ADD THIS */}
      <pre>
        {res.success
          ? JSON.stringify(res.data, null, 2)
          : JSON.stringify({ error: res.error }, null, 2)}
      </pre>
    </div>
  );
})()}

        </div>
      ))
    )}
  </div>
)}



      {activeTab === 'custom' && (
        <div className="custom-panel">
          <h2>Test Custom API</h2>
          <input
            type="text"
            placeholder="Enter API URL"
            value={customUrl}
            onChange={e => setCustomUrl(e.target.value)}
            className="input"
          />
          <select value={customMethod} onChange={e => setCustomMethod(e.target.value)} className="input">
            <option value="GET">GET</option>
            <option value="POST">POST</option>
          </select>
          {customMethod === 'POST' && (
            <textarea
              placeholder="Enter JSON body"
              value={customBody}
              onChange={e => setCustomBody(e.target.value)}
              className="input"
              rows={5}
            />
          )}
          <button onClick={testCustomApi} className="run-btn">Run Custom Test</button>
{customResult && (
  <div className="result">
    <p>Status: {customResult.status}</p>
    <p><strong>Correlation ID:</strong> {customResult.correlationId || 'N/A'}</p> {/* ✅ ADD THIS */}
    <pre>
      {customResult.success
        ? JSON.stringify(customResult.data, null, 2)
        : `Error: ${customResult.error}`}
    </pre>
  </div>
)}

        </div>
      )}

      <hr className="section-divider" />

    {/* ✅ Show mock API only when custom tab is active */}
      {activeTab === 'custom' && (
        <div className="custom-panel">
          <h2>🛠️ Generate Mock API</h2>
          <textarea
            placeholder="Describe your mock API (e.g., 'User creation with name and email')"
            value={mockDescription}
            onChange={(e) => setMockDescription(e.target.value)}
            className="input"
            rows={3}
          />
          <button
            onClick={createMockApi}
            className="run-btn"
            disabled={mockLoading || !mockDescription}
          >
            {mockLoading ? 'Generating...' : 'Create Mock API'}
          </button>

          {generatedMockUrl && (
            <div className="result">
              <p><strong>Mock URL:</strong> <a href={generatedMockUrl} target="_blank" rel="noreferrer">{generatedMockUrl}</a></p>
              <p><strong>Preview:</strong></p>
              <pre>{mockBodyPreview}</pre>
              <button
                onClick={() => {
                  setCustomUrl(generatedMockUrl);
                  setCustomMethod('GET');
                  setCustomBody('');
                  alert('Mock API copied to Custom API tester.');
                }}
                className="export-btn"
              >
                Use in Custom API Tester
              </button>
            </div>
          )}
        </div>
      )}
      <DashboardAnalytics results={results} customHistory={customHistory}/>
    </div>
  );
}
