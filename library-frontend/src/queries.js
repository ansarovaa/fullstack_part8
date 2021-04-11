import {gql} from "@apollo/client";

export const ALL_AUTHORS = gql `
  query {
    allAuthors {
      id
      name
      born
    }
  }
`

export const ALL_BOOKS = gql `
  query allBooks($genre: String) {
    allBooks(genre: $genre) {
      id
      title
      published
      author {
        name
      }
      genres
    }
  }
`
export const ADD_BOOK = gql `
mutation addBook($title: String!, $published: Int!, $author: String!, $genres: [String]!) {
  addBook(
    title: $title,
    published: $published,
    author: $author,
    genres: $genres
  ) {
    title
    published
    id
    author {
      name
    }
    genres
  }
}
`
export const EDIT_AUTHOR = gql `
  mutation editAuthor($name: String!, $born: Int!) {
    editAuthor(name: $name, born: $born)  {
      id
      name
      born
      bookCount
    }
  }
`

export const LOGIN = gql `
  mutation login($username: String!, $password: String!) {
    login(username: $username, password: $password)  {
      value
    }
  }
`

export const CURRENT_USER = gql `
  query {
    me  {
      username
      favoriteGenre
    }
  }
`