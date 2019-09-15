var express = require('express')
var bodyParser = require('body-parser')
var low = require('lowdb')
var FileSync = require('lowdb/adapters/FileSync')

var adapter = new FileSync('db.json')
var db = low(adapter)


// Setup server
var app = express()

var server_port = process.env.PORT || 8080

var server = app.listen(server_port, function(){
  console.log("Connected")
})

// Set body parser
app.use(bodyParser.json({limit: '10mb', extended: true}))
app.use(bodyParser.urlencoded({limit: '10mb', extended: true}))

// Set some defaults (required if your JSON file is empty)
db.defaults({ notes: [], lastIdx: 0})
.write()

// function to add new note with autoincrement
function addNote(text) {
  var count = db.get("lastIdx").value()
  db.get("notes").push({id: count, title: text}).write()
  toReturn = db.get("notes").find({id: count}).value()
  db.update('lastIdx', n => n + 1)
  .write()
  return toReturn
}

// List all notes
app.get('/notes', function (req, res){
  data = db.get("notes")
  content = JSON.stringify(data)
  res.status(200).send(content)
})

// Create a note
app.post("/notes", (req, res) => {
  title = req.body["title"]
  toReturn = addNote(title)
  content = JSON.stringify(toReturn)

  res.status(201).send(content)
})

// Retrieve a note
app.get("/notes/:id?", function(req, res){
  id = Number(req.params.id)
  toReturn = db.get("notes").find({id: id}).value()
  if (toReturn == null) {
    res.status(404).send("NOT FOUND: NOTE WITH SELECTED ID DOES NOT EXIST")
  } else {
    content = JSON.stringify(toReturn)
    res.status(200).send(content)
  }
})

// Update a note
app.put("/notes/:id?", function(req, res){
  id = Number(req.params.id)
  title = req.body["title"]

  db.get("notes").find({id: id}).assign({id: id, title: title}).write()
  toReturn = db.get("notes").find({id: id}).value()
  
  if (toReturn == null) {
    res.status(404).send("NOT FOUND: NOTE WITH SELECTED ID DOES NOT EXIST")
  } else {
    content = JSON.stringify(toReturn)
    res.status(201).send(content)
  }
})

// Remove a note
app.delete("/notes/:id?", function(req, res){
  id = Number(req.params.id)
  notInDatabase = db.get("notes").find({id: id}).value() === null

  if(notInDatabase) {
    res.status(404).send("NOT FOUND: NOTE WITH SELECTED ID DOES NOT EXIST")
  } else {
    db.get("notes").remove({id: id}).write()
    res.status(204).send()
  }
})