const {ApolloServer, UserInputError, gql} = require('apollo-server')
const {v1: uuid} = require('uuid')
const mongoose = require('mongoose')
const Author = require('./models/author')
const Book = require('./models/book')
const config = require('./utils/config')

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

    let authors = [
    {
        name: 'Robert Martin',
        id: "afa51ab0-344d-11e9-a414-719c6709cf3e",
        born: 1952
    }, {
        name: 'Martin Fowler',
        id: "afa5b6f0-344d-11e9-a414-719c6709cf3e",
        born: 1963
    }, {
        name: 'Fyodor Dostoevsky',
        id: "afa5b6f1-344d-11e9-a414-719c6709cf3e",
        born: 1821
    }, {
        name: 'Joshua Kerievsky', // birthyear not known
        id: "afa5b6f2-344d-11e9-a414-719c6709cf3e"
    }, {
        name: 'Sandi Metz', // birthyear not known
        id: "afa5b6f3-344d-11e9-a414-719c6709cf3e"
    }
]

/*
 * Saattaisi olla järkevämpää assosioida kirja ja sen tekijä tallettamalla kirjan yhteyteen tekijän nimen sijaan tekijän id
 * Yksinkertaisuuden vuoksi tallennamme kuitenkin kirjan yhteyteen tekijän nimen
*/

let books = [
    {
        title: 'Clean Code',
        published: 2008,
        author: 'Robert Martin',
        id: "afa5b6f4-344d-11e9-a414-719c6709cf3e",
        genres: ['refactoring']
    }, {
        title: 'Agile software development',
        published: 2002,
        author: 'Robert Martin',
        id: "afa5b6f5-344d-11e9-a414-719c6709cf3e",
        genres: ['agile', 'patterns', 'design']
    }, {
        title: 'Refactoring, edition 2',
        published: 2018,
        author: 'Martin Fowler',
        id: "afa5de00-344d-11e9-a414-719c6709cf3e",
        genres: ['refactoring']
    }, {
        title: 'Refactoring to patterns',
        published: 2008,
        author: 'Joshua Kerievsky',
        id: "afa5de01-344d-11e9-a414-719c6709cf3e",
        genres: ['refactoring', 'patterns']
    }, {
        title: 'Practical Object-Oriented Design, An Agile Primer Using Ruby',
        published: 2012,
        author: 'Sandi Metz',
        id: "afa5de02-344d-11e9-a414-719c6709cf3e",
        genres: ['refactoring', 'design']
    }, {
        title: 'Crime and punishment',
        published: 1866,
        author: 'Fyodor Dostoevsky',
        id: "afa5de03-344d-11e9-a414-719c6709cf3e",
        genres: ['classic', 'crime']
    }, {
        title: 'The Demon ',
        published: 1872,
        author: 'Fyodor Dostoevsky',
        id: "afa5de04-344d-11e9-a414-719c6709cf3e",
        genres: ['classic', 'revolution']
    }
]

const typeDefs = gql `
type Author {
name: String!
id: ID!
born: Int
bookCount: Int!
}
type Book {
  title: String
  published: Int!
  author: Author!
  id: ID!
  genres: [String]!
}

  type Query {
    bookCount: Int!
    authorCount: Int!
    allBooks(author: String, genre: String): [Book!]!
    allAuthors: [Author!]!
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
        allBooks: (root, args) => {
            if (!args.author && !args.genre) {
                return Book.find({})
            }

            return books.filter(p => (!args.author || p.author === args.author) && (!args.genre || p.genres.includes(args.genre)))
        },
        allAuthors: () => Author.find()

    },
    Mutation: {
        addBook: async(root, args) => {
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
            return book
        },
        editAuthor: async(root, args) => {
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

        }
    }
}

const server = new ApolloServer({typeDefs, resolvers})

server
    .listen()
    .then(({url}) => {
        console.log(`Server ready at ${url}`)
    })