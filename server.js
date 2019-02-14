"use strict";

const express = require("express");
const mongoose = require("mongoose");

mongoose.Promise = global.Promise;

const {PORT, DATABASE_URL} = require("./config");
const {BlogPost,Author} = require("./models");

const app = express();
app.use(express.json());


app.get("/authors", (req,res) => {
  Author.find()
  .then(authors => {
    res.json(authors.map(author => {
      return {
        id: author._id,
        name: `${author.firstName} ${author.lastName}`,
        userName: author.userName
      };
    }));
  })
});

app.post("/authors", (req, res) => {
  const requiredFields = ["firstName", "lastName", "userName"];
  for (let i = 0; i < requiredFields.length; i++) {
    const field = requiredFields[i];
    if (!(field in req.body)) {
      const message = `Missing \`${field}\` in request body`;
      console.error(message);
      return res.status(400).send(message);
    }
  }

  Author.findOne({username: req.body.userName})
  .then(author => {
    if (author) {
      res.status(400).json({message: "username taken"})
    } else {
      Author.create({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        userName: req.body.userName
      })
      .then(author => res.status(201).json({
        _id: author.id,
        name: `${author.firstName} ${author.lastName}`,
        userName: author.userName
      }))
      .catch(err => res.status(500).json({ message: "Internal server error" }))
    }
  })
  .catch(err => res.status(500).json({ message: "something went wrong"}));
});

app.put("/authors/:id", (req, res) => {
  if (!(req.params.id && req.body.id && req.params.id === req.body.id)) {
    return res.status(400).json({ message: "ids dont match in params and body" });
  }

  const toUpdate = {};
  const updateableFields = ["firstName", "lastName", "userName"];

  updateableFields.forEach(field => {
    if (field in req.body) {
      toUpdate[field] = req.body[field];
    }
  });

  Author
  .findOne({userName: toUpdate.userName})
  .then(author => {
    if (author) {
      const message = `Username already taken`;
      console.error(message);
      return res.status(400).send(message);
    } else {
      Author.findByIdAndUpdate(req.params.id, { $set: toUpdate }, { new: true })
      .then(updatedAuthor => res.status(200).json({
        id: updatedAuthor.id,
        name: `${updatedAuthor.firstName} ${updatedAuthor.lastName}`,
        userName: updatedAuthor.userName
      }))
    }
  })
  .catch(err => res.status(500).json({message: "something went wrong"}))
});


app.delete("/authors/:id", (req, res) => {
  BlogPost.remove({author: req.params.id})
  .then(() => {
    Author.findByIdAndRemove(req.params.id)
    .then(() => res.status(204).json({ message:'success'}))
  })
  .catch(err => res.status(500).json({message: "Something went wrong"}));
});





//get all blog posts
app.get("/blog-posts", (req, res) => {
  BlogPost.find()
  .then(blogPosts => {
    res.json(blogPosts.map(post => {
      return {
        id: post._id,
        author: post.authorName,
        content: post.content,
        title: post.title
      };
    }));
  })
  .catch(err => {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  });
});

//get blog post by ID
app.get("/blog-posts/:id", (req, res) => {
    BlogPost
    .findById(req.params.id)
    .then(blogPost => res.json(blogPost.serialize()))
    .catch(err => {
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    });
});

//create blog post
app.post("/blog-posts", (req, res) => {
  const requiredFields = ["title", "content", "author_id"];
  for (let i = 0; i < requiredFields.length; i++) {
    const field = requiredFields[i];
    if (!(field in req.body)) {
      const message = `Missing \`${field}\` in request body`;
      console.error(message);
      return res.status(400).send(message);
    }
  }

  Author.findById(req.body.author_id)
  .then(author => {
    if (author) {
      BlogPost.create({
        title: req.body.title,
        content: req.body.content,
        author: req.body.author
      })
      //.then(blogPost => res.status(201).json(blogPost.serialize()))
      .then(blogPost => res.status(201).json({
        id: blogPost.id,
        author: `${author.firstName} ${author.lastName}`,
        content: blogPost.content,
        title: blogPost.title,
        comments: blogPost.comments
      }))
      .catch(err => {
        console.error(err);
        res.status(500).json({ message: "Internal server error" });
      });
    } else {
      return res.status(400).json({message: "author id not found"})
    }
  })
  .catch(err => res.status(500).json({message: "something went wrong"}))
});

//update blog post by ID
app.put("/blog-posts/:id", (req, res) => {
  if (!(req.params.id && req.body.id && req.params.id === req.body.id)) {
    const message =
      `Request path id (${req.params.id}) and request body id ` +
      `(${req.body.id}) must match`;
    console.error(message);
    return res.status(400).json({ message: message });
  }

  const toUpdate = {};
  const updateableFields = ["title", "content", "author","publishDate"];

  updateableFields.forEach(field => {
    if (field in req.body) {
      toUpdate[field] = req.body[field];
    }
  });

  BlogPost
    // all key/value pairs in toUpdate will be updated -- that's what `$set` does
    .findByIdAndUpdate(req.params.id, { $set: toUpdate })
    .then(blogPost => res.status(204).end())
    .catch(err => res.status(500).json({ message: "Internal server error" }));
});

//delete blog post by ID
app.delete("/blog-posts/:id", (req, res) => {
    BlogPost.findByIdAndRemove(req.params.id)
    .then(restaurant => res.status(204).end())
    .catch(err => res.status(500).json({ message: "Internal server error" }));
});

// catch-all endpoint if client makes request to non-existent endpoint
app.use("*", function(req, res) {
  res.status(404).json({ message: "Not Found" });
});


//functions for integration tests
let server;

function runServer(databaseUrl, port = PORT) {
  return new Promise((resolve, reject) => {
    mongoose.connect(
      databaseUrl,
      err => {
        if (err) {
          return reject(err);
        }
        server = app
          .listen(port, () => {
            console.log(`Your app is listening on port ${port}`);
            resolve();
          })
          .on("error", err => {
            mongoose.disconnect();
            reject(err);
          });
      }
    );
  });
}

function closeServer() {
  return mongoose.disconnect().then(() => {
    return new Promise((resolve, reject) => {
      console.log("Closing server");
      server.close(err => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  });
}

if (require.main === module) {
  runServer(DATABASE_URL).catch(err => console.error(err));
}

module.exports = { app, runServer, closeServer };
