const axios = require('axios');

exports.triggerAIScan = async (fragmentId) => {
  try {
    const response = await axios.post(`${process.env.AI_SERVICE_URL}/api/segmentation`, {
      fragmentId
    });
    return response.data;
  } catch (err) {
    console.error(`[AI-SERVICE] Failed to contact AI engine for ${fragmentId}: ${err.message}`);
    return null;
  }
};
