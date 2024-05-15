import axios from 'axios';

export default (router) => {
  router.post('/openai', async (req, res) => {
    if (req.accountability?.user == null) { 
      res.status(403); 
      return res.send(`You don't have permission to access this.`); 
    } 
    
    try {
      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-4',
        messages: [{ role: 'assistant', content: req.body.prompt }],
      }, {
        headers: {
          Authorization: `Bearer ${req.headers.apikey}`,
          'Content-Type': 'application/json',
        },
      });

      res.json(response.data.choices[0].message);
    } catch (err) {
      log(err.message);
      throw new Error(err.message);
    }
  });
};
