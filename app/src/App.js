import React, { useState } from 'react';
import axios from 'axios';

import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material';

import DataTable from './components/DataTable';
import { parseFileContents } from './utils/fileParser';
import { API_URL } from './constants/api';

function App() {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [naturalLanguageQuery, setNaturalLanguageQuery] = useState('');
  const [originalData, setOriginalData] = useState([]);
  const [processedData, setProcessedData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = async (event) => {
    const selectedFile = event.target.files[0];
    setProcessedData([]);
    setOriginalData([]);
    setHeaders([]);
    setError('');

    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
      setIsLoading(true);
      try {
        const { headers: parsedHeaders, data: parsedData } = await parseFileContents(selectedFile);
        if (parsedData.length === 0 && parsedHeaders.length === 0) {
            setError('File is empty or could not be parsed properly.');
            setOriginalData([]);
            setHeaders([]);
        } else {
            setHeaders(parsedHeaders);
            setOriginalData(parsedData);
        }
      } catch (err) {
        setError(String(err.message || err));
        setFile(null);
        setFileName('');
        setOriginalData([]);
        setHeaders([]);
      } finally {
        setIsLoading(false);
      }
    } else {
      setFile(null);
      setFileName('');
    }
  };

  const handleProcessData = async () => {
    if (!originalData.length) {
      setError('Please upload and parse a file first.');
      return;
    }
    if (!naturalLanguageQuery) {
      setError('Please enter a natural language instruction.');
      return;
    }

    setIsLoading(true);
    setError('');
    setProcessedData([]);

    try {
      const payload = {
        natural_language_query: naturalLanguageQuery,
        headers: headers,
        data: originalData,
      };

      const response = await axios.post(API_URL, payload);

      if (response.data && response.data.processed_data) {
        setProcessedData(response.data.processed_data);
        setOriginalData(response.data.processed_data || originalData);
        if(response.data.headers) {
            setHeaders(response.data.headers);
        }
      } else {
        throw new Error('API response did not contain processed_data field.');
      }
    } catch (err) {
      console.error("Overall processing error:", err);
      const apiErrorMessage = err.response?.data?.detail || err.response?.data?.error || err.message;
      setError(`Processing failed: ${apiErrorMessage}`);
      setProcessedData([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Typography variant="h5" component="h1" gutterBottom align="center">
          CSV/Excel Data Replacer
        </Typography>
      </Paper>

      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box>
            <Button
              variant="outlined"
              component="label"
              fullWidth
            >
              Upload CSV/Excel File
              <input
                type="file"
                hidden
                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                onChange={handleFileChange}
              />
            </Button>
            {fileName && <Typography variant="caption" display="block" sx={{ textAlign: 'center', mt: 0.5 }}>Selected: {fileName}</Typography>}
          </Box>

          <TextField
            fullWidth
            label="Natural Language Instruction"
            variant="outlined"
            value={naturalLanguageQuery}
            onChange={(e) => setNaturalLanguageQuery(e.target.value)}
            size="small"
            helperText="e.g., Find email addresses in the Email column and replace them with 'REDACTED'"
          />

          <Button
            variant="contained"
            onClick={handleProcessData}
            disabled={!originalData.length || !naturalLanguageQuery || isLoading}
            fullWidth
          >
            {isLoading && originalData.length > 0 ? 'Processing...' : (isLoading ? 'Parsing...' : 'Process Data')}
          </Button>
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', my: 3 }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>
            {originalData.length > 0 && file ? "Processing data with API..." : (file ? "Parsing file..." : "Loading...")}
          </Typography>
        </Box>
      )}

      {!isLoading && originalData.length > 0 && processedData.length === 0 && (
        <Paper elevation={1} sx={{ p: 2, mt: 2 }}>
          <Typography variant="h6" component="h2" gutterBottom>
            Original Data Preview ({originalData.length} rows)
          </Typography>
          <DataTable headers={headers} data={originalData} />
        </Paper>
      )}

      {!isLoading && processedData.length > 0 && (
        <Paper elevation={1} sx={{ p: 2, mt: 2 }}>
          <Typography variant="h6" component="h2" gutterBottom>
            Processed Data ({processedData.length} rows)
          </Typography>
          <DataTable headers={headers} data={processedData} />
        </Paper>
      )}
    </Container>
  );
}

export default App;