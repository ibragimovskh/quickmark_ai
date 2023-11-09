const express = require('express')
const mongoose = require('mongoose')


main().catch(err => console.log(err));

async function main() {
  await mongoose.connect('');

  // use `await mongoose.connect('mongodb://user:password@127.0.0.1:27017/test');` if your database has auth enabled
}

/**
 *  0: disconnected
    1: connected
    2: connecting
    3: disconnecting
 */
const kittySchema = new mongoose.Schema({
    name: String
});
const Kitten = mongoose.model('Kitten', kittySchema);
const silence = new Kitten({ name: 'Silence' });
console.log(silence.name); // 'Silence'
// initialize the app
const app = express()

app.get('/', function (req, res) {
  res.send('Hello World')
})

app.listen(3000)
