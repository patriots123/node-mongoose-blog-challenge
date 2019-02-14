"use strict";

const mongoose = require("mongoose");

const commentSchema = mongoose.Schema({ content: 'string' });

const authorSchema = mongoose.Schema({
  firstName: 'string',
  lastName: 'string',
  userName: {
    type: 'string',
    unique: true
  }
});

const blogPostSchema = mongoose.Schema({
  title: 'string',
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'Author' },
  content: 'string',
  comments: [commentSchema]
});

blogPostSchema.pre('find', function(next) {
  this.populate('author');
  next();
});

blogPostSchema.pre('findOne', function(next) {
  this.populate('author');
  next();
});

blogPostSchema.virtual("authorNameString").get(function() {
  return `${this.author.firstName} ${this.author.lastName}`.trim();
});

blogPostSchema.methods.serialize = function() {
  return {
    id: this._id,
    title: this.title,
    author: this.authorNameString,
    content: this.content,
    comments: this.comments
  };
};

const BlogPost = mongoose.model("BlogPost", blogPostSchema);
const Author = mongoose.model("Author", authorSchema);

module.exports = {BlogPost,Author};
