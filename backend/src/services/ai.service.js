const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

class AIService {
  constructor() {
    this.baseUrl = process.env.AI_SERVICE_URL || 'http://localhost:8001';
  }

  async analyzeDocument(filePath) {
    try {
      const formData = new FormData();
      formData.append('file', fs.createReadStream(filePath));

      const response = await axios.post(`${this.baseUrl}/analyze`, formData, {
        headers: {
          ...formData.getHeaders(),
        },
      });

      return response.data;
    } catch (error) {
      console.error('AI Service Error:', error.message);
      // Return a default failed report if AI service is down
      return {
        error: 'AI Service unreachable',
        fraudScore: 0,
        isFraudulent: false,
        extractedText: ''
      };
    }
  }
}

module.exports = new AIService();
