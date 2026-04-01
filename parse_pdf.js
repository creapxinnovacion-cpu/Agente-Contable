import fs from 'fs';
import pdf from 'pdf-parse';

async function extractText() {
    try {
        let dataBuffer = fs.readFileSync('C:\\Users\\ale_d\\.gemini\\antigravity\\brain\\0ab5fb30-368d-4805-b9b5-2781f8fa0398\\.tempmediaStorage\\1b941510e6f4d6c2.pdf');
        const data = await pdf(dataBuffer);
        fs.writeFileSync('pdf_text.txt', data.text);
        console.log("PDF text extracted successfully to pdf_text.txt");
    } catch (e) {
        console.error("Error reading PDF:", e);
    }
}

extractText();
