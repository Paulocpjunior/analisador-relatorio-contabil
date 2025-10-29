
import { type ParseResult } from '../types.ts';

declare const pdfjsLib: any;
declare const XLSX: any;

export const parseFile = async (file: File, setProgress: (message: string) => void): Promise<ParseResult> => {
  const fileType = file.type;
  
  if (fileType === 'application/pdf') {
    return parsePdf(file, setProgress);
  } else if (fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
    setProgress('Processando planilha...');
    return parseXlsx(file);
  } else {
    throw new Error('Tipo de arquivo não suportado. Por favor, use .pdf ou .xlsx.');
  }
};

const parsePdf = (file: File, setProgress: (message: string) => void): Promise<ParseResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      if (!event.target?.result) {
        return reject(new Error('Falha ao ler o arquivo PDF.'));
      }
      try {
        setProgress('Processando PDF...');
        const pdf = await pdfjsLib.getDocument({ data: event.target.result as ArrayBuffer }).promise;
        let textContent = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          setProgress(`Lendo texto da página ${i} de ${pdf.numPages}...`);
          const page = await pdf.getPage(i);
          const text = await page.getTextContent();
          textContent += text.items.map((s: any) => s.str).join(' ');
        }
        
        if (textContent.trim()) {
            return resolve({ type: 'text', content: textContent });
        }

        // Text extraction failed, try image conversion (OCR path)
        const imageContent: { mimeType: string; data: string }[] = [];
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        if (!context) {
            return reject(new Error('Não foi possível criar um contexto de canvas para processar o PDF.'));
        }

        for (let i = 1; i <= pdf.numPages; i++) {
            setProgress(`Convertendo página ${i} de ${pdf.numPages} para imagem...`);
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better OCR quality
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({ canvasContext: context, viewport }).promise;
            
            const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
            // Gemini API expects raw base64 data, without the data URL prefix
            const base64Data = dataUrl.split(',')[1];
            
            imageContent.push({
                mimeType: 'image/jpeg',
                data: base64Data,
            });
        }
        canvas.remove();

        if (imageContent.length > 0) {
            return resolve({ type: 'images', content: imageContent });
        } else {
            return reject(new Error('O arquivo PDF parece estar vazio ou não pôde ser processado.'));
        }

      } catch (error) {
        console.error('Erro ao processar PDF:', error);
        reject(new Error('Não foi possível extrair o conteúdo do PDF. O arquivo pode estar corrompido ou em um formato não suportado.'));
      }
    };
    reader.onerror = () => {
        reject(new Error("Falha ao ler o arquivo."));
    }
    reader.readAsArrayBuffer(file);
  });
};

const parseXlsx = (file: File): Promise<ParseResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (!event.target?.result) {
        return reject(new Error('Falha ao ler o arquivo XLSX.'));
      }
      try {
        const data = new Uint8Array(event.target.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        let textContent = '';
        workbook.SheetNames.forEach(sheetName => {
          const worksheet = workbook.Sheets[sheetName];
          const json: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
           textContent += json
            .map(row => row.filter(cell => cell !== null && cell !== undefined).join('\t'))
            .filter(rowStr => rowStr.trim() !== '')
            .join('\n') + '\n\n';
        });

        if (!textContent.trim() && workbook.SheetNames.length > 0) {
            return reject(new Error('A planilha parece estar vazia. Verifique se o arquivo contém dados nas abas.'));
        }

        resolve({ type: 'text', content: textContent });
      } catch (error) {
        console.error('Erro ao processar XLSX:', error);
        reject(new Error('Não foi possível extrair dados da planilha. O arquivo pode estar corrompido.'));
      }
    };
    reader.onerror = () => {
        reject(new Error("Falha ao ler o arquivo."));
    };
    reader.readAsArrayBuffer(file);
  });
};