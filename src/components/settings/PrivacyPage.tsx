import { useNavigate } from 'react-router-dom';

export default function PrivacyPage() {
  const navigate = useNavigate();
  return <main className="max-w-2xl mx-auto p-6 space-y-5 text-sm leading-relaxed">
    <button className="text-amber-400 p-2" onClick={() => navigate(-1)}>Back</button>
    <h1 className="text-2xl font-semibold text-white">PackLight privacy</h1>
    <p>Effective October 19, 2026 · Version 1.0.0</p>
    <p>PackLight is a personal reflection tool, not a medical service. Entries are not monitored.</p>
    <h2 className="text-lg text-white">Your device, your data</h2>
    <p>Items, journals, mood and recovery ratings, history, and preferences stay on your device. There are no accounts, analytics, advertising, tracking SDKs, or automatic cloud sync. PackLight does not request contacts, location, camera, or microphone access. Data is not separately encrypted by PackLight; protect access to your device.</p>
    <p>Uninstalling or clearing browser data can erase your pack. Android app backups and device transfer are disabled. iOS system backups may include app data according to your device settings. Export your own backups to keep a copy.</p>
    <h2 className="text-lg text-white">Optional AI</h2>
    <p>AI requires your own Anthropic API key and explicit consent for the current session. Save &amp; Analyze sends the journal text and mood directly to Anthropic. Agent chat sends your message and the names, descriptions, categories, weights, and utility ratings of items linked to that reminder. Save Entry stays local. PackLight does not automatically send your whole pack.</p>
    <p>Anthropic receives your request and network information such as your IP address. Its API terms, privacy policy, and charges apply. AI can be inaccurate and is not medical advice. The key stays only in memory; disable AI in Settings or restart the app to remove it. It is never included in a backup.</p>
    <a className="text-amber-400 underline" href="https://www.anthropic.com/legal/privacy" target="_blank" rel="noreferrer">Anthropic privacy policy</a>
    <h2 className="text-lg text-white">Exports and deletion</h2>
    <p>Export Pack creates an unencrypted JSON file. Anyone who has it can read it. On mobile you choose a destination with the system share sheet. Temporary export files are removed after sharing completes; copies you save or send remain at their destinations.</p>
    <p>Clear All Data deletes this app's pack and AI key on this device. It cannot delete exported files, OS backups, or data already processed by Anthropic. Contact Anthropic for requests about data sent to its service. PackLight has no server copy.</p>
    <h2 className="text-lg text-white">Support</h2>
    <p>Use the public issue tracker for support or privacy questions. Do not post journals, backup files, API keys, or other sensitive information. External links have their own privacy policies.</p>
    <a className="text-amber-400 underline" href="https://github.com/MrPickering/PackLight/issues" target="_blank" rel="noreferrer">PackLight support</a>
  </main>;
}
