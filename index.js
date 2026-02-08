const express = require('express');
const app = express()
// app.use(express.json());

app.get('/', (req, res) => {
   res.send("Valid");
});

// app.use(express.static(__dirname + '/public'));

app.listen(3000, () => console.log('Example app listening on port 3000!'))