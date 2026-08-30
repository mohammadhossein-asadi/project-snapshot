import React from 'react';
import { ShieldCheck, ShieldAlert, Lock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { ScannedFile } from '../types';

interface SecretAuditProps {
  files: ScannedFile[];
}

export const SecretAudit: React.FC<SecretAuditProps> = ({ files }) => {
  const secretFiles = files.filter(f => f.secretInfo.hasSecrets);

  return (
    <div className="space-y-6">
      {/* Security Banner */}
      <div className={`p-5 rounded-xl border flex items-start gap-4 ${
        secretFiles.length > 0
          ? 'bg-amber-950/20 border-amber-500/30 text-amber-200'
          : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
      }`}>
        <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 shrink-0">
          {secretFiles.length > 0 ? (
            <ShieldAlert className="w-6 h-6 text-amber-400" />
          ) : (
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
          )}
        </div>

        <div>
          <h3 className="text-sm font-bold text-white">
            {secretFiles.length > 0
              ? `${secretFiles.length} Sensitive File(s) Detected & Masked`
              : 'Zero Secret Leaks Detected'}
          </h3>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            Project Snapshot checks for protected secret filenames (.env, id_rsa, credentials.json) and scans source text for high-risk token patterns (AWS keys, GitHub PATs, Google API keys, OpenAI keys, Slack tokens, passwords).
            All detected files are masked so your secrets are never exposed in generated Markdown or JSON manifests.
          </p>
        </div>
      </div>

      {/* Secret Files Breakdown */}
      {secretFiles.length > 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
          <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Flagged Files & Reason
            </span>
            <span className="text-xs font-mono text-amber-400 font-semibold">
              {secretFiles.length} item(s) protected
            </span>
          </div>

          <div className="divide-y divide-slate-800/60">
            {secretFiles.map((file) => (
              <div key={file.path} className="p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-mono font-bold text-white">{file.path}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                      {file.sizeHuman}
                    </span>
                  </div>

                  <span className="text-xs font-mono text-slate-400">
                    SHA: {file.sha256.substring(0, 16)}...
                  </span>
                </div>

                <div className="text-xs text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-800/80 space-y-1.5">
                  {file.secretInfo.isSecretFile && (
                    <div className="flex items-center gap-1.5 text-amber-400">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>Matches protected secret filename rule (e.g. .env or credential file).</span>
                    </div>
                  )}

                  {file.secretInfo.contentSecrets.map((det, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-slate-300 font-mono text-[11px]">
                      <span className="text-slate-500">Line {det.line}:</span>
                      <span className="text-amber-400 font-semibold">{det.snippet}</span>
                      <span className="text-slate-600 text-[10px]">({det.pattern})</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center flex flex-col items-center justify-center gap-2">
          <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          <div className="text-sm font-semibold text-slate-200">No Secrets Found</div>
          <div className="text-xs text-slate-400 max-w-sm">
            All scanned files are free of known secret patterns and sensitive file extensions.
          </div>
        </div>
      )}

      {/* Security Best Practices Info */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
          Protected Secret Patterns & Filenames Reference
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs text-slate-400">
          <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800">
            <strong className="text-slate-200 block mb-1">Environment & Configs</strong>
            <code>.env, .env.local, .npmrc, .pypirc</code>
          </div>
          <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800">
            <strong className="text-slate-200 block mb-1">Keys & Certificates</strong>
            <code>id_rsa, *.pem, *.key, serviceAccountKey.json</code>
          </div>
          <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800">
            <strong className="text-slate-200 block mb-1">API Tokens & Secrets</strong>
            <code>ghp_*, AIza*, sk-*, AKIA*, xoxb-*</code>
          </div>
        </div>
      </div>
    </div>
  );
};
