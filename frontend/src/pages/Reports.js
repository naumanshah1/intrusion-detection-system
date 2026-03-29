import { useState, useEffect } from "react";
import { api } from "../config";

function Reports() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await api.get("/report?period=daily");
        setReport(response.data);
      } catch (err) {
        console.error("Failed to fetch report", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, []);

  const downloadCSV = () => {
    if (!report) return;
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Metric,Value\n"
      + `Period,${report.period}\n`
      + `Total Traffic,${report.total}\n`
      + `Attacks (Anomalies),${report.attacks}\n`
      + `Normal Traffic,${report.normal}`;
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ids_report_${report.period}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const downloadPDF = () => {
    alert("PDF generation using browser print. In a real scenario, use jsPDF or a backend PDF generator.");
    window.print();
  };

  if (loading) return <div className="p-6 text-white text-center">Crunching numbers...</div>;

  return (
    <div className="p-8 min-h-screen bg-gray-900 text-white">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 drop-shadow-lg">
            📄 Executive Reports
          </h1>
          <p className="text-gray-400 mt-2">Generate deep-dive security summaries and export artifacts.</p>
        </div>
        <div className="flex gap-4 print:hidden">
          <button
            onClick={downloadCSV}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-lg text-gray-200"
          >
            📊 Export CSV
          </button>
          <button
            onClick={downloadPDF}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 px-5 py-2.5 rounded-lg text-sm font-bold transition-all shadow-[0_0_15px_rgba(219,39,119,0.5)]"
          >
            📝 Export PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: "Report Period", value: report?.period.toUpperCase(), color: "text-blue-400" },
          { label: "Total Logged Events", value: report?.total, color: "text-white" },
          { label: "Detected Anomalies", value: report?.attacks, color: "text-red-400" },
          { label: "Normal Traffic", value: report?.normal, color: "text-emerald-400" }
        ].map((stat, idx) => (
          <div key={idx} className="bg-gray-800/40 backdrop-blur-md border border-gray-700 p-6 rounded-2xl shadow-xl flex flex-col justify-center items-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-700/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <p className="text-xs font-semibold text-gray-500 tracking-widest uppercase mb-2">{stat.label}</p>
            <p className={`text-4xl font-black ${stat.color} drop-shadow-md`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-gray-800/50 backdrop-blur-md border border-gray-700 p-8 rounded-2xl shadow-xl">
        <h2 className="text-xl font-bold mb-4 border-b border-gray-700 pb-2">Analysis Summary</h2>
        <p className="text-gray-300 leading-relaxed text-lg">
          During the <strong className="text-white">{report?.period}</strong> reporting period, the Intrusion Detection System analyzed a total of <strong className="text-white">{report?.total}</strong> network payload events. 
          The proprietary threat engine identified <strong className="text-red-400">{report?.attacks} anomalous events</strong> requiring remediation, alongside <strong className="text-emerald-400">{report?.normal} standard operations</strong>.
        </p>
        {report?.attacks > (report?.total * 0.1) && (
          <div className="mt-6 p-4 bg-red-900/20 border border-red-500/50 rounded-lg text-red-300">
            ⚠️ <strong>Warning:</strong> The percentage of anomaly traffic exceeds thresholds. Investigation highly recommended.
          </div>
        )}
      </div>
    </div>
  );
}

export default Reports;
