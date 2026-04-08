// / <reference lib="webworker" />

import * as XLSX from 'xlsx';

addEventListener('message', async (event) => {
  const { dataChunk, headers, chunkIndex, totalChunks, fileName } = event.data;

  try {
    // Process chunk in worker
    const processedRows = dataChunk.map((row: any) => {
      return headers.map((header) => {
        let value = row[header.dataField];

        // Handle different data types
        if (header.format) {
          if (header.format.type === 'currency') {
            value = value ? `$${value.toFixed(2)}` : '$0.00';
          } else if (header.format.type === 'date') {
            value = value ? new Date(value).toLocaleDateString() : '';
          } else if (header.format.type === 'number') {
            value = value?.toLocaleString() || '0';
          }
        }

        return value || '';
      });
    });

    // Send processed chunk back to main thread
    postMessage({
      success: true,
      processedRows,
      chunkIndex,
      totalChunks,
      fileName,
    });
  } catch (error) {
    postMessage({
      success: false,
      error: error.message,
      chunkIndex,
    });
  }
});
