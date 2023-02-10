//Just as we have learn on chapter 3, we will use dotenv instead of hardcoding the mongo environment.
//We could also use cross-env, but for the shake of simplicity, we will just use 1 environment.
//The properties stored in the .env file are "MONGODB_URI", "SECRET" and "JWT_SECRET"
require("dotenv").config();
const {
  ApolloServer,
  gql,
  UserInputError,
  AuthenticationError,
} = require("apollo-server");
const mongoose = require("mongoose");
const Book = require("./models/book");
const Author = require("./models/author");
const User = require("./models/user");
const jwt = require("jsonwebtoken");

console.log("connecting to", process.env.MONGODB_URI);
const JWT_SECRET = process.env.MONGODB_URI;

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
    me: User
  }
  type Mutation {
    addBook(
      title: String!
      author: String
      published: Int!
      genres: [String!]
    ): Book
    editAuthor(name: String!, setBornTo: Int!): Author
    createUser(username: String!, favouriteGenre: String!): User
    login(username: String!, password: String!): Token
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
  type User {
    username: String!
    favouriteGenre: String!
    id: ID!
  }
  type Token {
    value: String!
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
    me: (root, args, context) => {
      return context.currentUser;
    },
  },
  Book: {
    author: async (root) => await Author.findById(root.author),
  },
  Mutation: {
    addBook: async (root, args, context) => {
      const currentUser = context.currentUser;

      if (!currentUser) {
        throw new AuthenticationError("not authenticated");
      }

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
        try {
          await newBook.save();
        } catch (error) {
          throw new UserInputError(error.message, {
            invalidArgs: args,
          });
        }
        return newBook;
      }
    },
    editAuthor: async (root, args, context) => {
      
      const currentUser = context.currentUser;
      if (!currentUser) {
        throw new AuthenticationError("not authenticated");
      }

      let author = await Author.findOne({ name: args.name }).populate();
      if (author) {
        author.born = args.setBornTo;
        try {
          await author.update();
        } catch (error) {
          throw new UserInputError(error.message, {
            invalidArgs: args,
          });
        }
        return author;
      }
    },
    createUser: async (root, args) => {
      const user = new User({ username: args.username, favouriteGenre: args.favouriteGenre });

      return user.save().catch((error) => {
        throw new UserInputError(error.message, {
          invalidArgs: args,
        });
      });
    },
    //As you can see, this is not a good way for production. It's like this just for the shake of learning.
    //You should encrypt the password and compare the hashes using for example bcrypt, as seen on chapter 4 on this course
    login: async (root, args) => {
      const user = await User.findOne({ username: args.username });

      if (!user || args.password !== "secret") {
        throw new UserInputError("wrong credentials");
      }

      const userForToken = {
        username: user.username,
        id: user._id,
      };

      return { value: jwt.sign(userForToken, JWT_SECRET) };
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
  context: async ({ req }) => {
    const auth = req ? req.headers.authorization : null;
    if (auth && auth.toLowerCase().startsWith("bearer ")) {
      const decodedToken = jwt.verify(auth.substring(7), JWT_SECRET);
      const currentUser = await User.findById(decodedToken.id).populate();
      return { currentUser };
    }
  },
});

server.listen().then(({ url }) => {
  console.log(`Server ready at ${url}`);
});
