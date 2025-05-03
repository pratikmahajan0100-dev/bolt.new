/**
 * DMCA Takedown Notice Generator
 * Copyright (c) 2024 Ervin Remus Radosavlevici
 * All rights reserved.
 * Contact: radosavlevici.ervin@gmail.com
 */

import { useState } from 'react';
import { generateDMCANotice, generateGitHubDMCANotice, getDMCAInstructions } from '~/utils/dmca';

export default function DMCAPage() {
  const [noticeType, setNoticeType] = useState<'github' | 'general'>('github');
  const [infringingUrl, setInfringingUrl] = useState('');
  const [originalUrl, setOriginalUrl] = useState('');
  const [generatedNotice, setGeneratedNotice] = useState('');
  
  const handleGenerate = () => {
    if (!infringingUrl || !originalUrl) {
      alert('Please fill in both URLs');
      return;
    }
    
    if (noticeType === 'github') {
      // Extract repo names from GitHub URLs
      const infringingRepo = infringingUrl.replace('https://github.com/', '').replace(/\/$/, '');
      const originalRepo = originalUrl.replace('https://github.com/', '').replace(/\/$/, '');
      setGeneratedNotice(generateGitHubDMCANotice(infringingRepo, originalRepo));
    } else {
      setGeneratedNotice(generateDMCANotice(infringingUrl, originalUrl));
    }
  };
  
  const handleCopy = () => {
    navigator.clipboard.writeText(generatedNotice);
    alert('DMCA notice copied to clipboard');
  };
  
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">DMCA Takedown Notice Generator</h1>
      <p className="mb-4 text-red-600">
        <strong>Copyright Protection Tool</strong><br />
        For Ervin Remus Radosavlevici (radosavlevici.ervin@gmail.com)
      </p>
      
      <div className="mb-6 p-4 bg-gray-100 rounded">
        <h2 className="text-lg font-semibold mb-2">Instructions</h2>
        <pre className="whitespace-pre-wrap text-sm">{getDMCAInstructions()}</pre>
      </div>
      
      <div className="mb-6">
        <label className="block mb-2 font-medium">Notice Type:</label>
        <div className="flex gap-4">
          <label className="flex items-center">
            <input
              type="radio"
              name="noticeType"
              checked={noticeType === 'github'}
              onChange={() => setNoticeType('github')}
              className="mr-2"
            />
            GitHub Repository
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="noticeType"
              checked={noticeType === 'general'}
              onChange={() => setNoticeType('general')}
              className="mr-2"
            />
            General Website
          </label>
        </div>
      </div>
      
      <div className="mb-4">
        <label className="block mb-2 font-medium">
          {noticeType === 'github' ? 'Infringing GitHub Repository URL:' : 'Infringing Content URL:'}
        </label>
        <input
          type="text"
          value={infringingUrl}
          onChange={(e) => setInfringingUrl(e.target.value)}
          placeholder={noticeType === 'github' ? 'https://github.com/username/repo' : 'https://example.com/infringing-page'}
          className="w-full p-2 border rounded"
        />
      </div>
      
      <div className="mb-6">
        <label className="block mb-2 font-medium">
          {noticeType === 'github' ? 'Your Original GitHub Repository URL:' : 'Your Original Content URL:'}
        </label>
        <input
          type="text"
          value={originalUrl}
          onChange={(e) => setOriginalUrl(e.target.value)}
          placeholder={noticeType === 'github' ? 'https://github.com/radosavlevici/repo' : 'https://yoursite.com/original-content'}
          className="w-full p-2 border rounded"
        />
      </div>
      
      <div className="mb-6">
        <button
          onClick={handleGenerate}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Generate DMCA Notice
        </button>
      </div>
      
      {generatedNotice && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold">Generated DMCA Notice:</h2>
            <button
              onClick={handleCopy}
              className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm"
            >
              Copy to Clipboard
            </button>
          </div>
          <pre className="p-4 bg-gray-100 rounded whitespace-pre-wrap border">{generatedNotice}</pre>
        </div>
      )}
      
      <div className="mt-8 text-sm text-gray-500">
        <p>
          This tool is provided to help protect your intellectual property rights.
          The generated notices are templates and may need to be customized for your specific situation.
        </p>
        <p className="mt-2">
          Copyright (c) 2024 Ervin Remus Radosavlevici. All rights reserved.
        </p>
      </div>
    </div>
  );
}