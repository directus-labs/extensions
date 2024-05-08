export default (router) => {
	router.get('/', (req, res) => res.send('Hello, World!'));

  /* 
  router.get('/') => { // replace above index route with this
    get api key from env
    take payload
    use payload request to openapi
    returns json payload (ie: text)
  }
  */
};
