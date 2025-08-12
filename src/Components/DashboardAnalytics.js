import React, { useRef, useMemo } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import autoTable from 'jspdf-autotable';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale
);

export default function DashboardAnalytics({ results, customHistory }) {
  const chartRef = useRef();

  const totalCounts = useMemo(() => {
    return Object.entries(results).map(([category, apis]) => {
      const pass = apis.filter((r) => r.success).length;
      const fail = apis.length - pass;
      return { category, pass, fail };
    }).concat(customHistory.length > 0 ? [{
      category: 'Custom',
      pass: customHistory.filter(r => r.success).length,
      fail: customHistory.filter(r => !r.success).length
    }] : []);
  }, [results, customHistory]);

  const allApis = useMemo(() => {
    let list = [];
    Object.entries(results).forEach(([category, apis]) => {
      apis.forEach((api) => {
        list.push({
          category,
          name: api.name,
          status: api.status,
          success: api.success,
          error: api.error || '',
          dataSnippet: api.displayBody
            ? JSON.stringify(api.displayBody)
            : (api.success ? JSON.stringify(api.data) : ''),
          correlationId: api.correlationId || '',
        });
      });
    });

    // ✅ Include Custom API test history
    customHistory.forEach((api) => {
      list.push({
        category: 'Custom',
        name: `${api.method} ${api.name}`,
        status: api.status,
        success: api.success,
        error: api.error || '',
        dataSnippet: api.displayBody
          ? JSON.stringify(api.displayBody)
          : (api.success ? JSON.stringify(api.data) : ''),
        correlationId: api.correlationId || '',
      });
    });

    return list;
  }, [results, customHistory]);

  const data = {
    labels: totalCounts.map((d) => d.category),
    datasets: [
      {
        label: 'Pass',
        backgroundColor: '#4ade80',
        data: totalCounts.map((d) => d.pass),
      },
      {
        label: 'Fail',
        backgroundColor: '#f87171',
        data: totalCounts.map((d) => d.fail),
      },
    ],
  };

  const options = {
    responsive: false,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#333' } },
    },
    scales: {
      x: { ticks: { color: '#333' } },
      y: { ticks: { color: '#333' } },
    },
  };

  const downloadPDF = async () => {
    try {
      const chartCanvas = chartRef.current.canvas;
      const chartImg = chartCanvas.toDataURL('image/png');

      const pdf = new jsPDF('p', 'mm', 'a4');
      pdf.setFontSize(18);
      pdf.setTextColor(33, 33, 33);
      pdf.text('API Test Analytics Report', 10, 15);

      // Chart image at top
      pdf.addImage(chartImg, 'PNG', 10, 20, 190, 80); // height ~80mm

      // Table starts below the chart
      autoTable(pdf, {
        startY: 105, // starts just below chart
        head: [['Category', 'API Name', 'Status Code', 'Result', 'Error / Snippet', 'Correlation ID']],
        body: allApis.map(api => [
          api.category,
          api.name,
          api.status,
          api.success ? 'PASS' : 'FAIL',
          api.dataSnippet,
          api.correlationId || ''
        ]),
        styles: {
          fontSize: 8,
          cellPadding: 2,
          overflow: 'linebreak',
        },
        headStyles: {
          fillColor: [35, 24, 161],
          textColor: 255,
          fontStyle: 'bold'
        },
        bodyStyles: {
          textColor: 50
        }
      });

      pdf.save('api-test-report.pdf');
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      alert('Error generating PDF. See console for details.');
    }
  };

  const exportToExcel = () => {
    const rows = [];
    Object.entries(results).forEach(([category, apis]) => {
      apis.forEach(api => {
        rows.push({
          Category: category,
          'API Name': api.name,
          'Status Code': api.status,
          Result: api.success ? 'PASS' : 'FAIL',
          'Response / Error': api.displayBody
            ? JSON.stringify(api.displayBody)
            : (api.success ? JSON.stringify(api.data) : api.error),
          'Correlation ID': api.correlationId || '',
        });
      });
    });

    const sheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "Results");
    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([buffer]), 'api-results.xlsx');
  };

  return (
    <div className="analytics-section">
      <hr className="section-divider" />
      <h3>API Test Analytics</h3>

      {totalCounts.length > 0 && (
        <div style={{ width: 600, height: 300 }}>
          <Bar
            ref={chartRef}
            data={data}
            options={options}
            width={600}
            height={300}
          />
        </div>
      )}

      <div className="analytics-table-container">
        <table className="analytics-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>API Name</th>
              <th>Status Code</th>
              <th>Result</th>
              <th>Error / Response Snippet</th>
              <th>Correlation ID</th>
            </tr>
          </thead>
          <tbody>
            {allApis.length === 0 ? (
              <tr>
                <td colSpan={5} className="center" style={{ padding: '12px' }}>
                  No API results yet
                </td>
              </tr>
            ) : (
              allApis.map((api, i) => (
                <tr key={i} className={api.success ? 'result-pass' : 'result-fail'}>
                  <td>{api.category}</td>
                  <td>{api.name}</td>
                  <td className="center">{api.status}</td>
                  <td className="center">
                    {api.success ? (
                      <span className="pass-icon">
                        PASS&nbsp;<i className="fa fa-check-circle" aria-hidden="true"></i>
                      </span>
                    ) : (
                      <span className="fail-icon">
                        FAIL&nbsp;<i className="fa fa-times-circle" aria-hidden="true"></i>
                      </span>
                    )}
                  </td>
                  <td className="snippet">{api.dataSnippet}</td>
                  <td>{api.correlationId || 'N/A'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <button
        onClick={downloadPDF}
        className="api-button export-button"
        style={{ marginTop: 15, alignSelf: 'flex-start' }}
      >
        Download PDF Report
      </button>

      <button
        onClick={exportToExcel}
        className="api-button export-button"
        style={{ marginTop: 15, marginLeft: 10, alignSelf: 'flex-start' }}
      >
        Export to Excel
      </button>
    </div>
  );
}
