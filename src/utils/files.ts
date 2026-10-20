import { Capacitor } from '@capacitor/core';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

export async function saveFile(name: string, content: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    const file = await Filesystem.writeFile({ path: name, data: content, directory: Directory.Cache, encoding: Encoding.UTF8 });
    try { await Share.share({ title: 'PackLight backup', files: [file.uri] }); }
    finally { await Filesystem.deleteFile({ path: name, directory: Directory.Cache }); }
    return;
  }
  const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
