"use strict";

const mongoose = require("mongoose");

const blogPostSchema = mongoose.Schema({
  title: {type: String, required: true},
  author: {
    firstName: String,
    lastName: String
  },
  content: {type: String, required: true},
  created: {type: Date, default: Date.now}
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
    created: this.created
  };
};

const BlogPost = mongoose.model("BlogPost", blogPostSchema);

module.exports = {BlogPost};
