require("dotenv").config();
const { UserInputError, AuthenticationError } = require("@apollo/server");
const Book = require("./models/book");
const Author = require("./models/author");
const User = require("./models/user");
const jwt = require("jsonwebtoken");
const { PubSub } = require("graphql-subscriptions");
const pubsub = new PubSub();
const JWT_SECRET = process.env.JWT_SECRET;

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
    allGenres: async () => {
      const books = await Book.find().populate("author");
      let differentGenres = [];
      books.forEach((book) => {
        const genres = book.genres;
        genres.forEach((genre) => {
          if (!differentGenres.includes(genre)) {
            differentGenres.push(genre);
          }
        });
      });
      return differentGenres;
    },
    myRecommendedBooks: async (root, args, context) => {
      const me = context.currentUser;
      const books = await Book.find({ genres: me.favouriteGenre }).populate(
        "author"
      );
      return books;
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
        pubsub.publish("BOOK_ADDED", { bookAdded: newBook });
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
      const user = new User({
        username: args.username,
        favouriteGenre: args.favouriteGenre,
      });

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
  Subscription: {
    bookAdded: {
      subscribe: () => pubsub.asyncIterator("BOOK_ADDED"),
    },
  },
};

module.exports = resolvers;
