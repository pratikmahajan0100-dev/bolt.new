/**
 * Recovery Dashboard
 * Copyright (c) 2024 Ervin Remus Radosavlevici
 * All rights reserved.
 * Contact: radosavlevici.ervin@gmail.com
 */

import { useState, useEffect } from 'react';
import { 
  scanForCodeTheft, 
  reportRepository, 
  getReportedRepositories,
  isScanDue
} from '~/utils/autoRecovery';
import { generateGitHubDMCANotice } from '~/utils/dmca';

export default function RecoveryDashboard() {
  const [repoUrl, setRepoUrl] = useState('');
  const [reportedRepos, setReportedRepos] = useState<Array<{repoUrl: string, date: string}>>([]);
  const [lastScanDate, setLastScanDate] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanDue, setScanDue] = useState(false);
  const [dmcaNotice, setDmcaNotice] = useState('');
  
  // Load reported repositories and last scan date
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setReportedRepos(getReportedRepositories());
      
      const lastScan = localStorage.getItem('lastCodeTheftScan');
      setLastScanDate(lastScan);
      setScanDue(isScanDue());
    }
  }, []);
  
  // Handle manual scan
  const handleScan = async () => {
    setIsScanning(true);
    await scanForCodeTheft();
    
    // Update last scan date
    const newLastScan = localStorage.getItem('lastCodeTheftScan');
    setLastScanDate(newLastScan);
    setScanDue(false);
    setIsScanning(false);
  };
  
  // Handle repository report
  const handleReport = async () => {
    if (!repoUrl) {
      alert('Please enter a repository URL');
      return;
    }
    
    await reportRepository(repoUrl);
    setRepoUrl('');
    setReportedRepos(getReportedRepositories());
  };
  
  // Generate DMCA notice
  const handleGenerateDMCA = () => {
    if (!repoUrl) {
      alert('Please enter a repository URL');
      return;
    }
    
    // Extract repo name from URL
    const repoName = repoUrl.replace('https://github.com/', '').replace(/\/$/, '');
    const originalRepo = 'radosavlevici/bolt.new'; // Default to this repo
    
    const notice = generateGitHubDMCANotice(repoName, originalRepo);
    setDmcaNotice(notice);
  };
  
  // Copy DMCA notice to clipboard
  const handleCopyDMCA = () => {
    navigator.clipboard.writeText(dmcaNotice);
    alert('DMCA notice copied to clipboard');
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return 'Unknown date';
    }
  };
  
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6 border-b pb-4">
        <h1 className="text-2xl font-bold mb-2">Code Recovery Dashboard</h1>
        <p className="text-red-600 font-semibold">
          Copyright Protection for Ervin Remus Radosavlevici
        </p>
        <p className="text-gray-600">
          Contact: radosavlevici.ervin@gmail.com
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4">Automatic Scanning</h2>
          
          <div className="mb-4">
            <p className="mb-2">
              <strong>Last scan:</strong> {lastScanDate ? formatDate(lastScanDate) : 'Never'}
            </p>
            <p className="mb-4">
              <strong>Status:</strong> {scanDue ? 
                <span className="text-red-500">Scan due</span> : 
                <span className="text-green-500">Up to date</span>
              }
            </p>
            
            <button
              onClick={handleScan}
              disabled={isScanning}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
            >
              {isScanning ? 'Scanning...' : 'Run Manual Scan'}
            </button>
          </div>
          
          <div className="mt-6">
            <h3 className="font-semibold mb-2">How It Works</h3>
            <p className="text-sm text-gray-600">
              The automatic scanning system periodically checks for unauthorized copies of your code.
              When potential theft is detected, it will be listed in the reported repositories section.
            </p>
          </div>
        </div>
        
        <div className="border rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4">Report Repository</h2>
          
          <div className="mb-4">
            <label className="block mb-2">
              Repository URL to report:
            </label>
            <input
              type="text"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/username/repo"
              className="w-full p-2 border rounded mb-4"
            />
            
            <div className="flex gap-2">
              <button
                onClick={handleReport}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Report Repository
              </button>
              
              <button
                onClick={handleGenerateDMCA}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Generate DMCA
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {dmcaNotice && (
        <div className="mt-6 border rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-semibold">DMCA Takedown Notice</h2>
            <button
              onClick={handleCopyDMCA}
              className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm"
            >
              Copy to Clipboard
            </button>
          </div>
          <pre className="p-4 bg-gray-100 rounded whitespace-pre-wrap border text-sm overflow-auto max-h-80">
            {dmcaNotice}
          </pre>
        </div>
      )}
      
      <div className="mt-6 border rounded-lg p-4">
        <h2 className="text-xl font-semibold mb-4">Reported Repositories</h2>
        
        {reportedRepos.length === 0 ? (
          <p className="text-gray-500">No repositories have been reported yet.</p>
        ) : (
          <ul className="divide-y">
            {reportedRepos.map((repo, index) => (
              <li key={index} className="py-3">
                <div className="flex justify-between">
                  <a 
                    href={repo.repoUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {repo.repoUrl}
                  </a>
                  <span className="text-gray-500 text-sm">
                    {formatDate(repo.date)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      <div className="mt-8 text-sm text-gray-500">
        <p>
          This dashboard helps you monitor and recover your intellectual property.
          The automatic scanning system runs periodically to detect potential code theft.
        </p>
        <p className="mt-2">
          Copyright (c) 2024 Ervin Remus Radosavlevici. All rights reserved.
        </p>
      </div>
    </div>
  );
}