import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export const parseFileContents = (fileToParse) => {
  return new Promise((resolve, reject) => {
    if (!fileToParse) {
      reject(new Error('Please select a file first.'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        let parsedRows = [];
        let parsedHeaders = [];
        if (fileToParse.name.endsWith('.csv')) {
          const result = Papa.parse(e.target.result, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: false,
            transformHeader: header => header.trim(),
          });
          parsedHeaders = result.meta.fields || [];
          parsedRows = result.data.map(row => {
              const newRow = {};
              parsedHeaders.forEach(header => {
                  newRow[header] = row[header] !== undefined ? String(row[header]) : "";
              });
              return newRow;
          });
        } else if (fileToParse.name.endsWith('.xlsx') || fileToParse.name.endsWith('.xls')) {
          const workbook = XLSX.read(e.target.result, { type: 'array', cellNF: false, cellText: true });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, defval: "" });

          if (rawData.length > 0) {
              parsedHeaders = rawData[0].map(String);
              parsedRows = rawData.slice(1).map(rowArray => {
                  let rowObject = {};
                  parsedHeaders.forEach((header, index) => {
                      rowObject[header] = rowArray[index] !== undefined ? String(rowArray[index]) : "";
                  });
                  return rowObject;
              });
          } else {
              parsedHeaders = [];
              parsedRows = [];
          }
        } else {
          reject(new Error('Unsupported file type. Please upload a CSV or Excel file.'));
          return;
        }

        if (parsedHeaders.length === 0 && parsedRows.length > 0 && parsedRows[0]) {
          parsedHeaders = Object.keys(parsedRows[0]);
        }

        resolve({ headers: parsedHeaders, data: parsedRows.map(row => ({ ...row })) });
      } catch (err) {
        console.error("Parsing error:", err);
        reject(new Error(`Error parsing file: ${err.message}`));
      }
    };
    reader.onerror = () => {
      reject(new Error('Error reading file.'));
    };

    if (fileToParse.name.endsWith('.csv')) {
      reader.readAsText(fileToParse);
    } else {
      reader.readAsArrayBuffer(fileToParse);
    }
  });
};