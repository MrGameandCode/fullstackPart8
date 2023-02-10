//Just as we have learn on chapter 3, we will use dotenv instead of hardcoding the mongo environment.
//We could also use cross-env, but for the shake of simplicity, we will just use 1 environment.
//The properties stored in the .env file are "MONGODB_URI" and "SECRET"
require("dotenv").config();
const { ApolloServer, gql } = require("apollo-server");
const { generateAuthorId } = require("./utils");
const mongoose = require("mongoose");
const Book = require("./models/book");
const Author = require("./models/author");

console.log("connecting to", process.env.MONGODB_URI);

mongoose
  .set("strictQuery", false)
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("connected to MongoDB");
  })
  .catch((error) => {
    console.log("error connecting to MongoDB:", error.message);
  });

const typeDefs = gql`
  type Query {
    bookCount: Int!
    authorCount: Int!
    allBooks(author: String, genre: String): [Book!]!
    allAuthors: [Author!]!
  }
  type Mutation {
    addBook(
      title: String!
      author: String
      published: Int!
      genres: [String!]
    ): Book
    editAuthor(name: String!, setBornTo: Int!): Author
  }
  type Book {
    title: String!
    published: Int!
    author: Author!
    id: ID!
    genres: [String]
  }
  type Author {
    name: String!
    id: ID!
    born: Int
    bookCount: Int
  }
`;

const resolvers = {
  Query: {
    bookCount: async () => await Book.countDocuments(),
    authorCount: async () => await Author.countDocuments(),
    allBooks: async (root, args) => {
      //Probably should be something better, like initialiting an object and then filtering it, but I could not make that work, so this is a workaround.
      if (!args.author && !args.genre) {
        return await Book.find().populate();
      }
      if (args.author && args.genre) {
        const books = await Book.find({ genres: args.genre }).populate(
          "author"
        );
        console.log(books);
        return books.filter((book) => book.author.name == args.author);
      }
      if (args.author) {
        const books = await Book.find().populate("author");
        console.log(books);
        return books.filter((book) => book.author.name == args.author);
      } else {
        return await Book.find({ genres: args.genre }).populate("author");
      }
    },
    allAuthors: async () => await Author.find(),
  },
  Book: {
    author: async (root) => await Author.findById(root.author),
  },
  Mutation: {
    addBook: async (root, args) => {
      if (args.author) {
        let author = await Author.findOne({ name: args.author });
        if (!author) {
          const newAuthor = new Author({
            name: args.author,
            born: 1970,
          });
          await newAuthor.save();
          author = newAuthor;
        }

        const newBook = new Book({
          title: args.title,
          published: args.published,
          author: author,
          genres: args.genres,
        });
        await newBook.save();
        return newBook;
      }
    },
    editAuthor: async (root, args) => {
      let author = await Author.findOne({ name: args.name }).populate();
      if (author) {
        author.born = args.setBornTo;
        await author.update();
        return author;
      }
    },
  },
  Author: {
    bookCount: async (root) => {
      const books = await Book.find().populate("author");
      const total = books.filter((book) => book.author.name === root.name);
      return total.length;
    },
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

server.listen().then(({ url }) => {
  console.log(`Server ready at ${url}`);
});
