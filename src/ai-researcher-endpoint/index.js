import axios from 'axios';
// import OpenAI from "openai";

// const openai = new OpenAI();

export default (router) => {
	router.get('/', (req, res) => {
    console.log('dgl router.get');
    res.send('Hello, World!');
  });

  router.get('/openai', async (req, res) => {
    try {
      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-4',
        messages: [{ role: "system", content: "You are a helpful assistant." }],
      }, {
        headers: {
          Authorization: `Bearer ${req.headers.apiKey}`,
          'Content-Type': 'application/json',
        },
      });
      res.send(`Hello ${req.headers.apiKey}`);
    } catch (err) {
      log(err.message);
      throw new Error(err.message);
    }
  });

  /* 
  router.get('/') => { // replace above index route with this
    get api key from env
    take payload
    use payload request to openapi
    returns json payload (ie: text)
  }
  */
};
