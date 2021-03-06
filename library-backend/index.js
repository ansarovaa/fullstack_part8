const {ApolloServer, UserInputError, AuthenticationError, gql} = require('apollo-server')
const {v1: uuid} = require('uuid')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const Author = require('./models/author')
const Book = require('./models/book')
const User = require('./models/login')
const config = require('./utils/config')
const {PubSub} = require('apollo-server')
const pubsub = new PubSub()

console.log('Connecting to', config.MONGODB_URI)

mongoose
    .connect(config.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => {
        console.log('Connected to MongoDB')
    })
    .catch((error) => {
        console.log('Error connecting to MongoDB:', error.message)
    })
    mongoose.set('debug', true)

const typeDefs = gql `
type Author {
name: String
id: ID!
born: Int
bookCount: Int!
}
type Book {
  title: String
  published: Int!
  author: Author
  id: ID!
  genres: [String]!
}
type User {
    username: String!
    favoriteGenre: String!
    id: ID!
  }
  
  type Token {
    value: String!
  }

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
      published: Int!
      author: String!
      genres: [String]!
    ): Book
    editAuthor(
      name: String!
      born: Int
    ): Author
    createUser(
        username: String!
        favoriteGenre: String!
      ): User
      login(
        username: String!
        password: String!
      ): Token
  }
  
  type Subscription {
    bookAdded: Book!
  }  
`

const resolvers = {
    Query: {
        bookCount: () => Book
            .collection
            .countDocuments(),
        authorCount: () => Author
            .collection
            .countDocuments(),
        allBooks: async(root, args) => {
            let filter = {}
            if (args.genre) {
                filter['genres'] = {
                    $in: [args.genre]
                }
            }
            const books = await Book.find(filter)
            return books
        },
        allAuthors: () => Author.find(),
        me: (root, args, context) => {
            return context.currentUser
        }

    },

    Mutation: {
        addBook: async(root, args, context) => {
            const currentUser = context.currentUser
            if (!currentUser) {
                throw new AuthenticationError("Not authenticated")
            }
            let author = await Author.findOne({name: args.author})
            if (!author) {
                author = new Author({name: args.author, bookCount: 1, born: 0})
                try {
                    await author.save()
                } catch (error) {
                    throw new UserInputError(error.message, {invalidArgs: args})
                }
            } else {
                author.bookCount += 1
                await author.save()
            }

            let book = new Book({title: args.title, published: args.published, genres: args.genres, author: author})
            try {
                await book.save()
            } catch (error) {
                throw new UserInputError(error.message, {invalidArgs: args})
            }
            pubsub.publish('BOOK_ADDED', {bookAdded: book})
            return book
        },
        editAuthor: async(root, args, context) => {
            const currentUser = context.currentUser
            if (!currentUser) {
                throw new AuthenticationError("Not authenticated")
            }
            let author = await Author.findOne({name: args.name})
            if (!author) {
                return null
            }
            author.born = args.born
            try {
                await author.save()
            } catch (error) {
                throw new UserInputError(error.message, {invalidArgs: args})
            }
            return author

        },
        createUser: (root, args) => {
            const user = new User({username: args.username, favoriteGenre: args.favoriteGenre})

            return user
                .save()
                .catch(error => {
                    throw new UserInputError(error.message, {invalidArgs: args})
                })
        },
        login: async(root, args) => {
            const user = await User.findOne({username: args.username})

            if (!user || args.password !== config.PASSWORD) {
                throw new UserInputError("Wrong credentials")
            }

            const userForToken = {
                username: user.username,
                favoriteGenre: user.favoriteGenre,
                id: user._id
            }

            return {
                value: jwt.sign(userForToken, config.JWT_SECRET)
            }
        }
    },
    Subscription: {
        bookAdded: {
            subscribe: () => pubsub.asyncIterator(['BOOK_ADDED'])
        }
    }
}

const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: async({req}) => {
        const auth = req
            ? req.headers.authorization
            : null
        if (auth && auth.toLowerCase().startsWith('bearer ')) {
            const decodedToken = jwt.verify(auth.substring(7), config.JWT_SECRET)
            const currentUser = await User.findById(decodedToken.id)
            return {currentUser}
        }
    }

})

server
    .listen()
    .then(({url, subscriptionsUrl}) => {
        console.log(`Server ready at ${url}`)
        console.log(`Subscription ready at ${subscriptionsUrl}`)
    })