const express = require('express');
const axios = require('axios');
const app = express();
const PORT = 9876;

// Configuration
const WINDOW_SIZE = 10;
const TIMEOUT_MS = 500;
const NUMBER_TYPES = {
  'p': 'http://20.244.56.144/test/primes',
  'f': 'http://20.244.56.144/test/fibo',
  'e': 'http://20.244.56.144/test/even',
  'r': 'http://20.244.56.144/test/rand'
};

// Global state to store numbers
let windowNumbers = [];

// Helper function to calculate average
const calculateAverage = (numbers) => {
  if (numbers.length === 0) return 0;
  const sum = numbers.reduce((acc, num) => acc + num, 0);
  return parseFloat((sum / numbers.length).toFixed(2));
};

// Fetch numbers from third-party API
const fetchNumbers = async (numberType) => {
  try {
    const response = await axios.get(NUMBER_TYPES[numberType], { timeout: TIMEOUT_MS });
    return response.data.numbers || [];
  } catch (error) {
    console.error(`Error fetching ${numberType} numbers:`, error.message);
    return [];
  }
};

// Process new numbers and update window
const processNumbers = (newNumbers) => {
  const prevState = [...windowNumbers];
  
  // Filter out duplicates and add to window
  newNumbers.forEach(num => {
    if (!windowNumbers.includes(num)) {
      windowNumbers.push(num);
    }
  });
  
  // Trim window to WINDOW_SIZE if needed
  if (windowNumbers.length > WINDOW_SIZE) {
    windowNumbers = windowNumbers.slice(-WINDOW_SIZE);
  }
  
  return prevState;
};

// API endpoint
app.get('/numbers/:numberid', async (req, res) => {
  const numberType = req.params.numberid;
  
  if (!NUMBER_TYPES[numberType]) {
    return res.status(400).json({ error: 'Invalid number type. Use p, f, e, or r' });
  }
  
  const startTime = Date.now();
  
  try {
    const newNumbers = await fetchNumbers(numberType);
    const windowPrevState = processNumbers(newNumbers);
    
    const response = {
      windowPrevState,
      windowCurrState: windowNumbers,
      numbers: newNumbers,
      avg: calculateAverage(windowNumbers)
    };
    
    // Ensure response time is under 500ms
    const elapsedTime = Date.now() - startTime;
    if (elapsedTime < TIMEOUT_MS) {
      res.json(response);
    } else {
      res.status(500).json({ error: 'Request timeout' });
    }
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});