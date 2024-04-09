import JSZip from 'jszip';
import mime from 'mime';

export function classNames(...list: (string | void)[]) {
  return list.filter(Boolean).join(' ');
}
export async function getFilesZip(file: File, onProgress?: (doneCount: number, total: number | null) => void): Promise<Record<string, string>> {
  if (file.type !== 'application/x-zip-compressed') throw new Error(`getFilesZip(): 传入文件类型有误(${file.type})`);
  try {
    const jz = new JSZip();
    onProgress?.(0, null);
    const zip = await jz.loadAsync(file);
    const filesCode: Record<string, string> = {};
    let count = 0;
    const promiseList = Object.values(zip.files).map(async (zipEntry: JSZip.JSZipObject) => {
      const content = await zipEntry.async('base64');
      const name = zipEntry.name;
      const type = mime.lookup(name);
      const code = `data:${type};base64,${content}`;
      filesCode[name] = code;
      onProgress?.(++count, promiseList.length);
    });
    await Promise.all(promiseList);
    return filesCode;
  } catch (error) {
    throw error;
  }
}
